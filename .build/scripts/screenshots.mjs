import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = resolve(root, "_public/screenshots");
const themes = JSON.parse(await readFile(resolve(root, "_data/themes.json"), "utf8"));
const force = process.argv.includes("--force");
let next = 0;
let fallbacks = 0;
let generated = 0;
let cached = 0;

await mkdir(output, { recursive: true });
await Promise.all(Array.from({ length: 4 }, worker));
console.log(`Screenshots ready: ${themes.length} pairs (${generated - fallbacks} captured, ${fallbacks} fallbacks, ${cached} cached).`);

async function worker() {
  while (next < themes.length) {
    const theme = themes[next++];
    const jpg = resolve(output, `${theme.slug}.jpg`);
    const webp = resolve(output, `${theme.slug}.webp`);
    if (!force && await exists(jpg) && await exists(webp)) {
      cached += 1;
      continue;
    }

    generated += 1;

    const source = theme.demo || theme.repo;
    try {
      if (theme.cats.includes("private")) throw new Error("private repository");
      if (!source) throw new Error("no published URL");
      const endpoint = `https://v1.screenshot.11ty.dev/${encodeURIComponent(source)}/medium/1:1/x.jpg`;
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(30000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        throw new Error(`Screenshot API returned ${response.status}`);
      }
      await writeFile(jpg, Buffer.from(await response.arrayBuffer()));
      await sharp(jpg)
        .resize(650, 406, { fit: "cover", position: "top" })
        .webp({ quality: 80 })
        .toFile(webp);
      console.log(`captured ${theme.slug}`);
    } catch (error) {
      fallbacks += 1;
      await placeholder(theme, jpg, webp);
      console.warn(`fallback ${theme.slug}: ${error.message}`);
    }
  }
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function placeholder(theme, jpg, webp) {
  const title = escapeXml(theme.display);
  const status = theme.placeholder ? "COMING SOON" : theme.cats.includes("private") ? "PRIVATE REPOSITORY" : "PREVIEW UNAVAILABLE";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="650" height="406" viewBox="0 0 650 406"><rect width="650" height="406" fill="#fff8ed"/><circle cx="520" cy="108" r="74" fill="#c94b13"/><path d="M520 34c18-28 44-34 68-22-12 26-36 38-68 22Z" fill="#4d7a2c"/><text x="48" y="286" fill="#372a22" font-family="Georgia,serif" font-size="42" font-weight="700">${title}</text><text x="50" y="326" fill="#875f49" font-family="Arial,sans-serif" font-size="16" font-weight="700" letter-spacing="3">${status}</text></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(jpg);
  await sharp(jpg).webp({ quality: 80 }).toFile(webp);
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]);
}
