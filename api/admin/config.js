import { json, readJson } from "../../lib/http.js";
import { isAdmin } from "../../lib/auth.js";
import { getConfig, putConfig } from "../../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  if (!isAdmin(req)) return json(res, 401, { error: "Acesso administrativo necessário." });
  const body = await readJson(req, 64 * 1024);
  const qualityTarget = Number(body.qualityTarget);
  const satisfactionTarget = Number(body.satisfactionTarget);
  if (![qualityTarget, satisfactionTarget].every(v => Number.isFinite(v) && v >= 0 && v <= 100)) return json(res, 400, { error: "As metas devem estar entre 0 e 100." });
  const current = await getConfig();
  const next = { ...current, qualityTarget, satisfactionTarget };
  await putConfig(next);
  return json(res, 200, next);
}
