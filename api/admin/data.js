import { json, readJson } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { addHistory, putDashboardData, updateHistory } from "../../lib/store.js";

function validData(value) {
  return value && Array.isArray(value.monitoring) && Array.isArray(value.criteria) && Array.isArray(value.satisfaction) && Array.isArray(value.tma);
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
    await putDashboardData(data);
    const records = Number(req.headers["x-import-records"] || data.monitoring.length || 0);
    if (importId) await updateHistory(importId, { records, status: "Sucesso", details: "Dados publicados e painéis atualizados." });
    return json(res, 200, { ok: true, importedAt: data.meta.importedAt, records });
  } catch (error) {
    if (importId) await updateHistory(importId, { status: "Erro", details: error.message || "Falha ao publicar os dados." });
    return json(res, error.statusCode || 500, { error: error.message || "Não foi possível atualizar os painéis." });
  }
}
