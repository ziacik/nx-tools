import * as devkit from '@nx/devkit';
import { ExecutorContext, logger } from '@nx/devkit';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import DIFFERING_STATS from './__fixtures__/differing-stats.json';
import EXPECTED_STATS_NOHASH from './__fixtures__/expected-stats-nohash.json';
import EXPECTED_STATS from './__fixtures__/expected-stats.json';
import executor from './executor';
import { VerifyBuildExecutorSchema } from './schema';

vi.mock('fs/promises', async () => {
	const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
	return {
		...actual,
		mkdir: vi.fn(),
		readFile: vi.fn(),
		writeFile: vi.fn(),
	};
});

describe('VerifyBuild Executor', () => {
	let context: ExecutorContext;
	let options: VerifyBuildExecutorSchema;

	beforeEach(() => {
		options = {
			removeHashes: false,
		};

		vi.spyOn(logger, 'info').mockImplementation(() => undefined);
		vi.mocked(writeFile).mockResolvedValue(undefined);
		vi.mocked(mkdir).mockResolvedValue(undefined);
		vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));
		vi.spyOn(devkit, 'runExecutor').mockResolvedValue(
			(async function* () {
				yield {
					success: true,
					options: {
						outputPath: resolve(__dirname, '__fixtures__/_dist/test-app'),
					},
				};
			})(),
		);

		context = createContext();
	});

	it('sequentially runs a build for each configuration', async () => {
		const output = await executor(options, context);
		expect(output.success).toBe(true);
		expect(devkit.runExecutor).toHaveBeenCalledWith(
			{
				project: 'my-project',
				target: 'build',
				configuration: 'production',
			},
			{},
			context,
		);
		expect(devkit.runExecutor).toHaveBeenCalledWith(
			{
				project: 'my-project',
				target: 'build',
				configuration: 'development',
			},
			{},
			context,
		);
	});

	it('calculates and stores stats after each build', async () => {
		await executor(options, context);

		expect(mkdir).toHaveBeenCalledWith(resolve(__dirname, '../../../../..', 'packages/my-project/.stats'));
		expect(mkdir).toHaveBeenCalledTimes(1);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/production.json'),
			JSON.stringify(EXPECTED_STATS, null, '\t'),
		);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/development.json'),
			JSON.stringify(EXPECTED_STATS, null, '\t'),
		);
	});

	it('removes hashes from filenames if removeHashes is true', async () => {
		options.removeHashes = true;
		await executor(options, context);

		expect(mkdir).toHaveBeenCalledWith(resolve(__dirname, '../../../../..', 'packages/my-project/.stats'));
		expect(mkdir).toHaveBeenCalledTimes(1);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/production.json'),
			JSON.stringify(EXPECTED_STATS_NOHASH, null, '\t'),
		);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/development.json'),
			JSON.stringify(EXPECTED_STATS_NOHASH, null, '\t'),
		);
	});

	it('removes hashes by default (if removeHashes is not set)', async () => {
		delete options.removeHashes;
		await executor(options, context);

		expect(mkdir).toHaveBeenCalledWith(resolve(__dirname, '../../../../..', 'packages/my-project/.stats'));
		expect(mkdir).toHaveBeenCalledTimes(1);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/production.json'),
			JSON.stringify(EXPECTED_STATS_NOHASH, null, '\t'),
		);

		expect(writeFile).toHaveBeenCalledWith(
			resolve(__dirname, '../../../../..', 'packages/my-project/.stats/development.json'),
			JSON.stringify(EXPECTED_STATS_NOHASH, null, '\t'),
		);
	});

	it('compares the calculated stats after each build to the previous one, if exist, and writes to output', async () => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify(DIFFERING_STATS));
		await executor(options, context);

		expect(logger.info).toHaveBeenCalledWith(
			'Stats for my-project/development: 29% total size difference, -9% file count difference, 30% new files, 36% deleted files',
		);
		expect(logger.info).toHaveBeenCalledWith(
			'Stats for my-project/production: 29% total size difference, -9% file count difference, 30% new files, 36% deleted files',
		);
	});

	it('compares the calculated stats after each build to the previous one, reports zero differences if there are zero differences', async () => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_STATS));
		await executor(options, context);

		expect(logger.info).toHaveBeenCalledWith(
			'Stats for my-project/development: 0% total size difference, 0% file count difference, 0% new files, 0% deleted files',
		);
		expect(logger.info).toHaveBeenCalledWith(
			'Stats for my-project/production: 0% total size difference, 0% file count difference, 0% new files, 0% deleted files',
		);
	});

	it('passes as success if none of the percentages exceeds 10%', async () => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify(EXPECTED_STATS));
		const { success } = await executor(options, context);
		expect(success).toBe(true);
	});

	it('fails if some of the percentages exceeds 10%', async () => {
		vi.mocked(readFile).mockResolvedValue(JSON.stringify(DIFFERING_STATS));
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('fails immediately if some of the builds fails', async () => {
		vi.spyOn(devkit, 'runExecutor').mockResolvedValue(
			(async function* () {
				yield { success: false };
			})(),
		);
		const { success } = await executor(options, context);
		expect(success).toBe(false);
		expect(readFile).not.toHaveBeenCalled();
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('isolates build runs from executor context modifications', async () => {
		vi.spyOn(devkit, 'runExecutor').mockImplementation(async (targetDescription, overrides, context) => {
			if (context.target?.command === 'should-not-retain-this') {
				throw new Error('Context is modified from previous run.');
			}
			context.target ??= {};
			context.target.command = 'should-not-retain-this';
			return (async function* () {
				yield { success: true };
			})();
		});
		context.target = { command: 'whatever' };
		const { success } = await executor(options, context);
		expect(success).toBe(true);
	});

	it('isolates build runs from process env modifications (but retains the originals)', async () => {
		vi.spyOn(devkit, 'runExecutor').mockImplementation(async () => {
			if (process.env['something'] === 'should-not-retain-this') {
				throw new Error('Env is modified from previous run.');
			}
			if (process.env['andThis'] !== 'should-be-retained') {
				throw new Error('Env var has not been retained between runs.');
			}
			process.env['something'] = 'should-not-retain-this';
			return (async function* () {
				yield { success: true };
			})();
		});
		process.env['andThis'] = 'should-be-retained';
		const { success } = await executor(options, context);
		expect(success).toBe(true);
	});
});

function createContext(): ExecutorContext {
	return {
		root: resolve(__dirname, '../../../../..'),
		cwd: '.',
		isVerbose: false,
		projectName: 'my-project',
		projectsConfigurations: {
			version: 2,
			projects: {
				'my-project': {
					root: 'packages/my-project',
					targets: {
						build: {
							options: {
								outputPath: 'packages/upgrade-verify/src/executors/verify-build/__fixtures__/_dist/test-app',
							},
							configurations: {
								production: {},
								development: {},
							},
						},
					},
				},
			},
		},
		nxJsonConfiguration: {},
		projectGraph: {
			nodes: {},
			dependencies: {},
		},
	};
}
