<script lang="ts">
	import { error } from '@sveltejs/kit';

	type Props = {
		form?: {
			error?: {
				description: string;
			};
		};
	};
	let { form }: Props = $props();
	let url = $state('');
</script>

<main>
	<h1>Dungeonmans Heroskin Maker</h1>

	<form method="POST">
		<label>
			Full URL to Wesnoth unit image
			<input
				bind:value={url}
				name="imageUrl"
				type="text"
				placeholder="https://github.com/wesnoth/wesnoth/blob/master/data/core/images/units/orcs/leader.png"
				required
			/>
		</label>
		<button type="submit">Convert</button>

		{#if form?.error}
			<div class="error">
				<h6>Error</h6>
				<p>{form?.error?.description}</p>
			</div>
		{/if}
	</form>
</main>

<style>
	h1 {
		text-align: center;
	}
	input {
		word-break: break-all;
		word-wrap: break-word;
	}
	.error {
		border: 1px solid red;
	}
</style>
