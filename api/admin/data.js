import { json, readJson } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { addHistory, getDashboardData, putDashboardData, putDashboardSnapshot, updateHistory } from "../../lib/store.js";

function validData(value) {
  return value && Array.isArray(value.monitoring) && Array.isArray(value.criteria) && Array.isArray(value.satisfaction) && Array.isArray(value.tma);
}

const MONTHLY_KEYS = ["monitoring", "criteria", "satisfaction", "tma", "tmaTargets", "skillTma"];
const MONTH_ORDER = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function rowMonth(row) {
  return String(row?.m || "").trim();
}

function incomingMonths(data) {
  const months = new Set();
  for (const key of MONTHLY_KEYS) {
    for (const row of Array.isArray(data?.[key]) ? data[key] : []) {
      const month = rowMonth(row);
      if (month) months.add(month);
    }
  }
  return [...months].sort((a,b)=>{
    const ai=MONTH_ORDER.indexOf(a), bi=MONTH_ORDER.indexOf(b);
    if(ai<0&&bi<0)return a.localeCompare(b,"pt-BR");
    if(ai<0)return 1;if(bi<0)return -1;return ai-bi;
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
  let importId = req.headers["x-import-id"] || "";
  const originalName = decodeURIComponent(req.headers["x-file-name"] || "Relatório_Indicadores_Qualidade.xlsx");
  try {
    if (!importId) {
      const history = await addHistory({ type: "Relatório principal", file: originalName, records: "—", status: "Processando", details: "Planilha processada no navegador; publicação dos dados em andamento." });
      importId = history.id;
    }
    const data = await readJson(req);
    if (!validData(data)) throw Object.assign(new Error("O relatório processado não possui a estrutura esperada."), { statusCode: 400 });
    data.meta = { ...(data.meta || {}), importedAt: data.meta?.importedAt || new Date().toISOString() };

    const current = await getDashboardData();
    if (current && importId) {
      await putDashboardSnapshot(importId, current);
    }
    const months = incomingMonths(data);
    const merged = mergeByMonths(current, data, months);
    merged.meta = { ...(merged.meta || {}), importedAt: data.meta.importedAt, source: data.meta?.source || originalName };

    await putDashboardData(merged);

    const records = Number(req.headers["x-import-records"] || data.monitoring.length || 0);
    const monthLabel = months.length ? months.join(", ") : "períodos do arquivo";
    const details = current
      ? `Meses atualizados: ${monthLabel}. Demais meses preservados no painel.`
      : `Base inicial publicada. Meses: ${monthLabel}.`;
    if (importId) await updateHistory(importId, { records, status: "Sucesso", details, undoAvailable: Boolean(current) });
    return json(res, 200, { ok: true, importedAt: merged.meta.importedAt, records, months, merged: Boolean(current), undoAvailable: Boolean(current) });
  } catch (error) {
    if (importId) await updateHistory(importId, { status: "Erro", details: error.message || "Falha ao publicar os dados." });
    return json(res, error.statusCode || 500, { error: error.message || "Não foi possível atualizar os painéis." });
  }
}
