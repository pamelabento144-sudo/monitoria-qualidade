import crypto from "node:crypto";

const COOKIE_NAME = "mq_admin";
const MAX_AGE = 60 * 60 * 8;

function digest(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function parseCookies(request) {
  const raw = request.headers.cookie || "";
  return Object.fromEntries(raw.split(";").map(v => v.trim()).filter(Boolean).map(part => {
    const i = part.indexOf("=");
    return i < 0 ? [part, ""] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
  }));
}

export function isAdmin(request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const cookies = parseCookies(request);
  const expected = digest(token);
  const supplied = cookies[COOKIE_NAME] || "";
  if (supplied.length !== expected.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected)); }
  catch { return false; }
}

export function validateToken(token) {
  const configured = process.env.ADMIN_TOKEN || "";
  if (!configured || !token) return false;
  const a = Buffer.from(digest(token));
  const b = Buffer.from(digest(configured));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function sessionCookie() {
  return `${COOKIE_NAME}=${digest(process.env.ADMIN_TOKEN)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
