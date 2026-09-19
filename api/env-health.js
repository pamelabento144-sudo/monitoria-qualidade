export default async function handler(req, res) {
  const blobToken = String(process.env.BLOB_READ_WRITE_TOKEN || "");
  const adminToken = String(process.env.ADMIN_TOKEN || "");
  res.statusCode = 200;
  res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("cache-control","no-store");
  res.end(JSON.stringify({
    oidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
    blobToken: Boolean(blobToken),
    blobTokenLooksScoped: blobToken.length > 40,
    blobStoreId: Boolean(process.env.BLOB_STORE_ID),
    adminToken: Boolean(adminToken),
    adminTokenLooksPlaceholder: adminToken === "troque-por-uma-chave-segura",
    vercelEnv: process.env.VERCEL_ENV || null
  }));
}
