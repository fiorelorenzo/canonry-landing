import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

// SvelteKit's Vite plugin snapshots process.env via loadEnv() during config resolution,
// before any route or test file's own code runs, so the fallback has to live here to make
// `pnpm dev` and `pnpm test` work against a local dev Postgres with no .env file.
process.env.DATABASE_URL ??=
	process.env.TEST_DATABASE_URL ?? 'postgres://canonry:canonry@127.0.0.1:55195/canonry_landing';
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		// Nothing here loads a real database in a test: the waitlist
		// insert takes its `postgres.Sql` as a parameter, so its own tests pass a fake.
		// No test-global-setup, no TEST_DATABASE_URL, on purpose.
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
