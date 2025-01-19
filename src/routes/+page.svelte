<script lang="ts">
	type Props = {
		form?: {
			error?: {
				description: string;
			};
			imageBase64?: string;
			imageName?: string;
			imageUrl?: string;
			customName?: string;
		};
	};
	let { form }: Props = $props();
	let url = $state(form?.imageUrl ?? '');
	let customName = $state(form?.customName ?? '');
	let copiedEntityDef = $state(false);
	let usedName = $derived(customName || form?.imageName || '');

	function toEntityDef(name: string) {
		return `entityDef "wesnoth_${name}_sprite"
{
	name "${name}"
	texturename textures/${name}_sprite

	devname "The Battle for Wesnoth ${form?.imageUrl ?? ''} - Please respect the applicable image licenses. See https://wiki.wesnoth.org/Wesnoth:Copyrights. Generated using https://dungeonmans-heroskin-maker.kraenz.eu"
	
	width 80
	height 128

	xloc	0
	yloc	0

	gender none
}`;
	}

	async function copyEntityDefToClipboard() {
		const def = toEntityDef(usedName);
		await navigator.clipboard.writeText(def);
		copiedEntityDef = true;
		setTimeout(() => (copiedEntityDef = false), 3000);
	}

	function downloadImage() {
		if (!form?.imageBase64) return;
		const filename = `${usedName}_sprite.png`;
		download(form.imageBase64, filename);
	}
	function downloadEntityDef() {
		if (!form?.imageName) return;
		const filename = `${usedName}.hero`;
		const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(toEntityDef(usedName))}`;
		download(dataUrl, filename);
	}
	function download(dataUrl: string, filename: string) {
		const a = document.createElement('a');
		a.download = filename;
		a.href = dataUrl;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<main>
	<h1>Dungeonmans Heroskin Maker</h1>

	<section>
		<form method="POST">
			<div class="url-label-container">
				<label for="imageUrl" class="url-label">GitHub URL to Wesnoth unit image</label>
				<a
					class="left"
					href="https://github.com/wesnoth/wesnoth/blob/master/data/core/images/units/"
					target="_blank"
					referrerpolicy="no-referrer">Browse Wesnoth core units</a
				>
			</div>

			<input
				bind:value={url}
				name="imageUrl"
				id="imageUrl"
				type="text"
				placeholder="https://github.com/wesnoth/wesnoth/blob/master/data/core/images/units/orcs/leader.png"
				required
			/>
			<label>
				Custom name (optional)
				<input bind:value={customName} name="customName" type="text" placeholder="orcleader" />
			</label>
			<div class="submit-button-container"><button type="submit">Make Heroskin</button></div>

			{#if form?.error}
				<div class="error">
					<h6>Error</h6>
					<p>{form?.error?.description}</p>
				</div>
			{/if}
		</form>

		<p>
			Disclaimer: Some images are working great, others unfortunately get truncated when resized. So
			if an image doesn't work, please try another one. It very much depends on the individual
			image.
		</p>
	</section>

	{#if form?.imageBase64 && form?.imageName}
		<section>
			<h2 id="results">Your new Heroskin</h2>
			<div class="img-container">
				<img src={form.imageBase64} alt="heroskin" />
				<div class="download-img-btn-container">
					<button onclick={downloadImage} class="outline download-img-btn">Download</button>
				</div>
			</div>

			<div class="entitydef-container">
				<div class="entitydef-buttons">
					<button class="outline entitydef-copy-btn" onclick={copyEntityDefToClipboard}
						>{#if copiedEntityDef}Copied 👍{:else}Copy{/if}</button
					>
					<button class="outline entitydef-download-btn" onclick={downloadEntityDef}
						>Download</button
					>
				</div>
				<textarea readonly>{toEntityDef(usedName)} </textarea>
			</div>
		</section>

		<section>
			<h3>How to use?</h3>
			<p>
				Save or download the heroskin image to
				<code>
					c:\users\YOUR_USERNAME\appdata\roaming\Dungeonmans\modcontent\textures\{usedName}.png
				</code>
			</p>
			<p>
				Download or copy-and-paste the contents of the textfield to
				<code>
					c:\users\YOUR_USERNAME\appdata\roaming\Dungeonmans\modcontent\heroskins\{usedName}.hero
				</code>
			</p>
			<p>
				If you'd like to rename the heroskin, you can provide a 'Custom name' at the top. Be sure to
				update both image and entity def files though.
			</p>
		</section>

		<section>
			<h3>Colors</h3>
			<p>
				The pink colors inside the Wesnoth sprites are designed to be replaced by other colors. To
				learn how, check
				<a
					href="https://wiki.wesnoth.org/TeamColoring"
					referrerpolicy="no-referrer"
					target="_blank"
				>
					Wesnoth Wiki - Team Coloring</a
				>. You can find the TeamColoring script
				<a
					href="https://github.com/wesnoth/wesnoth/tree/master/data/tools"
					referrerpolicy="no-referrer"
					target="_blank"
				>
					here
				</a>
				on GithHub. If I'm not mistaken you should be able to apply the script to the heroskin PNG.
			</p>
		</section>
	{/if}
</main>

<footer>
	<p>
		Created with 💚 by TypeScriptTeatime. Free & Open-Source. <a
			href="https://github.com/mkraenz/dungeonmans-heroskin-maker"
			referrerpolicy="no-referrer"
			target="_blank">GitHub</a
		>
	</p>
</footer>

<style>
	h1 {
		text-align: center;
	}
	button {
		max-width: 320px;
	}
	.submit-button-container {
		display: flex;
		justify-content: center;
	}
	.error {
		border: 1px solid red;
	}
	textarea {
		min-height: 600px;
		field-sizing: content; /** working in chrome but not in firefox or safari. https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing */
	}
	.url-label-container {
		display: flex;
		justify-content: space-between;
	}
	.url-label {
		display: inline;
	}
	.entitydef-buttons {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}
	.entitydef-copy-btn {
		/* position: absolute;
		top: 0.5rem;
		right: 0.5rem; */
		min-width: 180px;
	}
	.entitydef-download-btn {
		/* position: absolute;
		top: rem;
		right: 0.5rem; */
		min-width: 180px;
	}
	.entitydef-container {
		position: relative;
	}
	.download-img-btn {
		min-width: 180px;
	}
	.download-img-btn-container {
		place-content: center;
	}
	.img-container {
		display: flex;
		justify-content: space-between;
	}
	footer {
		margin-top: 2rem;
	}
	main {
		margin-bottom: auto;
		min-height: 80vh;
	}
</style>
