// Tiny static file server for local preview of ./dist. No dependencies.
// Usage: node scripts/serve.mjs   (serves http://localhost:4178)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const PORT = process.env.PORT || 4178;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel === "/" || rel === "") rel = "/index.html";
    const file = path.join(DIST, path.normalize(rel).replace(/^([/\\])+/, ""));
    if (!file.startsWith(DIST)) { res.writeHead(403).end("forbidden"); return; }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}`));
