---
permalink: false
---
# 76 Awesome Oranges

A hand-picked directory of 76 Eleventy themes by [Adam DJ Brett](https://adamdjbrett.com), built with [BuildAwesome](https://buildawesome.one/) and [Blades CSS](https://blades.ninja/).

- Site: <https://000000076.xyz/>
- Catalog: 79 published themes and 4 clearly marked coming-soon entries

## Local development

Node 22.15 or newer is required.

```bash
npm --prefix .build ci
npm run screenshots
npm run dev
```

Create and verify a production build:

```bash
npm --prefix .build run check
```

Screenshots are fetched as JPEG through the [Eleventy Screenshot API](https://github.com/11ty/api-screenshot), converted to WebP, and kept together in `_public/screenshots/`. The pages serve WebP; the static output is written to `_site/` and can be served by any static host.

## Structure

```text
├── .build/                  BuildAwesome and Eleventy configuration
├── _data/themes.json        Theme records and computed indexes
├── _public/                 CSS, JavaScript, and favicon
├── themes/                  Directory and generated detail pages
├── tags/                    Tag index
├── index.njk                Home page
└── about.njk                About page
```

## Catalog data

Each theme record keeps the fields `slug`, `name`, `display`, `description`, `demo`, `repo`, `stars`, `forks`, `updated`, `topics`, `placeholder`, and `cats`. Edit `_data/themes.json` to replace a coming-soon entry.

## License

MIT. See `LICENSE.md`.
