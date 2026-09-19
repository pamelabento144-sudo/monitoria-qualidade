import { del, get, put } from "@vercel/blob";

const pathname = `mq-health/build-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
const payload = "blob-build-health-ok";

try {
  const blob = await put(pathname, payload, {
    access: "private",
    addRandomSuffix: false,
    contentType: "text/plain; charset=utf-8"
  });
  const result = await get(blob.url, { access: "private", useCache: false });
  const text = result ? await new Response(result.stream).text() : "";
  if (text !== payload) throw new Error("Blob read-back mismatch");
  await del(blob.url);
  console.log("BLOB_HEALTH_OK");
} catch (error) {
  console.error("BLOB_HEALTH_FAIL", error?.message || error);
  process.exit(1);
}
