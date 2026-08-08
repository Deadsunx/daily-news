#!/usr/bin/env node
// Zero-dependency build for the Daily News site.
// Scans every news-YYYY-MM-DD.json in the repo root, produces manifest.json,
// and assembles a clean ./dist folder ready for GitHub Pages.

import { readdir, readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

const DATE_RE = /^news-(\d{4}-\d{2}-\d{2})\.json$/;

function log(...a) {
  console.log("[build]", ...a);
}

async function main() {
  const entries = await readdir(ROOT);
  const jsonFiles = entries
    .map((f) => {
      const m = f.match(DATE_RE);
      return m ? { file: f, date: m[1] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  if (jsonFiles.length === 0) {
    throw new Error("No news-YYYY-MM-DD.json files found in " + ROOT);
  }

  const editions = [];
  for (const { file, date } of jsonFiles) {
    let data;
    try {
      data = JSON.parse(await readFile(path.join(ROOT, file), "utf8"));
    } catch (err) {
      console.error(`[build] Skipping ${file}: invalid JSON — ${err.message}`);
      continue;
    }
    const stories = Array.isArray(data.stories) ? data.stories : [];
    const categories = [...new Set(stories.map((s) => s.category).filter(Boolean))];
    const mdFile = `news-${date}.md`;
    editions.push({
      date,
      file,
      md: existsSync(path.join(ROOT, mdFile)) ? mdFile : null,
      generated_at: data.generated_at || null,
      count: stories.length,
      categories,
      headline: stories[0]?.title || null,
    });
  }

  const manifest = {
    site: "Daily News",
    built_at: new Date().toISOString(),
    latest: editions[0]?.date || null,
    count: editions.length,
    editions,
  };

  // Assemble dist/
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  await writeFile(path.join(DIST, "manifest.json"), JSON.stringify(manifest, null, 2));
  await copyFile(path.join(ROOT, "index.html"), path.join(DIST, "index.html"));
  await writeFile(path.join(DIST, ".nojekyll"), "");

  // Copy every edition's json + md so the site can fetch them at runtime.
  for (const ed of editions) {
    await copyFile(path.join(ROOT, ed.file), path.join(DIST, ed.file));
    if (ed.md) await copyFile(path.join(ROOT, ed.md), path.join(DIST, ed.md));
  }

  log(`Wrote ${editions.length} edition(s) to dist/. Latest: ${manifest.latest}`);
}

main().catch((err) => {
  console.error("[build] FAILED:", err.message);
  process.exit(1);
});
