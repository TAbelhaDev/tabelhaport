<script lang="ts">
	import { page } from '$app/state';
	import { Nav, ThemeToggle } from '@tabelhadev/tabelhawebui';
	import LanguageController from './LanguageController.svelte';
	import { sections } from '$lib/data/sections';
	import { personalNameSlug } from '$lib/cv';
	import * as m from '$lib/paraglide/messages';

	const label = (key: string) => (m as unknown as Record<string, () => string>)[`nav_${key}`]();

	const items = $derived(
		sections.map((section) => ({
			href: `/${section.key}`,
			label: label(section.key),
			current: page.url.pathname === `/${section.key}`
		}))
	);
</script>

<Nav {items}>
	{#snippet logo()}
		<a href="/" class="text-ink">
			{personalNameSlug()}<span class="text-ink-faint">.dev</span>
		</a>
	{/snippet}
	{#snippet trailing()}
		<LanguageController />
		<ThemeToggle />
	{/snippet}
</Nav>
