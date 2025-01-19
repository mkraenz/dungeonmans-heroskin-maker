import { read } from '$app/server';
import { fail, type Actions } from '@sveltejs/kit';
import path from 'node:path';
import sharp from 'sharp';
import emptyPng from './data/empty.png';
import grassMaskPng from './data/grass-mask.png';
import grassPng from './data/grass.png';

const wesnothRepoDataDirOnMasterBranch = 'https://github.com/wesnoth/wesnoth/blob/master/data/';
const transparentColor = { r: 0, g: 0, b: 0, alpha: 0 };
const dmansTargetDimension = { x: 80, y: 128 };

const fail500 = () =>
	fail(500, {
		error: {
			description:
				'Failed to retrieve image from URL. Plase try again. If this error persists, please contact us.'
		}
	});

export const actions: Actions = {
	default: async ({ request }) => {
		const { urlInput, customName } = await extractInput(request);
		const { valid, ...validationDetails } = validateUrlInput(urlInput);
		if (!valid) return fail(400, { error: { description: toErrorDescription(validationDetails) } });

		const res = await fetch(`${urlInput}?raw=true`);
		if (!res.ok) return fail500();
		const blob = await res.blob();
		// const blob = new Blob([readFileSync('data/delete-me.png')]);
		const fullHeroSprite = await generateHeroSprite({
			blob: Buffer.from(await blob.arrayBuffer()),
			grass: await readDataFile(grassPng),
			grassMask: await readDataFile(grassMaskPng),
			empty: await readDataFile(emptyPng)
		});
		return {
			imageBase64: `data:image/png;base64, ${fullHeroSprite.toString('base64')}`,
			imageName: path.parse(`${urlInput}`).name,
			imageUrl: urlInput,
			customName
		};
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

async function readDataFile(file: string) {
	return Buffer.from(await read(file).arrayBuffer());
}

async function extractInput(request: Request) {
	const data = await request.formData();
	const urlInput = data.get('imageUrl');
	const customName = data.get('customName');
	return { urlInput, customName };
}

async function generateHeroSprite({
	blob,
	grass,
	grassMask,
	empty
}: {
	blob: Buffer;
	grass: Buffer;
	grassMask: Buffer;
	empty: Buffer;
}) {
	const tiny = await sharp(blob).flop();
	const resizedImg = await sharp(blob)
		.flop()
		.resize({
			width: 80,
			height: 128,
			position: sharp.gravity.south,
			background: transparentColor,
			kernel: 'nearest'
		})
		.affine([1, 0, 0, 1], { ody: 10, background: transparentColor });

	const overworldGrassA = await sharp(empty)
		.composite([{ top: 55, left: 0, input: await tiny.toBuffer() }])
		.boolean(grassMask, 'and')
		.toBuffer();
	const overworldGrass = await sharp(overworldGrassA).composite([
		{ top: 0, left: 0, input: grass }
	]);
	const fullHeroSprite = await resizedImg
		.clone()
		.extend({ right: 80 * 4, background: transparentColor })
		.composite([
			// overworld image
			{ top: 55, left: 1 * 80, input: await tiny.toBuffer() },
			// overworld in grass
			{ top: 0, left: 2 * 80, input: await overworldGrass.toBuffer() },
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
	return fullHeroSprite;
}

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
