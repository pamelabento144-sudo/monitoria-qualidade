import { json, readBody } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { addHistory, storeUpload, updateHistory } from "../../lib/store.js";
import { reportTypeFor, validateUpload } from "../../lib/validation.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  if (!isAdmin(req)) return json(res, 401, { error: "Acesso administrativo necessário." });

  const originalName = decodeURIComponent(req.headers["x-file-name"] || "arquivo");
  let history = null;
  try {
    const buffer = await readBody(req);
    const hintedExt = String(originalName).split(".").pop().toLowerCase();
    history = await addHistory({ type: reportTypeFor(hintedExt), file: originalName, records: "—", status: "Processando", details: "Arquivo recebido; validação em andamento." });
    const { ext } = validateUpload(originalName, buffer);
    await updateHistory(history.id, { type: reportTypeFor(ext), details: "Arquivo recebido e validado." });
    const blob = await storeUpload(buffer, originalName, req.headers["content-type"] || "application/octet-stream");
    if (ext !== "xlsx") await updateHistory(history.id, { status: "Sucesso", details: "Anexo validado e armazenado." });
    return json(res, 200, {
      importId: history.id,
      message: "Arquivo validado com sucesso.",
      file: { originalName, uploadedAt: new Date().toISOString(), pathname: blob.pathname }
    });
  } catch (error) {
    if (history?.id) await updateHistory(history.id, { status: "Erro", details: error.message || "Falha ao validar arquivo." });
    return json(res, error.statusCode || 500, { error: error.message || "Não foi possível validar o arquivo." });
  }
}
