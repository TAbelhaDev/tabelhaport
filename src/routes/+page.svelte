<script lang="ts">
	import { TabCard, Divider, Eyebrow, BracketLink } from '@tabelhadev/tabelhawebui';
	import photo from '$lib/assets/photo.svg';
	import { Download, Github, Linkedin, Mail, Phone } from 'lucide-svelte';
	import { getLocaleData } from '$lib/data/paraglide-adapter';
	import { cvFilename, personalName } from '$lib/cv';
	import type { Contact } from '$lib/interfaces/contact';
	import * as m from '$lib/paraglide/messages';

	// Derived, not a module constant: the list has to follow the active locale,
	// the same way the section route already reads its data.
	const contacts = $derived(getLocaleData<Contact[]>('contacts'));
</script>

<div class="flex flex-col gap-8 lg:grid lg:grid-cols-5">
	<div class="lg:col-span-3">
		<TabCard title={m.home_greetings_label()}>
			<h1 class="text-ink font-mono text-2xl leading-tight font-medium sm:text-4xl">
				{m.home_greeting()}
			</h1>

			<Divider />

			<p class="text-ink-soft max-w-xl font-serif text-lg sm:text-xl">
				{m.home_navigation_hint()}
			</p>

			<Divider />

			<div class="flex flex-col gap-2.5">
				<Eyebrow>{m.home_contact_me()}</Eyebrow>
				<div class="flex flex-col gap-2">
					{#each contacts as contact}
						{@render ContactLink(contact)}
					{/each}
				</div>
			</div>

			<div class="mt-6 flex flex-col gap-2.5">
				<Eyebrow>{m.home_download_cv()}</Eyebrow>
				<BracketLink
					href={`/${cvFilename()}`}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex w-fit items-center gap-2"
				>
					<Download class="size-4" />
					{m.home_download_cv_button()}
				</BracketLink>
			</div>
		</TabCard>
	</div>
	<div class="hidden lg:col-span-2 lg:block">
		<TabCard title={m.home_photo_label()}>
			<figure class="flex h-full flex-col">
				<img class="h-80 w-full object-cover" src={photo} alt={personalName()} />
				<figcaption class="text-ink-faint mt-2 font-mono text-xs">
					{m.home_photo_note()}
				</figcaption>
			</figure>
		</TabCard>
	</div>
</div>

{#snippet ContactLink(item: Contact)}
	<a
		href={item.url}
		target="_blank"
		rel="noopener noreferrer"
		class="group text-ink-soft hover:text-accent inline-flex w-fit items-center gap-2 font-serif text-base transition-colors"
	>
		<span class="text-ink-faint group-hover:text-accent transition-colors">
			{#if item.icon === 'mail'}
				<Mail class="size-4" />
			{:else if item.icon === 'linkedin'}
				<Linkedin class="size-4" />
			{:else if item.icon === 'github'}
				<Github class="size-4" />
			{:else if item.icon === 'phone'}
				<Phone class="size-4" />
			{/if}
		</span>
		<span
			class="decoration-rule group-hover:decoration-accent underline decoration-1 underline-offset-4"
			>{item.name}</span
		>
	</a>
{/snippet}
