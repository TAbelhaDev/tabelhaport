<div align="center">

# TabelaPort

Um template de portfolio em SvelteKit com abordagem **data-driven**: cada seção,
entrada e texto vive em arquivos JSON dentro de `src/lib/data/`, então você
preenche com as suas informações e publica. Movido pelo design system
[TabelaWebUI](https://github.com/TAbelhaDev/tabelawebui) (Catppuccin Latte/Mocha,
estética "reading someone's source file"), multi-idioma (PT-BR/EN) via
[Paraglide](https://inlang.com/), e deployável no Cloudflare Workers em minutos.

[English](README.md) · **Português**

[![SvelteKit](https://img.shields.io/badge/SvelteKit-Svelte-ff3e00?style=flat-square&logo=svelte&logoColor=white)](https://kit.svelte.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square)](LICENSE)
[![Built with tabelawebui](https://img.shields.io/badge/theme-tabelawebui-d6b4f7?style=flat-square)](https://github.com/TAbelhaDev/tabelawebui)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ianptkcs)

</div>

---

## Funcionalidades

- **Conteúdo de preencher lacuna** — todos os dados em
  `src/lib/data/<feature>/<locale>.json`
- **Seções configuráveis** — adicione, remova ou reordene páginas editando um
  array em `src/lib/data/sections.ts` (as rotas e o nav acompanham sozinhos)
- **Geração de CV** — `bun run cv` compila um currículo `cv.typ` (via
  [Typst](https://typst.app)) pra cada idioma/perfil, nomeado a partir do nome no
  seu `personal.json`
- **i18n** — PT-BR e EN de fábrica (ver `messages/` e `project.inlang/`)
- **Tema claro/escuro** — vem do TabelaWebUI
- **Zero backend** — site estático, deploy no Cloudflare Workers

## Começando rápido

```sh
# 1. instalar
bun install

# 2. preencher seus dados (ver abaixo)
#    src/lib/data/personal/en.json        -> seu nome, resumo
#    src/lib/data/contacts/en.json        -> seus links de contato
#    src/lib/data/*/en.json               -> seu conteúdo (nos dois idiomas!)

# 3. sua foto
#    troque src/lib/assets/photo.svg pela sua própria imagem

# 4. gerar os PDFs do CV
bun run cv

# 5. desenvolver / buildar / deployar
bun run dev          # dev local
bun run build        # build de produção (Cloudflare Workers)
bun run deploy       # deploy no Cloudflare Workers
```

> Dica: `bun run prepare-deploy` faz `cv + format + build` de uma vez.

## Customizando

### Seus dados

Cada seção é uma pasta em `src/lib/data/` com um arquivo por idioma:

```
src/lib/data/
├── personal/        seu nome + resumo (usados no logo, no nome do CV, no alt da foto)
├── contacts/        links mailto:/github/linkedin (página inicial)
├── about/           "cards" da página sobre
├── projects/        projetos em destaque / todos
├── experiences/     empregos
├── education/       formação
├── achievements/    prêmios, provas, marcos
└── teaching/        monitoria / docência
```

As entradas seguem o shape `Experience`
(`src/lib/interfaces/experience.ts`): `title`, `subtitle`, `start`/`end`
(YYYY-MM), `location`, `details[]`, `skills[]`, e os opcionais `link` e
`featured` (projetos).

### Seções (rotas + nav)

O `src/lib/data/sections.ts` comanda a navegação e a rota dinâmica. Cada entrada
é `{ key, label, type, feature }`:

- `key` — o segmento da URL (ex.: `/projects`)
- `label` — o rótulo do nav, resolvido pela mensagem i18n `nav_<key>`
- `type` — `cards` (estilo sobre) ou `timeline` (lista)
- `feature` — a pasta de dados que alimenta a seção

Remova uma seção apagando a entrada dela (e, se quiser, a pasta de dados).
Adicione uma criando a entrada + a pasta `data/<feature>/`. Nenhum arquivo de
rota pra mexer.

### CV

O `src/lib/data/cv.typ` é o template Typst do currículo. Ele lê os mesmos JSONs
do site e aceita filtro por perfil (`dev`, `tutor`, `all`) e por tags:

```sh
bun run cv                     # todos os perfis x idiomas
bun run cv:dev-en              # uma combinação só
bash scripts/cv-vaga.sh pt "tag1,tag2" slug   # CV filtrado
```

Os nomes dos arquivos de saída vêm do nome no seu `personal.json`, ex.:
`Jane_Doe_CV_en.pdf`.

### i18n

As strings de UI (nav, página inicial) vivem em `messages/<locale>.json`.
Adicione ou remova idiomas em `project.inlang/settings.json`. As traduções de
conteúdo ficam nas pastas de dados.

## Stack

SvelteKit 5 · Svelte 5 · Tailwind CSS 4 · TabelaWebUI · Paraglide JS · Typst ·
Cloudflare Workers

## Licença

[AGPL-3.0](LICENSE)
