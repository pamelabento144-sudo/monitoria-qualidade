import { json } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { getDashboardData, getHistory } from "../../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Método não permitido." });
  if (!isAdmin(req)) return json(res, 200, { admin: false });
  const [history, data] = await Promise.all([getHistory(), getDashboardData()]);
  const last = history[0] || null;
  return json(res, 200, {
    admin: true,
    lastUpdated: data?.meta?.importedAt || last?.dateTime || null,
    upload: last ? { originalName: last.file, uploadedAt: last.dateTime } : null
  });
}
