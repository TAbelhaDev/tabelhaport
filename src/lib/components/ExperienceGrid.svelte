<script lang="ts">
	import { Timeline } from '@tabelhadev/tabelhawebui';
	import type { Experience } from '$lib/interfaces/experience';
	import * as m from '$lib/paraglide/messages';

	let { experiences }: { experiences: Experience[] } = $props();

	const items = $derived(
		[...experiences]
			.sort((a, b) => (b.start ?? b.date ?? '').localeCompare(a.start ?? a.date ?? ''))
			.map((exp) => ({ ...exp, nowLabel: m.experience_now() }))
	);
</script>

<Timeline {items} />
