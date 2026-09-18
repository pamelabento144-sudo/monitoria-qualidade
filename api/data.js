import { json } from "../lib/http.js";
import { getDashboardData } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido." });
  const data = await getDashboardData();
  if (!data) return json(res, 404, { error: "Ainda não há dados persistidos no servidor." });
  return json(res, 200, data);
}
