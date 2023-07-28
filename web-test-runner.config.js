import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';

export default {
	files: 'src/**/*.test.ts',
	plugins: [
		vitePlugin(),
	],
    testFramework: {
        config: {
            ui: 'bdd',
            timeout: '2000',
        }
    },
};