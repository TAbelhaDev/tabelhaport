# TAbelhaPort — guide for agents working on this repo

TAbelhaPort is a **data-driven portfolio template**. The structure is generic;
every piece of personal content lives in JSON. This file orients agents so they
don't invent parallel structures.

## Layout

- `src/lib/data/<feature>/<locale>.json` — all content (the only thing a user
  normally edits). Locales: `en`, `pt-br`.
- `src/lib/data/sections.ts` — which sections exist, their order, type
  (`cards` | `timeline`) and which data feature feeds them. The nav and the
  dynamic route (`src/routes/[section=section]/+page.svelte`) follow this file.
- `src/lib/data/paraglide-adapter.ts` — locale-aware accessor `getLocaleData()`
  for the data folders.
- `src/lib/cv.ts` — `personalName()`, `personalNameSlug()`, `cvFilename()`.
- `src/lib/data/cv.typ` — Typst resume template, reads the same JSON files.
- `messages/<locale>.json` — UI strings (nav labels, home page).
- `scripts/cv.mjs` — CV generation (output filename from `personal.json` name).

## Conventions

- **Data over code**: content goes in JSON, not in Svelte components or `messages/`.
  If a page needs a new piece of content, add a field/folder under `src/lib/data/`
  first, then wire the UI to read it.
- **Sections come from `sections.ts`**: don't hardcode nav routes in components.
  Adding a section = one entry in `sections.ts` + a `data/<feature>/` folder.
- **Design system is TabelaWebUI**: reuse components from the `tabelhawebui`
  package. If something is missing, open a feature request in the TabelaWebUI
  repo (`~/codigo/tabeladev/tabelhawebui/requests/`) instead of writing parallel
  CSS.
- **i18n keys**: nav labels are `nav_<sectionKey>`; add/remove translations in
  both `messages/en.json` and `messages/pt-br.json`.

## Commands

```sh
bun run dev            # dev server
bun run check          # type check (svelte-check)
bun run format         # prettier write
bun run cv             # regenerate all CV PDFs
bun run prepare-deploy # cv + format + build
bun run deploy         # wrangler pages deploy
```
