import { del, get, put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok:false, error:"Método não permitido" }));
  }
  const pathname = `mq-health/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  try {
    const payload = "blob-health-ok";
    const blob = await put(pathname, payload, {
      access: "private",
      addRandomSuffix: false,
      contentType: "text/plain; charset=utf-8"
    });
    const result = await get(blob.url, { access: "private", useCache: false });
    const text = result ? await new Response(result.stream).text() : "";
    await del(blob.url);
    res.statusCode = 200;
    res.setHeader("content-type","application/json; charset=utf-8");
    res.setHeader("cache-control","no-store");
    return res.end(JSON.stringify({ ok: text === payload, write: true, read: text === payload, cleanup: true }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type","application/json; charset=utf-8");
    res.setHeader("cache-control","no-store");
    return res.end(JSON.stringify({ ok:false, error:error?.message || "Falha no teste do Blob" }));
  }
}
