import * as devkit from '@nx/devkit';
import { ExecutorContext, Target } from '@nx/devkit';
import * as childProcess from 'child_process';
import { ChildProcess } from 'child_process';
import { Readable } from 'stream';
import executor from './executor';
import { ServeExecutorSchema } from './schema';

describe('Serve Executor', () => {
	let context: ExecutorContext;
	let options: ServeExecutorSchema;
	let funcProcess: ChildProcess;
	let timeout: NodeJS.Timeout;

	beforeEach(() => {
		context = {
			root: '/root',
			cwd: '/current',
			isVerbose: false,
			projectName: 'my-app',
			targetName: 'build',
			configurationName: 'production',
			taskGraph: {
				roots: [],
				dependencies: {},
				tasks: {},
			},
			projectGraph: {
				nodes: {
					'my-app': {
						type: 'app',
						name: 'my-app',
						data: {
							root: '/root',
							targets: {
								build: {
									options: {
										some: 'option',
									},
								},
							},
						},
					},
				},
				dependencies: {},
			},
			projectsConfigurations: {
				version: 1,
				projects: {
					'my-app': {
						projectType: 'application',
						root: '/root',
						targets: {
							build: {
								executor: '@ziacik/azure-func:serve',
							},
						},
					},
				},
			},
		};

		options = {
			buildTarget: 'my-app:build:development',
			buildTargetOptions: {
				some: 'build-option',
			},
		};

		jest.spyOn(console, 'error').mockImplementation((e) => {
			throw new Error('Console error: ' + e);
		});

		jest.spyOn(devkit, 'readTargetOptions').mockImplementation((target: Target) => ({
			outputPath: `/some/path/dist/${target.project}`,
		}));

		funcProcess = new ChildProcess();
		funcProcess.stdout = new Readable();
		funcProcess.stderr = new Readable();
		jest.spyOn(childProcess, 'spawn').mockReturnValueOnce(funcProcess);
		jest.spyOn(funcProcess, 'kill').mockImplementation();
		jest.spyOn(funcProcess.stdout, 'pipe').mockImplementation();
		jest.spyOn(funcProcess.stderr, 'pipe').mockImplementation();
	});

	afterEach(() => {
		// Just in case something is poorly written, let's make sure a timeout doesn't leak to other test.
		clearTimeout(timeout);
	});

	it('runs the build target first in the watch mode', async () => {
		buildWill('succeed');
		await expectNotResolving(executor(options, context));
		expect(devkit.runExecutor).toHaveBeenCalledTimes(1);
		expect(devkit.runExecutor).toHaveBeenCalledWith(
			{
				configuration: 'development',
				project: 'my-app',
				target: 'build',
			},
			{
				some: 'build-option',
				watch: true,
			},
			context
		);
	});

	async function expectNotResolving(promise: Promise<unknown>): Promise<void> {
		await expect(
			new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => resolve(), 20);
				promise
					.then(() => {
						clearTimeout(timeout);
						reject(new Error('Expected promise not to resolve.'));
					})
					.catch((e) => {
						clearTimeout(timeout);
						reject(e);
					});
			})
		).resolves.not.toThrow();
	}

	it('if the build fails, we do not fail but continue watching', async () => {
		const yields = buildWill('fail', 'fail', 'succeed');
		await expectNotResolving(executor(options, context));
		expect(yields).toStrictEqual(['fail', 'fail', 'succeed']);
	});

	it('if the first build terminates, we fail', async () => {
		buildWill('terminate');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('if some subsequent build terminates, we fail', async () => {
		buildWill('succeed', 'succeed', 'terminate');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('will not start the func before the build succeeds', async () => {
		buildWill('fail', 'fail', 'fail');
		await expectNotResolving(executor(options, context));
		expect(childProcess.spawn).not.toHaveBeenCalled();
	});

	it('after the first build success, starts the func in the dist directory', async () => {
		buildWill('fail', 'fail', 'succeed');
		await expectNotResolving(executor(options, context));
		expect(childProcess.spawn).toHaveBeenCalledWith(
			'func',
			['host', 'start', '--language-worker', '--', '--inspect=9229'],
			expect.objectContaining({
				cwd: expect.stringMatching(/dist\W*my-app/i),
			})
		);
	});

	it('if the func start terminates, we fail', async () => {
		buildWill('succeed');
		funcWillExit(1);
		const output = await executor(options, context);
		expect(output.success).toBe(false);
	});

	it('if the func start terminates even with code 0, we fail', async () => {
		buildWill('succeed');
		funcWillExit(0);
		const output = await executor(options, context);
		expect(output.success).toBe(false);
	});

	it('if subsequent build fails we do not fail', async () => {
		buildWill('succeed', 'succeed', 'fail', 'fail', 'succeed');
		await expectNotResolving(executor(options, context));
		expect(childProcess.spawn).toHaveBeenCalledTimes(1);
	});

	it('if the build terminates after the func was started, it kills the func', async () => {
		buildWill('succeed', 'terminate');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
		expect(childProcess.spawn).toHaveBeenCalledTimes(1);
		expect(funcProcess.kill).toHaveBeenCalledWith('SIGINT');
	});

	it('pipes func stdio to our stdio', async () => {
		buildWill('succeed', 'terminate');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
		expect(funcProcess.stdout?.pipe).toHaveBeenCalledWith(process.stdout);
		expect(funcProcess.stderr?.pipe).toHaveBeenCalledWith(process.stderr);
	});

	function funcWillExit(code: number): void {
		timeout = setTimeout(() => funcProcess.emit('exit', code), 10);
	}

	type BuildResult = 'succeed' | 'fail' | 'terminate';

	function buildWill(...what: BuildResult[]): string[] {
		const yields: string[] = [];

		jest.spyOn(devkit, 'runExecutor').mockResolvedValue(
			(async function* () {
				for (const buildResult of what) {
					yields.push(buildResult);
					if (buildResult === 'terminate') {
						return { success: false };
					} else {
						yield {
							success: buildResult === 'succeed',
						};
					}
				}

				await new Promise(() => {
					/* simluate watching forever */
				});

				return { success: false };
			})()
		);

		return yields;
	}
});
