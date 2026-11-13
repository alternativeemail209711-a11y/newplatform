// Launcher: unpacks app.pack (the whole platform) next to this file, then starts it.
// Files under data/ are NEVER overwritten once they exist (your saved settings/records are safe).
import fs from "fs"; import path from "path"; import zlib from "zlib"; import crypto from "crypto";
import os from "os"; import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PACK = path.join(ROOT, "app.pack");

function readPack() {
  const raw = zlib.brotliDecompressSync(fs.readFileSync(PACK));
  const mlen = raw.readUInt32BE(0);
  const manifest = JSON.parse(raw.subarray(4, 4 + mlen).toString("utf8"));
  let off = 4 + mlen; const items = [];
  for (const m of manifest) { items.push({ name: m.n, buf: raw.subarray(off, off + m.s) }); off += m.s; }
  return items;
}
function isMine(dir) { try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; } }

function unpack(target) {
  const hash = crypto.createHash("sha256").update(fs.readFileSync(PACK)).digest("hex");
  const stamp = path.join(target, ".packhash"), listFile = path.join(target, ".packfiles.json");
  const items = readPack();
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8") === hash && fs.existsSync(path.join(target, "server.js"))) {
    // verify nothing is missing (code files only)
    if (items.every(i => i.name.startsWith("data/") || fs.existsSync(path.join(target, i.name)))) return;
  }
  // remove code files that belonged to an older pack but not this one
  try { for (const old of JSON.parse(fs.readFileSync(listFile, "utf8"))) {
    if (!old.startsWith("data/") && !items.some(i => i.name === old)) { try { fs.unlinkSync(path.join(target, old)); } catch {} } } } catch {}
  for (const it of items) {
    const dest = path.join(target, it.name);
    if (it.name.startsWith("data/") && fs.existsSync(dest)) continue; // keep user data
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, it.buf);
  }
  fs.writeFileSync(listFile, JSON.stringify(items.map(i => i.name)));
  fs.writeFileSync(stamp, hash);
  console.log(`[launcher] unpacked ${items.length} files into ${target}`);
}

let APP = path.join(ROOT, "app");
if (!isMine(APP)) { // read-only install folder: fall back to temp dir, link node_modules so imports still resolve
  APP = path.join(os.tmpdir(), "craft-app");
  fs.mkdirSync(APP, { recursive: true });
  const nm = path.join(APP, "node_modules");
  if (!fs.existsSync(nm)) { try { fs.symlinkSync(path.join(ROOT, "node_modules"), nm, "junction"); } catch {} }
  try { fs.copyFileSync(path.join(ROOT, "package.json"), path.join(APP, "package.json")); } catch {}
}
unpack(APP);
await import(pathToFileURL(path.join(APP, "server.js")).href);
