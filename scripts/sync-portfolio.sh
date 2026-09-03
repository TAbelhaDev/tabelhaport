#!/usr/bin/env bash
# Distribui o código do TabelaPort (template) para uma instância (portfolio)
# e, opcionalmente, roda o pipeline completo de publicação.
#
# Config via .env deste repo (variáveis de instância, não vão pro template):
#   PORTFOLIO_DIR  caminho do repo portfolio destino (default: ~/codigo/pessoal/portfolio)
#   DOCS_DIR       pasta onde copiar os CVs gerados (default: ~/Documents/profissionais)
#
# Preservados no portfolio durante o sync (dados injetados):
#   - src/lib/data/          conteúdo
#   - src/lib/assets/        foto local (photo.jpg vs photo.svg do template)
#   - messages/              textos de UI do usuário
#   - static/*_CV_*.pdf      CVs gerados
#   - .opencode/ .gitignore  marcadores/estado local
#   - name/version no package.json
#
# Uso:
#   bash scripts/sync-portfolio.sh                          # só sync de código
#   bash scripts/sync-portfolio.sh --dry-run                # preview do sync
#   bash scripts/sync-portfolio.sh --update --message "msg" # sync + pipeline completo
set -euo pipefail

TPL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Config de instância (.env gitignored, não faz parte do template)
if [ -f "$TPL_DIR/.env" ]; then
	set -a
	# shellcheck disable=SC1091
	source "$TPL_DIR/.env"
	set +a
fi

PORTFOLIO_DIR="${PORTFOLIO_DIR:-$HOME/codigo/pessoal/portfolio}"
DOCS_DIR="${DOCS_DIR:-$HOME/Documents/profissionais}"

# --- parse de flags ---------------------------------------------------------
MODE="sync"
MESSAGE=""
DRY_RUN=false
while [ "$#" -gt 0 ]; do
	case "$1" in
		--update) MODE="update" ;;
		--message)
			MESSAGE="${2:-}"
			shift
			;;
		--dry-run) DRY_RUN=true ;;
		*) echo "Flag desconhecida: $1" >&2 && exit 1 ;;
	esac
	shift
done

if [ "$MODE" = "update" ] && [ -z "$MESSAGE" ]; then
	echo "Uso: bash scripts/sync-portfolio.sh --update --message \"msg do commit\"" >&2
	exit 1
fi

if [ ! -d "$PORTFOLIO_DIR/.git" ]; then
	echo "Portfolio não encontrado em $PORTFOLIO_DIR (defina PORTFOLIO_DIR no .env)" >&2
	exit 1
fi

if $DRY_RUN; then
	RSYNC_FLAGS=(-an --out-format='%n')
else
	RSYNC_FLAGS=(-a --delete)
fi

PORT_NAME="$(node -e 'console.log(require(process.argv[1]).name)' "$PORTFOLIO_DIR/package.json")"
PORT_VERSION="$(node -e 'console.log(require(process.argv[1]).version)' "$PORTFOLIO_DIR/package.json")"

# --- sync de código ----------------------------------------------------------
echo "== Sync: $TPL_DIR -> $PORTFOLIO_DIR"

# Diretórios de código puro (com --delete para refletir remoções do template)
rsync "${RSYNC_FLAGS[@]}" \
	--exclude 'data' \
	--exclude 'assets' \
	--exclude 'paraglide' \
	"$TPL_DIR/src/" "$PORTFOLIO_DIR/src/"

# Scripts do template (o próprio sync-portfolio.sh fica só aqui; o
# update-portfolio.sh foi absorvido pelo --update deste script)
rsync "${RSYNC_FLAGS[@]}" \
	--exclude 'sync-portfolio.sh' \
	"$TPL_DIR/scripts/" "$PORTFOLIO_DIR/scripts/"

rsync "${RSYNC_FLAGS[@]}" \
	--exclude '*_CV_*.pdf' \
	"$TPL_DIR/static/" "$PORTFOLIO_DIR/static/"

rsync "${RSYNC_FLAGS[@]}" \
	"$TPL_DIR/project.inlang/" "$PORTFOLIO_DIR/project.inlang/"

if [ -d "$TPL_DIR/.github" ]; then
	rsync "${RSYNC_FLAGS[@]}" "$TPL_DIR/.github/" "$PORTFOLIO_DIR/.github/"
fi

if $DRY_RUN; then
	echo "(dry-run — nada copiado, só listado acima)"
	exit 0
fi

# Arquivos de config raiz
for f in svelte.config.js tsconfig.json vite.config.ts .prettierrc .prettierignore .npmrc .mcp.json; do
	[ -f "$TPL_DIR/$f" ] && cp "$TPL_DIR/$f" "$PORTFOLIO_DIR/$f"
done

# O template usa photo.svg (placeholder); a instância tem photo.jpg (foto real).
# Ajusta a referência no +page.svelte pro asset que existir no destino.
if [ -f "$PORTFOLIO_DIR/src/lib/assets/photo.jpg" ] && [ ! -f "$PORTFOLIO_DIR/src/lib/assets/photo.svg" ]; then
	sed -i "s/photo\.svg/photo.jpg/" "$PORTFOLIO_DIR/src/routes/+page.svelte"
fi

# package.json: herda scripts/deps do template, mantém name + version da instância
node - "$TPL_DIR/package.json" "$PORTFOLIO_DIR/package.json" "$PORT_NAME" "$PORT_VERSION" <<'EOF'
const fs = require('node:fs');
const [file, out, name, version] = process.argv.slice(2);
const src = JSON.parse(fs.readFileSync(file, 'utf8'));
src.name = name;
src.version = version;
fs.writeFileSync(out, JSON.stringify(src, null, '\t') + '\n');
EOF

# wrangler.jsonc: herda a config do template, mantém o nome do projeto
sed -e 's/"name": "tabelhaport"/"name": "'"$PORT_NAME"'"/' "$TPL_DIR/wrangler.jsonc" > "$PORTFOLIO_DIR/wrangler.jsonc"

cd "$PORTFOLIO_DIR"
bun install

if [ "$MODE" = "sync" ]; then
	echo "Sync OK — código do tabelhaport copiado, dados da instância preservados."
	exit 0
fi

# --- pipeline completo (--update) --------------------------------------------
echo "== Update: cv + format + check + build + commit + push + deploy"

if [ -z "$(git status --porcelain)" ]; then
	echo "Working tree limpo — nada para publicar." >&2
	exit 1
fi

bun run cv

mkdir -p "$DOCS_DIR"
cp static/*_CV_*.pdf "$DOCS_DIR/"

bun run format
bun run check
bun run build

git add -A
git commit -m "$MESSAGE"
git push

bun run deploy

mkdir -p .opencode
date +%Y-%m-%d > .opencode/update-portfolio.last
echo "update-portfolio OK — marker atualizado para $(cat .opencode/update-portfolio.last)"
