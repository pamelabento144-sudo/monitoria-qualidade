import { del, get, put } from "@vercel/blob";

export default async function handler(req, res) {
  const pathname = `mq-health/${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  try {
    const payload = "blob-health-ok";
    const blob = await put(pathname, payload, {
      access: "private",
      addRandomSuffix: false,
      contentType: "text/plain; charset=utf-8"
    });
    const result = await get(blob.url, { access: "private", useCache: false });
    const value = result ? await new Response(result.stream).text() : "";
    await del(blob.url);
    res.statusCode = 200;
    res.setHeader("content-type","application/json; charset=utf-8");
    res.setHeader("cache-control","no-store");
    res.end(JSON.stringify({ ok: value === payload, write: true, read: value === payload, cleanup: true }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type","application/json; charset=utf-8");
    res.setHeader("cache-control","no-store");
    res.end(JSON.stringify({ ok:false, error:error?.message || "Falha no teste do Blob" }));
  }
}
