import { json } from "../lib/http.js";
import { getConfig } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido." });
  return json(res, 200, await getConfig());
}
