import { fail, type Actions } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const wesnothRepoDataDirOnMasterBranch = 'https://github.com/wesnoth/wesnoth/blob/master/data/';
const transparentColor = { r: 0, g: 0, b: 0, alpha: 0 };

async function blobToBase64(blob: Blob) {
	const buffer = Buffer.from(await blob.arrayBuffer());
	return buffer.toString('base64');
}

const fail500 = () =>
	fail(500, {
		error: {
			description:
				'Failed to retrieve image from URL. Plase try again. If this error persists, please contact us.'
		}
	});

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const urlInput = data.get('imageUrl');
		const { valid, ...validationDetails } = validateUrlInput(urlInput);
		if (!valid) return fail(400, { error: { description: toErrorDescription(validationDetails) } });
		const fileName = path.parse(`${urlInput}`).name;

		const rawPng = `${urlInput}?raw=true`;
		// const res = await fetch(rawPng);
		const blob = new Blob([readFileSync('img.png')]);
		if (true) {
			const tiny = await sharp(await blob.arrayBuffer()).flop();
			// const blob = await res.blob();
			const resizedImg = await sharp(await blob.arrayBuffer())
				.flop()
				.resize({
					width: 80,
					height: 128,
					position: sharp.gravity.south,
					background: transparentColor
				});
			writeFileSync('img.png', Buffer.from(await blob.arrayBuffer()));
			const fullHeroSprite = await resizedImg
				.clone()
				.extend({ right: 80 * 4, background: transparentColor })
				.composite([
					// overworld image
					{ top: 40, left: 1 * 80 + 10, input: await tiny.toBuffer() },
					// overworld in grass
					{ top: 40, left: 2 * 80 + 10, input: await tiny.toBuffer() },
					// statue after death
					{
						top: 0,
						left: 3 * 80,
						input: await resizedImg.clone().tint({ r: 255, g: 215, b: 0, alpha: 1 }).toBuffer()
					},
					// ghost after death
					{
						top: 0,
						left: 4 * 80,
						input: await resizedImg.clone().tint({ b: 255, r: 100, g: 100, alpha: 1 }).toBuffer()
					}
				])
				.toBuffer();
			return {
				imageBase64: `data:image/png;base64, ${fullHeroSprite.toString('base64')}`,
				imageName: fileName
			};
		} else {
		}
	}
};

const validateUrlInput = (input: unknown) => {
	try {
		new URL(input as string);
	} catch (error) {
		return { notAValidUrl: true, valid: false };
	}
	const url = input as string; // safe because new URL has not rejected input
	if (!url.startsWith(wesnothRepoDataDirOnMasterBranch))
		return { notInsideWesnothRepoDataDirOnMasterBranch: true, valid: false };
	if (!url.endsWith('.png'))
		return {
			notAPngFile: true,
			valid: false
		};
	return { valid: true };
};

function toErrorDescription({
	notAPngFile,
	notAValidUrl,
	notInsideWesnothRepoDataDirOnMasterBranch
}: {
	notAValidUrl?: boolean;
	notInsideWesnothRepoDataDirOnMasterBranch?: boolean;
	notAPngFile?: boolean;
}): string {
	if (notAValidUrl)
		return 'Input is not a valid URL. Check the placeholder in the URL input field for an example.';
	if (notInsideWesnothRepoDataDirOnMasterBranch)
		return 'Only URLs pointing to .png files within the Wesnoth GitHub repositories master branch are supported. As such, your URL must start with "https://github.com/wesnoth/wesnoth/blob/master/data/"';
	if (notAPngFile) return 'Your URL does not point to a .png file.';
	return 'An unknown error occurred. ';
}
