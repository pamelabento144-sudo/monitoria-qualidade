import { randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";

const PREFIX = "mq-state/";
const HISTORY_KEY = `${PREFIX}import-history.json`;
const DATA_KEY = `${PREFIX}dashboard-data.json`;
const CONFIG_KEY = `${PREFIX}config.json`;

function blobToken() {
  let value = String(process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  const marker = "BLOB_READ_WRITE_TOKEN=";
  const index = value.indexOf(marker);
  if (index >= 0) value = value.slice(index + marker.length).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value.trim();
}

function blobOptions(extra = {}) {
  const token = blobToken();
  return token ? { ...extra, token } : extra;
}

function blobConfigured() {
  return Boolean(blobToken() || process.env.VERCEL_OIDC_TOKEN);
}

async function findBlob(pathname) {
  if (!blobConfigured()) return null;
  try {
    const result = await list(blobOptions({ prefix: pathname, limit: 10 }));
    return result.blobs.find(blob => blob.pathname === pathname) || null;
  } catch {
    return null;
  }
}

async function getJson(pathname, fallback) {
  try {
    const blob = await findBlob(pathname);
    if (!blob) return fallback;
    const result = await get(blob.url, blobOptions({ access: "private", useCache: false }));
    if (!result || result.statusCode !== 200) return fallback;
    const response = new Response(result.stream);
    return await response.json();
  } catch {
    return fallback;
  }
}

async function putJson(pathname, value) {
  if (!blobConfigured()) {
    throw Object.assign(new Error("O Blob ainda não está conectado ao projeto."), { statusCode: 503 });
  }
  const payload = JSON.stringify(value);
  await put(pathname, payload, blobOptions({
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  }));
  return value;
}

export const getDashboardData = () => getJson(DATA_KEY, null);
export const putDashboardData = (value) => putJson(DATA_KEY, value);
export const getConfig = () => getJson(CONFIG_KEY, { qualityTarget: 90, satisfactionTarget: 90, maxFileSizeMB: 30 });
export const putConfig = (value) => putJson(CONFIG_KEY, value);
export const getHistory = () => getJson(HISTORY_KEY, []);
export const putHistory = (value) => putJson(HISTORY_KEY, value.slice(0, 100));

export async function addHistory(entry) {
  const items = await getHistory();
  const next = [{ id: randomUUID(), dateTime: new Date().toISOString(), ...entry }, ...items].slice(0, 100);
  await putHistory(next);
  return next[0];
}

export async function updateHistory(id, patch) {
  if (!id) return null;
  const items = await getHistory();
  let updated = null;
  const next = items.map(item => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
    return updated;
  });
  await putHistory(next);
  return updated;
}

export async function storeUpload(buffer, originalName, contentType = "application/octet-stream") {
  if (!blobConfigured()) {
    throw Object.assign(new Error("O Blob ainda não está conectado ao projeto."), { statusCode: 503 });
  }
  const safe = String(originalName || "arquivo").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
  const pathname = `mq-uploads/${Date.now()}-${safe}`;
  return put(pathname, buffer, blobOptions({ access: "private", addRandomSuffix: false, contentType }));
}
