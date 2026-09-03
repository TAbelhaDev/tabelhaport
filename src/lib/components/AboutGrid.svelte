<script lang="ts">
	import { RuleCard } from '@tabelhadev/tabelhawebui';
	import type { Component } from 'svelte';
	import { Lightbulb, Code, Presentation, Puzzle } from 'lucide-svelte';

	type Icon = Component<{ class?: string; strokeWidth?: number }>;

	export interface AboutItem {
		icon: string;
		title: string;
		text: string;
	}

	let { items }: { items: AboutItem[] } = $props();

	const icons: Record<string, Icon> = {
		lightbulb: Lightbulb as unknown as Icon,
		code: Code as unknown as Icon,
		presentation: Presentation as unknown as Icon,
		puzzle: Puzzle as unknown as Icon
	};
</script>

<main class="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
	{#each items as item (item.title)}
		<RuleCard icon={icons[item.icon] ?? (Lightbulb as unknown as Icon)} title={item.title}>
			{item.text}
		</RuleCard>
	{/each}
</main>
