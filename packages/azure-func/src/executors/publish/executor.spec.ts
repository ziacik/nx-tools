import * as devkit from '@nx/devkit';
import { ExecutorContext, Target } from '@nx/devkit';
import * as childProcess from 'child_process';
import executor from './executor';
import { PublishExecutorSchema } from './schema';

describe('Publish Executor', () => {
	let context: ExecutorContext;
	let options: PublishExecutorSchema;
	let npmProcessResult: BuildResult;
	let funcProcessResult: BuildResult;

	beforeEach(() => {
		npmProcessResult = 'succeed';
		funcProcessResult = 'succeed';

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
			azureAppName: 'some-azure-app',
			buildTarget: 'my-app:build:production',
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

		jest.spyOn(childProcess, 'spawnSync').mockImplementation((command) => {
			const result = command === 'npm' ? npmProcessResult : command === 'func' ? funcProcessResult : 'terminate';

			if (result === 'succeed') {
				return { pid: 123, status: 0, output: [], stdout: '', stderr: '', signal: null };
			} else if (result === 'fail') {
				return { pid: 123, status: 1, output: [], stdout: '', stderr: '', signal: null };
			} else {
				throw new Error('Process spawn error.');
			}
		});
	});

	it('runs the build target first', async () => {
		buildWill('succeed');
		npmProcessWill('succeed');
		const { success } = await executor(options, context);
		expect(success).toBe(true);
		expect(devkit.runExecutor).toHaveBeenCalledTimes(1);
		expect(devkit.runExecutor).toHaveBeenCalledWith(
			{
				configuration: 'production',
				project: 'my-app',
				target: 'build',
			},
			{
				some: 'build-option',
				watch: false,
			},
			context
		);
	});

	it('if the build fails, we fail', async () => {
		buildWill('fail');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('if subsequent build fails, we fail', async () => {
		buildWill('succeed', 'succeed', 'fail');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('will not start dependency installation if the build fails', async () => {
		buildWill('fail');
		await executor(options, context);
		expect(childProcess.spawnSync).not.toHaveBeenCalled();
	});

	it('installs dependencies in the dist dir after build', async () => {
		buildWill('succeed');
		npmProcessWill('fail');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('npm', ['install', '--omit=dev'], {
			cwd: expect.stringMatching(/dist(\\|\/)my-app/),
			shell: true,
			stdio: 'inherit',
		});
	});

	it('if installing dependencies fails, we fail', async () => {
		buildWill('succeed');
		npmProcessWill('fail');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});

	it('if installing dependencies throws, we fail', async () => {
		buildWill('succeed');
		npmProcessWill('terminate');
		expectLogError();
		const { success } = await executor(options, context);
		expect(success).toBe(false);
		expect(devkit.logger.error).toHaveBeenCalledWith(new Error('Process spawn error.'));
	});

	it('will not start publish if npm i fails', async () => {
		buildWill('succeed');
		npmProcessWill('fail');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('npm', expect.anything(), expect.anything());
		expect(childProcess.spawnSync).not.toHaveBeenCalledWith('func', expect.anything(), expect.anything());
	});

	it('runs func to publish the app to azure', async () => {
		buildWill('succeed');
		npmProcessWill('succeed');
		funcProcessWill('succeed');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('func', ['azure', 'functionapp', 'publish', 'some-azure-app'], {
			cwd: expect.stringMatching(/dist(\\|\/)my-app/),
			stdio: 'inherit',
		});
	});

	it('will use application name if azureAppName option is not set', async () => {
		buildWill('succeed');
		npmProcessWill('succeed');
		funcProcessWill('succeed');
		delete options.azureAppName;
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('func', ['azure', 'functionapp', 'publish', 'my-app'], {
			cwd: expect.stringMatching(/dist(\\|\/)my-app/),
			stdio: 'inherit',
		});
	});

	it('if publish terminates, we fail', async () => {
		buildWill('succeed');
		npmProcessWill('succeed');
		funcProcessWill('terminate');
		expectLogError();
		const output = await executor(options, context);
		expect(output.success).toBe(false);
		expect(devkit.logger.error).toHaveBeenCalledWith(new Error('Process spawn error.'));
	});

	it('if publish fails, we fail', async () => {
		buildWill('succeed');
		npmProcessWill('succeed');
		funcProcessWill('fail');
		const output = await executor(options, context);
		expect(output.success).toBe(false);
	});

	type BuildResult = 'succeed' | 'fail' | 'terminate';

	function npmProcessWill(what: BuildResult): void {
		npmProcessResult = what;
	}

	function funcProcessWill(what: BuildResult): void {
		funcProcessResult = what;
	}

	function buildWill(...what: BuildResult[]): void {
		jest.spyOn(devkit, 'runExecutor').mockResolvedValue(
			(async function* () {
				for (const buildResult of what) {
					if (buildResult === 'terminate') {
						return { success: false };
					} else {
						yield {
							success: buildResult === 'succeed',
						};
					}
				}

				return { success: true };
			})()
		);
	}
});

function expectLogError() {
	jest.spyOn(devkit.logger, 'error').mockImplementation();
}
