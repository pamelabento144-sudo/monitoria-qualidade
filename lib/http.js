export function json(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(payload));
}

export async function readBody(req, maxBytes = 22 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw Object.assign(new Error("Arquivo excede o limite permitido."), { statusCode: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req, maxBytes = 15 * 1024 * 1024) {
  const body = await readBody(req, maxBytes);
  try { return JSON.parse(body.toString("utf8") || "{}"); }
  catch { throw Object.assign(new Error("JSON inválido."), { statusCode: 400 }); }
}
