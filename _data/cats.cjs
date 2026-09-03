const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const themes = JSON.parse(readFileSync(join(__dirname, "themes.json"), "utf8"));
const counts = {};

for (const theme of themes) {
  for (const tag of theme.cats || []) counts[tag] = (counts[tag] || 0) + 1;
}

const all = Object.keys(counts).sort();

module.exports = {
  all,
  counts,
  byTag: Object.fromEntries(all.map((tag) => [tag, themes.filter((theme) => (theme.cats || []).includes(tag))])),
};
