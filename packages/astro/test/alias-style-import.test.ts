import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17163
// TSConfig path aliases in @import inside <style> blocks should resolve correctly.
describe('CSS @import with tsconfig aliases in <style>', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/alias-style-import/',
		});
		await fixture.build();
	});

	it('resolves @import url("@/...") in <style> blocks', async () => {
		const html = await fixture.readFile('/import-url/index.html');
		const $ = cheerio.load(html);

		// Gather CSS from inline styles and linked stylesheets
		const styleTag = $('style').html() || '';
		const links = $('link[rel=stylesheet]')
			.map((_i, el) => $(el).attr('href'))
			.get();

		let allCss = styleTag;
		if (links.length > 0) {
			const cssContents = await Promise.all(links.map((href) => fixture.readFile(href)));
			allCss += '\n' + cssContents.join('\n');
		}

		// The imported CSS should be present in the output
		assert.ok(allCss.includes('#from-base'), 'CSS from @import url() with alias should be present');
	});

	it('resolves @import "@/..." in <style> blocks', async () => {
		const html = await fixture.readFile('/import-bare/index.html');
		const $ = cheerio.load(html);

		const styleTag = $('style').html() || '';
		const links = $('link[rel=stylesheet]')
			.map((_i, el) => $(el).attr('href'))
			.get();

		let allCss = styleTag;
		if (links.length > 0) {
			const cssContents = await Promise.all(links.map((href) => fixture.readFile(href)));
			allCss += '\n' + cssContents.join('\n');
		}

		assert.ok(allCss.includes('#from-base'), 'CSS from @import with alias should be present');
	});
});
