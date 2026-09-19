export default async function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("cache-control","no-store");
  res.end(JSON.stringify({
    oidc: Boolean(process.env.VERCEL_OIDC_TOKEN),
    blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    blobStoreId: Boolean(process.env.BLOB_STORE_ID),
    vercelEnv: process.env.VERCEL_ENV || null
  }));
}
