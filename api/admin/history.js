import { json, readJson } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { addHistory, getHistory, updateHistory } from "../../lib/store.js";

export default async function handler(req, res) {
  if (!isAdmin(req)) return json(res, 401, { error: "Acesso administrativo necessário." });
  if (req.method === "GET") {
    const items = await getHistory();
    const latestUndoable = items.find(item =>
      item.type === "Relatório principal" &&
      item.status === "Sucesso" &&
      item.undoAvailable === true
    );
    return json(res, 200, {
      items: items.map(item => ({ ...item, canUndo: Boolean(latestUndoable && item.id === latestUndoable.id) }))
    });
  }
  if (req.method === "POST") {
    const body = await readJson(req, 128 * 1024);
    const patch = {
      type: body.type || "Relatório principal",
      file: body.file || "—",
      records: body.records ?? "—",
      status: body.status || "Erro",
      details: String(body.details || "Falha durante o processamento.").slice(0, 500)
    };
    const item = body.importId ? await updateHistory(body.importId, patch) : await addHistory(patch);
    return json(res, 200, { ok: true, item });
  }
  return json(res, 405, { error: "Método não permitido." });
}
