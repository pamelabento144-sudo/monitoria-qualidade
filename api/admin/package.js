import { gunzipSync } from "node:zlib";
import { json, readBody } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import {
  addHistory,
  getDashboardData,
  putDashboardData,
  putDashboardSnapshot,
  updateHistory
} from "../../lib/store.js";

const MONTHLY_KEYS = ["monitoring", "criteria", "satisfaction", "tma", "tmaTargets", "skillTma"];
const MONTH_ORDER = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function validData(value) {
  return value &&
    value.meta?.packageType === "historical-consolidated" &&
    Number(value.meta?.packageVersion) === 1 &&
    Array.isArray(value.monitoring) &&
    Array.isArray(value.criteria) &&
    Array.isArray(value.satisfaction) &&
    Array.isArray(value.tma) &&
    Array.isArray(value.tmaTargets) &&
    Array.isArray(value.skillTma);
}

function rowMonth(row) {
  return String(row?.m || "").trim();
}

function incomingMonths(data) {
  const months = new Set();
  for (const key of MONTHLY_KEYS) {
    for (const row of data[key]) {
      const month = rowMonth(row);
      if (month) months.add(month);
    }
  }
  return [...months].sort((a,b) => {
    const ai = MONTH_ORDER.indexOf(a), bi = MONTH_ORDER.indexOf(b);
    if (ai < 0 && bi < 0) return a.localeCompare(b, "pt-BR");
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}

function mergeByMonths(current, incoming, months) {
  if (!current || !months.length) return incoming;
  const monthSet = new Set(months);
  const merged = {
    ...current,
    ...incoming,
    meta: { ...(current.meta || {}), ...(incoming.meta || {}) },
    supervisors: Array.isArray(incoming.supervisors) && incoming.supervisors.length
      ? incoming.supervisors
      : (Array.isArray(current.supervisors) ? current.supervisors : [])
  };
  for (const key of MONTHLY_KEYS) {
    const previous = Array.isArray(current[key]) ? current[key] : [];
    const fresh = Array.isArray(incoming[key]) ? incoming[key] : [];
    merged[key] = [
      ...previous.filter(row => !monthSet.has(rowMonth(row))),
      ...fresh
    ];
  }
  return merged;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  if (!isAdmin(req)) return json(res, 401, { error: "Acesso administrativo necessário." });

  const originalName = decodeURIComponent(req.headers["x-file-name"] || "Pacote_Historico.json.gz");
  let importId = "";

  try {
    if (!originalName.toLowerCase().endsWith(".json.gz")) {
      throw Object.assign(new Error("Pacote inválido. Selecione o arquivo histórico .json.gz preparado para o painel."), { statusCode: 400 });
    }

    const history = await addHistory({
      type: "Pacote histórico",
      file: originalName,
      records: "—",
      status: "Processando",
      details: "Validando e consolidando o pacote histórico."
    });
    importId = history.id;

    const compressed = await readBody(req, 4 * 1024 * 1024);
    let unpacked;
    try {
      unpacked = gunzipSync(compressed);
    } catch {
      throw Object.assign(new Error("O pacote histórico está corrompido ou não está no formato JSON.GZ esperado."), { statusCode: 400 });
    }

    if (unpacked.length > 30 * 1024 * 1024) {
      throw Object.assign(new Error("O conteúdo descompactado do pacote excede o limite de 30 MB."), { statusCode: 413 });
    }

    let data;
    try {
      data = JSON.parse(unpacked.toString("utf8"));
    } catch {
      throw Object.assign(new Error("O conteúdo do pacote histórico não contém um JSON válido."), { statusCode: 400 });
    }

    if (!validData(data)) {
      throw Object.assign(new Error("O pacote histórico não possui a estrutura ou versão esperada pelo painel."), { statusCode: 400 });
    }

    const months = incomingMonths(data);
    if (!months.length) {
      throw Object.assign(new Error("O pacote histórico não contém meses válidos para importação."), { statusCode: 400 });
    }

    const invalidRows = MONTHLY_KEYS.reduce((total, key) =>
      total + data[key].filter(row => !rowMonth(row)).length, 0);
    if (invalidRows) {
      throw Object.assign(new Error(`O pacote contém ${invalidRows} registro(s) sem mês de referência.`), { statusCode: 400 });
    }

    const current = await getDashboardData();
    if (current) await putDashboardSnapshot(importId, current);

    const importedAt = new Date().toISOString();
    data.meta = {
      ...(data.meta || {}),
      importedAt,
      source: originalName
    };

    const merged = mergeByMonths(current, data, months);
    merged.meta = {
      ...(merged.meta || {}),
      importedAt,
      source: originalName
    };

    await putDashboardData(merged);

    const records = data.monitoring.length;
    const monthLabel = months.join(", ");
    await updateHistory(importId, {
      records,
      status: "Sucesso",
      details: `Pacote histórico consolidado importado. Meses atualizados: ${monthLabel}. Demais meses preservados.`,
      undoAvailable: Boolean(current)
    });

    return json(res, 200, {
      ok: true,
      importedAt,
      records,
      months,
      merged: Boolean(current),
      undoAvailable: Boolean(current),
      packageType: data.meta.packageType,
      packageVersion: data.meta.packageVersion
    });
  } catch (error) {
    if (importId) {
      await updateHistory(importId, {
        status: "Erro",
        details: error.message || "Falha ao importar o pacote histórico.",
        undoAvailable: false
      });
    }
    return json(res, error.statusCode || 500, { error: error.message || "Não foi possível importar o pacote histórico." });
  }
}
