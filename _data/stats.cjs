const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const themes = JSON.parse(readFileSync(join(__dirname, "themes.json"), "utf8"));
const real = themes.filter((theme) => !theme.placeholder);
const withDemo = real.filter((theme) => theme.demo);

module.exports = {
  total: themes.length,
  real: real.length,
  withDemo: withDemo.length,
  totalStars: real.reduce((total, theme) => total + (theme.stars || 0), 0),
  tagCount: new Set(themes.flatMap((theme) => theme.cats || [])).size,
  featured: withDemo.slice(0, 6),
};
