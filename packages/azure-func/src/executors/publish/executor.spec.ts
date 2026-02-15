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
			nxJsonConfiguration: {},
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
		jest.spyOn(devkit, 'runExecutor');
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
	it('does not run build target and only publishes existing dist artifacts', async () => {
		const { success } = await executor(options, context);
		expect(success).toBe(true);
		expect(devkit.runExecutor).not.toHaveBeenCalled();
	});
	it('installs dependencies in the dist dir', async () => {
		npmProcessWill('fail');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('npm', ['install', '--omit=dev'], {
			cwd: expect.stringMatching(/dist(\\|\/)my-app/),
			shell: true,
			stdio: 'inherit',
		});
	});
	it('if installing dependencies fails, we fail', async () => {
		npmProcessWill('fail');
		const { success } = await executor(options, context);
		expect(success).toBe(false);
	});
	it('if installing dependencies throws, we fail', async () => {
		npmProcessWill('terminate');
		expectLogError();
		const { success } = await executor(options, context);
		expect(success).toBe(false);
		expect(devkit.logger.error).toHaveBeenCalledWith(new Error('Process spawn error.'));
	});
	it('will not start publish if npm i fails', async () => {
		npmProcessWill('fail');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('npm', expect.anything(), expect.anything());
		expect(childProcess.spawnSync).not.toHaveBeenCalledWith('func', expect.anything(), expect.anything());
	});
	it('runs func to publish the app to azure', async () => {
		npmProcessWill('succeed');
		funcProcessWill('succeed');
		await executor(options, context);
		expect(childProcess.spawnSync).toHaveBeenCalledWith('func', ['azure', 'functionapp', 'publish', 'some-azure-app'], {
			cwd: expect.stringMatching(/dist(\\|\/)my-app/),
			stdio: 'inherit',
		});
	});
	it('will use application name if azureAppName option is not set', async () => {
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
		npmProcessWill('succeed');
		funcProcessWill('terminate');
		expectLogError();
		const output = await executor(options, context);
		expect(output.success).toBe(false);
		expect(devkit.logger.error).toHaveBeenCalledWith(new Error('Process spawn error.'));
	});
	it('if publish fails, we fail', async () => {
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
});
function expectLogError() {
	jest.spyOn(devkit.logger, 'error').mockImplementation();
}
