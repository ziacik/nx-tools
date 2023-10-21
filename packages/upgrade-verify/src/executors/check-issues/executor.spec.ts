import { ExecutorContext, logger } from '@nx/devkit';
import * as fsPromises from 'fs/promises';
import executor from './executor';
import { CheckIssuesExecutorSchema } from './schema';

describe('CheckIssues Executor', () => {
	let context: ExecutorContext;
	let options: CheckIssuesExecutorSchema;

	beforeEach(() => {
		options = {};

		globalThis.fetch = jest.fn().mockImplementation(async (url) => {
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

		jest.spyOn(logger, 'info').mockImplementation();
		jest.spyOn(fsPromises, 'readFile').mockImplementation(async () => {
			const error: NodeJS.ErrnoException = new Error('ENOENT');
			error.code = 'ENOENT';
			throw error;
		});

		context = createContext();
	});

	it('tries to read ISSUES.md file in the workspace root', async () => {
		await executor(options, context);
		expect(fsPromises.readFile).toHaveBeenCalledWith('/some/root/ISSUES.md', 'utf8');
	});

	it('just returns success if there is no ISSUES.md file in the workspace root', async () => {
		const output = await executor(options, context);
		expect(logger.info).toHaveBeenCalledWith("There is no 'ISSUES.md' file in the workspace root.");
		expect(output.success).toBe(true);
	});

	it('tells that no issues have been closed if no issues have been closed', async () => {
		jest.mocked(fsPromises.readFile).mockResolvedValue(`# Issues

https://github.com/ziacik/nx-tools/issues/12
[Some issue](https://github.com/ziacik/nx-tools/issues/135)
`);
		const output = await executor(options, context);

		expect(logger.info).not.toHaveBeenCalledWith('Issues which are closed now:');
		expect(logger.info).toHaveBeenCalledWith('No issues have been closed.');

		expect(output.success).toBe(true);
	});

	it('checks all github issues found in ISSUES.md file in workspace root', async () => {
		jest.mocked(fsPromises.readFile).mockResolvedValue(`# Issues

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
		jest.mocked(fsPromises.readFile).mockResolvedValue(`# Issues

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
	};
}
