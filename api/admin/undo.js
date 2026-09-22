import { json, readJson } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { getDashboardSnapshot, getHistory, putDashboardData, updateHistory } from "../../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  if (!isAdmin(req)) return json(res, 401, { error: "Acesso administrativo necessário." });

  try {
    const body = await readJson(req, 64 * 1024);
    const importId = String(body?.importId || "").trim();
    if (!importId) return json(res, 400, { error: "Importação não informada." });

    const items = await getHistory();
    const latestUndoable = items.find(item =>
      item.status === "Sucesso" &&
      item.undoAvailable === true
    );

    if (!latestUndoable || latestUndoable.id !== importId) {
      return json(res, 409, { error: "Somente a importação principal mais recente pode ser desfeita." });
    }

    const snapshot = await getDashboardSnapshot(importId);
    if (!snapshot) {
      return json(res, 404, { error: "Não foi localizado o estado anterior desta importação." });
    }

    const restoredAt = new Date().toISOString();
    snapshot.meta = {
      ...(snapshot.meta || {}),
      importedAt: restoredAt,
      restoredAt,
      restoredFromImportId: importId
    };

    await putDashboardData(snapshot);
    await updateHistory(importId, {
      status: "Desfeito",
      details: "Importação desfeita. O painel foi restaurado para o estado anterior.",
      undoAvailable: false,
      undoneAt: restoredAt
    });

    return json(res, 200, { ok: true, restoredAt });
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || "Não foi possível desfazer a importação." });
  }
}
