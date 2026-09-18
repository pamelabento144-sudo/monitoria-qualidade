const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED = new Set(["xlsx", "xls", "csv", "pdf"]);

function extension(name) {
  return String(name || "").split(".").pop().toLowerCase();
}

function starts(buffer, bytes) {
  return bytes.every((b, i) => buffer[i] === b);
}

export function validateUpload(name, buffer) {
  const ext = extension(name);
  if (!ALLOWED.has(ext)) throw Object.assign(new Error("Formato não suportado. Utilize XLSX, XLS, CSV ou PDF."), { statusCode: 400 });
  if (!buffer?.length) throw Object.assign(new Error("Arquivo vazio."), { statusCode: 400 });
  if (buffer.length > MAX_FILE_SIZE) throw Object.assign(new Error("O anexo excede o limite de 4 MB para envio pelo servidor."), { statusCode: 413 });

  let valid = false;
  if (ext === "xlsx") valid = starts(buffer, [0x50, 0x4b, 0x03, 0x04]) || starts(buffer, [0x50, 0x4b, 0x05, 0x06]) || starts(buffer, [0x50, 0x4b, 0x07, 0x08]);
  if (ext === "xls") valid = starts(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (ext === "pdf") valid = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (ext === "csv") valid = !buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0x00);
  if (!valid) throw Object.assign(new Error(`O conteúdo do arquivo não corresponde ao formato .${ext}.`), { statusCode: 400 });
  return { ext, bytes: buffer.length };
}

export function reportTypeFor(ext) {
  return ext === "xlsx" ? "Relatório principal" : "Anexo complementar";
}
