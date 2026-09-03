import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "_site");
const screenshots = join(root, "_public", "screenshots");
const themes = JSON.parse(readFileSync(join(root, "_data", "themes.json"), "utf8"));

assert(!existsSync(join(root, ".build", "_site")), "build output must live at root _site, not .build/_site");

for (const omitted of [".github", "admin", "LICENSE", "media"]) {
  assert(!existsSync(join(output, omitted)), `build must omit ${omitted}`);
}

assert(themes.length >= 76, "catalog must contain at least 76 themes");
assert.equal(new Set(themes.map(({ slug }) => slug)).size, themes.length, "theme slugs must be unique");
assert.equal(themes.filter(({ placeholder }) => placeholder).length, 4, "catalog must retain four placeholders");
const repos = themes.map(({ repo }) => repo.toLowerCase().replace(/\.git$/, "").replace(/\/$/, "")).filter(Boolean);
assert.equal(new Set(repos).size, repos.length, "published theme repositories must be unique");
assert(repos.every((repo) => repo.startsWith("https://github.com/adamdjbrett/")), "published themes must belong to github.com/adamdjbrett");
assert.equal(readdirSync(screenshots).filter((name) => name.endsWith(".jpg")).length, themes.length, "every theme must have a JPEG screenshot");
assert.equal(readdirSync(screenshots).filter((name) => name.endsWith(".webp")).length, themes.length, "every theme must have a WebP screenshot");

const required = ["slug", "name", "display", "description", "demo", "repo", "stars", "forks", "updated", "topics", "placeholder", "cats"];
for (const theme of themes) {
  const jpg = readFileSync(join(screenshots, `${theme.slug}.jpg`));
  const webp = readFileSync(join(screenshots, `${theme.slug}.webp`));
  assert(jpg.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])), `${theme.slug}.jpg must be JPEG`);
  assert.equal(webp.subarray(0, 4).toString(), "RIFF", `${theme.slug}.webp must be WebP`);
  assert.equal(webp.subarray(8, 12).toString(), "WEBP", `${theme.slug}.webp must be WebP`);
  assert.deepEqual(Object.keys(theme).sort(), [...required].sort(), `${theme.slug} has an unexpected schema`);
}

const themeOutput = join(output, "themes");
const generatedThemes = readdirSync(themeOutput).filter((name) => statSync(join(themeOutput, name)).isDirectory());
assert.equal(generatedThemes.length, themes.length, "build must emit one detail directory per theme");

const directoryHtml = readFileSync(join(themeOutput, "index.html"), "utf8");
assert.equal(directoryHtml.match(/class="theme-card/g)?.length, themes.length, "directory must render one card per theme");

const sitemap = readFileSync(join(output, "sitemap.xml"), "utf8");
assert(!sitemap.includes("000000076.xyz//"), "sitemap URLs must not contain a double slash");

for (const theme of themes) {
  const html = readFileSync(join(themeOutput, theme.slug, "index.html"), "utf8");
  assert(html.includes(`/screenshots/${theme.slug}.webp`), `${theme.slug} must display its WebP screenshot`);
  assert(html.includes(`<title>${theme.display} | 76 Awesome Oranges</title>`), `${theme.slug} must have a unique title`);
  assert(sitemap.includes(`https://000000076.xyz/themes/${theme.slug}/`), `${theme.slug} must appear in the sitemap`);
  if (theme.placeholder) {
    assert(html.includes("coming soon"), `${theme.slug} must be marked coming soon`);
    assert(!html.includes("# Clone this theme"), `${theme.slug} must not show clone instructions`);
  }
}

for (const file of walk(output).filter((path) => path.endsWith(".html"))) {
  const html = readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = href.endsWith("/") ? join(output, href, "index.html") : join(output, href);
    assert(existsSync(target), `${file.slice(output.length)} links to missing ${href}`);
  }
}

checkFilter();

console.log(`Verified ${themes.length} themes, generated routes, metadata, sitemap, screenshots, internal links, placeholders, and filters.`);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : path;
  });
}

function checkFilter() {
  const cards = themes.map((theme) => ({
    dataset: { tags: theme.cats.join(" "), name: `${theme.display} ${theme.name}`, desc: theme.description },
    style: {},
  }));
  const search = listenerTarget();
  const buttons = ["all", "academic"].map((tag) => ({
    ...listenerTarget(),
    dataset: { tagFilter: tag },
    classList: classList(tag === "all"),
    setAttribute(name, value) { this[name] = value; },
  }));
  const count = { textContent: "" };
  let empty;
  const parentElement = {
    querySelector: () => empty,
    appendChild: (element) => { empty = element; },
  };
  const document = {
    querySelector(selector) {
      return { "[data-theme-grid]": { parentElement, querySelectorAll: () => cards }, "[data-theme-search]": search, "[data-visible-count]": count }[selector];
    },
    querySelectorAll: () => buttons,
    createElement: () => ({
      className: "",
      textContent: "",
      setAttribute(name, value) { this[name] = value; },
      remove() { empty = undefined; },
    }),
  };

  runInNewContext(readFileSync(join(root, "_public", "js", "filter.js"), "utf8"), { document });
  assert.equal(Number(count.textContent), themes.length, "filter must initially show every theme");

  search.input({ target: { value: "definitely-not-a-theme" } });
  assert.equal(Number(count.textContent), 0, "search must support a zero-results state");
  assert.equal(empty.role, "status", "zero-results feedback must be announced");

  search.input({ target: { value: "" } });
  buttons[1].click();
  assert.equal(Number(count.textContent), themes.filter(({ cats }) => cats.includes("academic")).length, "tag filter must update the result count");

  search.input({ target: { value: "port" } });
  const expected = themes.filter((theme) => theme.cats.includes("academic") && [theme.display, theme.name, theme.description, ...theme.cats].some((value) => value.toLowerCase().includes("port"))).length;
  assert.equal(Number(count.textContent), expected, "search and tag filters must combine");
}

function listenerTarget() {
  return {
    addEventListener(type, listener) { this[type] = listener; },
  };
}

function classList(active) {
  const classes = new Set(active ? ["active"] : []);
  return {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
  };
}
