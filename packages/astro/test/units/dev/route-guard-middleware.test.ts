import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { routeGuardMiddleware } from '../../../dist/vite-plugin-astro-server/route-guard.js';
import { createBasicSettings, createFixture, createRequestAndResponse } from '../test-utils.ts';

describe('routeGuardMiddleware', () => {
	it('allows src/ files through on browser navigation (Accept: text/html)', async () => {
		const fixture = await createFixture({
			'src/downloads/a.pdf': '%PDF-1.4 test content',
		});

		const settings = await createBasicSettings({ root: fixture.path });
		const middleware = routeGuardMiddleware(settings);

		// Simulate browser navigation to a ?url-imported asset
		// Vite resolves ?url imports to paths like /src/downloads/a.pdf
		const { req, res } = createRequestAndResponse({
			method: 'GET',
			url: '/src/downloads/a.pdf',
			headers: {
				accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		});

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(nextCalled, 'Expected next() to be called for src/ files, but request was blocked');
	});

	it('blocks root-level files outside srcDir/publicDir', async () => {
		const fixture = await createFixture({
			'README.md': '# Test',
			'src/pages/index.astro': '',
		});

		const settings = await createBasicSettings({ root: fixture.path });
		const middleware = routeGuardMiddleware(settings);

		const { req, res } = createRequestAndResponse({
			method: 'GET',
			url: '/README.md',
			headers: {
				accept: 'text/html',
			},
		});

		let nextCalled = false;
		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.ok(!nextCalled, 'Expected request to be blocked for root-level files');
		assert.equal(res.statusCode, 404);
	});
});
