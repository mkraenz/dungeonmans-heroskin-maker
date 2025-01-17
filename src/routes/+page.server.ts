import { fail, type Actions } from '@sveltejs/kit';
import { writeFileSync } from 'node:fs';

const wesnothRepoDataDirOnMasterBranch = 'https://github.com/wesnoth/wesnoth/blob/master/data/';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const urlInput = data.get('imageUrl');
		const { valid, ...validationDetails } = validateUrlInput(urlInput);
		if (!valid) return fail(400, { error: { description: toErrorDescription(validationDetails) } });

		const rawPng = `${urlInput}?raw=true`;
		const res = await fetch(rawPng);
		console.log({ resStatus: res.status });
		if (res.ok) {
			console.log('ok');
			if (res.headers.get('Content-Type') !== 'image/png') console.log('something went wrong');
			const blob = await res.blob();
			await writeFileSync('test.png', new Uint8Array(await blob.arrayBuffer()));
		} else {
			console.log('meh');
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
