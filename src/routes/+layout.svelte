<script lang="ts">
	import type { Snippet } from 'svelte';
	import './global.css';

	type Props = { children: Snippet };
	let { children }: Props = $props();
</script>

{@render children()}
