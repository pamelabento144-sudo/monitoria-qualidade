import { randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";

const PREFIX = "mq-state/";
const HISTORY_KEY = `${PREFIX}import-history.json`;
const DATA_KEY = `${PREFIX}dashboard-data.json`;
const CONFIG_KEY = `${PREFIX}config.json`;

async function findBlob(pathname) {
  const result = await list({ prefix: pathname, limit: 10 });
  return result.blobs.find(blob => blob.pathname === pathname) || null;
}

async function getJson(pathname, fallback) {
  const blob = await findBlob(pathname);
  if (!blob) return fallback;
  const result = await get(blob.url, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return fallback;
  try {
    const response = new Response(result.stream);
    return await response.json();
  } catch {
    return fallback;
  }
}

async function putJson(pathname, value) {
  const payload = JSON.stringify(value);
  await put(pathname, payload, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8"
  });
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
  const safe = String(originalName || "arquivo").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120);
  const pathname = `mq-uploads/${Date.now()}-${safe}`;
  const blob = await put(pathname, buffer, { access: "private", addRandomSuffix: false, contentType });
  return blob;
}
