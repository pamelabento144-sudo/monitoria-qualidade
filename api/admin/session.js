import { json, readJson } from "../../lib/http.js";
import { sessionCookie, validateToken } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  const body = await readJson(req, 32 * 1024);
  if (!validateToken(body.token)) return json(res, 401, { error: "Chave administrativa inválida." });
  return json(res, 200, { ok: true }, { "set-cookie": sessionCookie() });
}
