#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import prompts from 'prompts';

const ROOT = join(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src/lib/data');
const SECTIONS_FILE = join(DATA_DIR, 'sections.ts');
const ADAPTER_FILE = join(DATA_DIR, 'paraglide-adapter.ts');
const MESSAGES_EN = join(ROOT, 'messages/en.json');
const MESSAGES_PT = join(ROOT, 'messages/pt-br.json');

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readFile(path) {
	return readFileSync(path, 'utf-8');
}

function writeFile(path, content) {
	writeFileSync(path, content, 'utf-8');
}

function parseSections(content) {
	const match = content.match(/export const sections = \[([\s\S]*?)\] as const/);
	if (!match) throw new Error('Não foi possível encontrar sections em sections.ts');
	const block = match[1];
	const entries = [];
	const regex = /\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)',\s*type:\s*'([^']+)',\s*feature:\s*'([^']+)' \}/g;
	let m;
	while ((m = regex.exec(block)) !== null) {
		entries.push({ key: m[1], label: m[2], type: m[3], feature: m[4] });
	}
	return entries;
}

function parseDatasets(content) {
	const imports = [];
	const importRegex = /^import (\w+) from '\$lib\/data\/([^/]+)\/(en|pt-br)\.json';$/gm;
	let m;
	while ((m = importRegex.exec(content)) !== null) {
		imports.push({ varName: m[1], feature: m[2], locale: m[3] });
	}
	return imports;
}

function buildImportLine(varName, feature, locale) {
	const localeFile = locale === 'en' ? 'en.json' : 'pt-br.json';
	return `import ${varName} from '$lib/data/${feature}/${localeFile}';`;
}

function buildDatasetEntry(feature) {
	return `\t${feature}: { en: ${feature}EnUs, 'pt-br': ${feature}PtBr },`;
}

function toVarName(feature) {
	return feature.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function capitalize(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

async function addSection() {
	const { slug } = await prompts({
		type: 'text',
		name: 'slug',
		message: 'Nome da feature (slug):',
		validate: (v) => {
			if (!v) return 'Slug é obrigatório';
			if (!SLUG_REGEX.test(v)) return 'Slug inválido: use apenas minúsculas, números e hífens (ex: certificacoes, my-projects)';
			return true;
		}
	});
	if (!slug) return;

	const { type } = await prompts({
		type: 'select',
		name: 'type',
		message: 'Tipo da seção:',
		choices: [
			{ title: 'timeline (lista)', value: 'timeline' },
			{ title: 'cards (grid)', value: 'cards' }
		],
		initial: 0
	});

	const { labelPt } = await prompts({
		type: 'text',
		name: 'labelPt',
		message: 'Label de navegação (PT-BR):',
		initial: capitalize(slug.replace(/-/g, ' '))
	});
	if (!labelPt) return;

	const { labelEn } = await prompts({
		type: 'text',
		name: 'labelEn',
		message: 'Label de navegação (EN):',
		initial: labelPt
	});
	if (!labelEn) return;

	const { template } = await prompts({
		type: 'select',
		name: 'template',
		message: 'Template dos JSONs:',
		choices: [
			{ title: 'Genérico (title, subtitle, details[], skills[])', value: 'generic' },
			{ title: 'Vazio (objeto {})', value: 'empty-obj' },
			{ title: 'Vazio (array [])', value: 'empty-arr' },
			{ title: 'Customizado', value: 'custom' }
		],
		initial: 0
	});

	let jsonContent;
	if (template === 'generic') {
		jsonContent = JSON.stringify([{ title: '', subtitle: '', details: [], skills: [] }], null, '\t');
	} else if (template === 'empty-obj') {
		jsonContent = JSON.stringify({}, null, '\t');
	} else if (template === 'empty-arr') {
		jsonContent = JSON.stringify([], null, '\t');
	} else {
		const { customJson } = await prompts({
			type: 'text',
			name: 'customJson',
			message: 'Cole o JSON customizado:'
		});
		try {
			JSON.parse(customJson);
			jsonContent = customJson;
		} catch {
			console.error('JSON inválido, usando template genérico.');
			jsonContent = JSON.stringify([{ title: '', subtitle: '', details: [], skills: [] }], null, '\t');
		}
	}

	// Dry-run
	const folder = join(DATA_DIR, slug);
	const varName = toVarName(slug);
	console.log('\nResumo das mudanças:');
	console.log(`  + Criar ${join('src/lib/data', slug, 'en.json')}`);
	console.log(`  + Criar ${join('src/lib/data', slug, 'pt-br.json')}`);
	console.log(`  ~ Atualizar sections.ts (adicionar entrada)`);
	console.log(`  ~ Atualizar paraglide-adapter.ts (imports + dataset)`);
	console.log(`  ~ Atualizar messages/en.json (nav_${slug})`);
	console.log(`  ~ Atualizar messages/pt-br.json (nav_${slug})`);

	const { confirm } = await prompts({
		type: 'confirm',
		name: 'confirm',
		message: 'Aplicar?',
		initial: true
	});
	if (!confirm) {
		console.log('Cancelado.');
		return;
	}

	// Criar pasta e JSONs
	mkdirSync(folder, { recursive: true });
	writeFile(join(folder, 'en.json'), jsonContent);
	writeFile(join(folder, 'pt-br.json'), jsonContent);

	// Atualizar sections.ts
	const sectionsContent = readFile(SECTIONS_FILE);
	const newEntry = `\t{ key: '${slug}', label: 'nav_${slug}', type: '${type}', feature: '${slug}' },`;
const updatedSections = sectionsContent.replace(
		/\] as const satisfies readonly Section\[\];/,
		`${newEntry}\n] as const satisfies readonly Section[];`
	);
	writeFile(SECTIONS_FILE, updatedSections);

	// Atualizar paraglide-adapter.ts
	const adapterContent = readFile(ADAPTER_FILE);
	const importEn = buildImportLine(`${varName}EnUs`, slug, 'en');
	const importPt = buildImportLine(`${varName}PtBr`, slug, 'pt-br');
	const lastImport = adapterContent.lastIndexOf("import teachingPtBr");
	const afterLastImport = adapterContent.indexOf('\n', lastImport) + 1;
	const withImports = adapterContent.slice(0, afterLastImport) + importEn + '\n' + importPt + '\n' + adapterContent.slice(afterLastImport);

	const lastDataset = withImports.lastIndexOf("teaching: { en: teachingEnUs");
	const afterLastDataset = withImports.indexOf('\n', lastDataset) + 1;
	const datasetEntry = buildDatasetEntry(slug);
	const finalAdapter = withImports.slice(0, afterLastDataset) + datasetEntry + '\n' + withImports.slice(afterLastDataset);
	writeFile(ADAPTER_FILE, finalAdapter);

	// Atualizar messages
	const enContent = JSON.parse(readFile(MESSAGES_EN));
	enContent[`nav_${slug}`] = `.${labelEn.toLowerCase()}()`;
	writeFile(MESSAGES_EN, JSON.stringify(enContent, null, '\t') + '\n');

	const ptContent = JSON.parse(readFile(MESSAGES_PT));
	ptContent[`nav_${slug}`] = `.${labelPt.toLowerCase()}()`;
	writeFile(MESSAGES_PT, JSON.stringify(ptContent, null, '\t') + '\n');

	console.log('\n✓ Seção adicionada com sucesso!');
}

async function removeSection() {
	const sections = parseSections(readFile(SECTIONS_FILE));
	if (sections.length === 0) {
		console.log('Nenhuma seção encontrada.');
		return;
	}

	console.log('\nSeções existentes:\n');
	sections.forEach((s, i) => {
		console.log(`  ${i + 1}. ${s.key} (${s.type})`);
	});

	const { index } = await prompts({
		type: 'select',
		name: 'index',
		message: 'Qual seção remover?',
		choices: sections.map((s, i) => ({ title: `${s.key} (${s.type})`, value: i }))
	});
	if (index === undefined) return;

	const section = sections[index];

	// Confirmações de segurança
	const { confirm1 } = await prompts({
		type: 'confirm',
		name: 'confirm1',
		message: `Tem certeza que quer remover "${section.key}"?`,
		initial: false
	});
	if (!confirm1) {
		console.log('Cancelado.');
		return;
	}

	const { confirm2 } = await prompts({
		type: 'confirm',
		name: 'confirm2',
		message: `Última chance! Remover "${section.key}" e todos os dados?`,
		initial: false
	});
	if (!confirm2) {
		console.log('Cancelado.');
		return;
	}

	const dataFolder = join(DATA_DIR, section.feature);
	const folderExists = existsSync(dataFolder);

	let deleteFolder = false;
	if (folderExists) {
		const { del } = await prompts({
			type: 'confirm',
			name: 'del',
			message: `Remover também a pasta src/lib/data/${section.feature}/?`,
			initial: false
		});
		deleteFolder = del;
	}

	// Dry-run
	console.log('\nResumo das mudanças:');
	console.log(`  - Remover entrada de sections.ts (key: ${section.key})`);
	console.log(`  - Remover imports de paraglide-adapter.ts (feature: ${section.feature})`);
	console.log(`  - Remover nav_${section.key} de messages/en.json`);
	console.log(`  - Remover nav_${section.key} de messages/pt-br.json`);
	if (deleteFolder) {
		console.log(`  - Remover pasta src/lib/data/${section.feature}/`);
	}

	const { confirm } = await prompts({
		type: 'confirm',
		name: 'confirm',
		message: 'Aplicar?',
		initial: true
	});
	if (!confirm) {
		console.log('Cancelado.');
		return;
	}

	// Remover de sections.ts
	const sectionsContent = readFile(SECTIONS_FILE);
	const entryRegex = new RegExp(`\\t\\{ key: '${section.key}', label: 'nav_${section.key}', type: '${section.type}', feature: '${section.feature}' \\},\\n?`);
	const updatedSections = sectionsContent.replace(entryRegex, '');
	writeFile(SECTIONS_FILE, updatedSections);

	// Remover de paraglide-adapter.ts
	const adapterContent = readFile(ADAPTER_FILE);
	const varName = toVarName(section.feature);
	const importEnLine = `import ${varName}EnUs from '$lib/data/${section.feature}/en.json';`;
	const importPtLine = `import ${varName}PtBr from '$lib/data/${section.feature}/pt-br.json';`;
	const datasetLine = `\t${section.feature}: { en: ${varName}EnUs, 'pt-br': ${varName}PtBr },`;
	const cleanedAdapter = adapterContent
		.split('\n')
		.filter((line) => line !== importEnLine && line !== importPtLine && line !== datasetLine)
		.join('\n');
	writeFile(ADAPTER_FILE, cleanedAdapter);

	// Remover de messages
	const enContent = JSON.parse(readFile(MESSAGES_EN));
	delete enContent[`nav_${section.key}`];
	writeFile(MESSAGES_EN, JSON.stringify(enContent, null, '\t') + '\n');

	const ptContent = JSON.parse(readFile(MESSAGES_PT));
	delete ptContent[`nav_${section.key}`];
	writeFile(MESSAGES_PT, JSON.stringify(ptContent, null, '\t') + '\n');

	// Remover pasta
	if (deleteFolder) {
		rmSync(dataFolder, { recursive: true, force: true });
	}

	console.log('\n✓ Seção removida com sucesso!');
}

async function main() {
	const arg = process.argv[2];

	if (arg === 'add') {
		await addSection();
	} else if (arg === 'remove') {
		await removeSection();
	} else {
		const { action } = await prompts({
			type: 'select',
			name: 'action',
			message: 'O que deseja fazer?',
			choices: [
				{ title: 'Adicionar seção', value: 'add' },
				{ title: 'Remover seção', value: 'remove' }
			]
		});

		if (action === 'add') await addSection();
		else if (action === 'remove') await removeSection();
	}
}

main().catch((err) => {
	if (err.message === 'canceled') {
		console.log('\nCancelado.');
		process.exit(0);
	}
	console.error(err);
	process.exit(1);
});
