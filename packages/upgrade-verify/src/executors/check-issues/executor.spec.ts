import { ExecutorContext, logger } from '@nx/devkit';
import { readFile } from 'fs/promises';
import executor from './executor';
import { CheckIssuesExecutorSchema } from './schema';

vi.mock('fs/promises', () => ({
	readFile: vi.fn(),
}));

describe('CheckIssues Executor', () => {
	let context: ExecutorContext;
	let options: CheckIssuesExecutorSchema;
	beforeEach(() => {
		options = {};
		globalThis.fetch = vi.fn().mockImplementation(async (url) => {
			if (url === 'https://api.github.com/repos/ziacik/nx-tools/issues/1') {
				return new Response(JSON.stringify({ state: 'closed' }));
			} else if (url === 'https://api.github.com/repos/ziacik/nx-tools/issues/12') {
				return new Response(JSON.stringify({ state: 'open' }));
			} else if (url === 'https://api.github.com/repos/ziacik/nx-tools/issues/135') {
				return new Response(JSON.stringify({ state: 'open' }));
			} else {
				throw new Error('Unexpected url');
			}
		});
		vi.spyOn(logger, 'info').mockImplementation(() => undefined);
		vi.mocked(readFile).mockImplementation(async () => {
			const error: NodeJS.ErrnoException = new Error('ENOENT');
			error.code = 'ENOENT';
			throw error;
		});
		context = createContext();
	});
	it('tries to read ISSUES.md file in the workspace root', async () => {
		await executor(options, context);
		expect(readFile).toHaveBeenCalledWith('/some/root/ISSUES.md', 'utf8');
	});
	it('just returns success if there is no ISSUES.md file in the workspace root', async () => {
		const output = await executor(options, context);
		expect(logger.info).toHaveBeenCalledWith("There is no 'ISSUES.md' file in the workspace root.");
		expect(output.success).toBe(true);
	});
	it('tells that no issues have been closed if no issues have been closed', async () => {
		vi.mocked(readFile).mockResolvedValue(`# Issues

https://github.com/ziacik/nx-tools/issues/12
[Some issue](https://github.com/ziacik/nx-tools/issues/135)
`);
		const output = await executor(options, context);
		expect(logger.info).not.toHaveBeenCalledWith('Issues which are closed now:');
		expect(logger.info).toHaveBeenCalledWith('No issues have been closed.');
		expect(output.success).toBe(true);
	});
	it('checks all github issues found in ISSUES.md file in workspace root', async () => {
		vi.mocked(readFile).mockResolvedValue(`# Issues

[https://github.com/ziacik/nx-tools/issues/1](https://github.com/ziacik/nx-tools/issues/1)
https://github.com/ziacik/nx-tools/issues/12
[Some issue](https://github.com/ziacik/nx-tools/issues/135)
`);
		const output = await executor(options, context);
		expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/ziacik/nx-tools/issues/1');
		expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/ziacik/nx-tools/issues/12');
		expect(fetch).toHaveBeenCalledWith('https://api.github.com/repos/ziacik/nx-tools/issues/135');
		expect(fetch).toHaveBeenCalledTimes(3);
		expect(output.success).toBe(true);
	});
	it('lists all issues which are in the list and have become closed already', async () => {
		vi.mocked(readFile).mockResolvedValue(`# Issues

[https://github.com/ziacik/nx-tools/issues/1](https://github.com/ziacik/nx-tools/issues/1)
https://github.com/ziacik/nx-tools/issues/12
[Some issue](https://github.com/ziacik/nx-tools/issues/135)
`);
		const output = await executor(options, context);
		expect(logger.info).toHaveBeenCalledWith('Issues which are closed now:');
		expect(logger.info).toHaveBeenCalledWith('- [https://github.com/ziacik/nx-tools/issues/1](https://github.com/ziacik/nx-tools/issues/1)');
		expect(logger.info).not.toHaveBeenCalledWith('- https://github.com/ziacik/nx-tools/issues/12');
		expect(logger.info).not.toHaveBeenCalledWith('- https://github.com/ziacik/nx-tools/issues/135');
		expect(logger.info).toHaveBeenCalledTimes(2);
		expect(output.success).toBe(true);
	});
});
function createContext(): ExecutorContext {
	return {
		root: '/some/root',
		cwd: '.',
		isVerbose: false,
		projectName: 'my-project',
		projectGraph: {
			nodes: {},
			dependencies: {},
		},
		projectsConfigurations: {
			version: 0,
			projects: {},
		},
		nxJsonConfiguration: {},
	};
}
