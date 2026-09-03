<div align="center">

# TabelaPort

A SvelteKit portfolio template with a **data-driven** approach: every section,
entry and text lives in JSON files under `src/lib/data/`, so you fill in your
own info and ship. Powered by the [TabelaWebUI](https://github.com/TAbelhaDev/tabelawebui)
design system (Catppuccin Latte/Mocha, "reading someone's source file" aesthetic),
multi-language (PT-BR/EN) via [Paraglide](https://inlang.com/), and deployable to
Cloudflare Workers in minutes.

**English** · [Português](README.pt-BR.md)

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Built with tabelawebui](https://img.shields.io/badge/theme-tabelawebui-d6b4f7?style=flat-square)](https://github.com/TAbelhaDev/tabelawebui)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## Features

- **Fill-in-the-blank content** — all data in `src/lib/data/<feature>/<locale>.json`
- **Configurable sections** — add/remove/reorder pages by editing one array in
  `src/lib/data/sections.ts` (routes and nav follow automatically)
- **CV generation** — `bun run cv` compiles a `cv.typ` resume (via [Typst](https://typst.app))
  for each language/profile, named after your `personal.json` name
- **i18n** — PT-BR and EN out of the box (see `messages/` and `project.inlang/`)
- **Dark/light theme** — from TabelaWebUI
- **Zero backend** — static site, deploys to Cloudflare Workers

## Quick start

```sh
# 1. install
bun install

# 2. fill in your data (see below)
#    src/lib/data/personal/en.json        -> your name, summary
#    src/lib/data/contacts/en.json        -> your contact links
#    src/lib/data/*/en.json               -> your content (both locales!)

# 3. your photo
#    replace src/lib/assets/photo.svg with your own picture

# 4. generate your CV PDFs
bun run cv

# 5. develop / build / deploy
bun run dev          # local dev
bun run build        # production build (Cloudflare Workers)
bun run deploy       # deploy to Cloudflare Workers
```

> Tip: `bun run prepare-deploy` does `cv + format + build` in one go.

## Customizing

### Your data

Every section is a folder under `src/lib/data/` with one file per locale:

```
src/lib/data/
├── personal/        your name + summary (used for the logo, CV name, photo alt)
├── contacts/        mailto:/github/linkedin links (home page)
├── about/           about page "cards"
├── projects/        featured / all projects
├── experiences/     jobs
├── education/       degrees
├── achievements/    awards, exams, milestones
└── teaching/        tutoring / teaching roles
```

Entries follow the `Experience` shape (`src/lib/interfaces/experience.ts`):
`title`, `subtitle`, `start`/`end` (YYYY-MM), `location`, `details[]`, `skills[]`,
optional `link` and `featured` (projects).

### Sections (routes + nav)

`src/lib/data/sections.ts` drives the navigation and the dynamic route. Each entry
is `{ key, label, type, feature }`:

- `key` — the URL segment (e.g. `/projects`)
- `label` — nav label, resolved from the `nav_<key>` i18n message
- `type` — `cards` (about-style) or `timeline` (list)
- `feature` — the data folder that feeds it

Remove a section by deleting its entry (and optionally its data folder). Add one
by adding an entry + a `data/<feature>/` folder. No route files to touch.

### CV

`src/lib/data/cv.typ` is the Typst resume template. It reads the same JSON files
as the site and supports filtering by profile (`dev`, `tutor`, `all`) and tags:

```sh
bun run cv                     # all profiles x locales
bun run cv:dev-en              # single combo
bash scripts/cv-vaga.sh pt "tag1,tag2" slug   # filtered CV
```

Output filenames are built from your `personal.json` name, e.g. `Jane_Doe_CV_en.pdf`.

### i18n

UI strings (nav, home page) live in `messages/<locale>.json`. Add/remove locales
in `project.inlang/settings.json`. Content translations live in the data folders.

## Stack

SvelteKit 5 · Svelte 5 · Tailwind CSS 4 · TabelaWebUI · Paraglide JS · Typst ·
Cloudflare Workers

## License

[AGPL-3.0](LICENSE)
