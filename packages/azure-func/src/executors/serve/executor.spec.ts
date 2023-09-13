import * as devkit from '@nx/devkit';
import { ExecutorContext, Target } from '@nx/devkit';
import * as childProcess from 'child_process';
import { execSync } from 'child_process';
import * as run from 'nx/src/command-line/run/run';
import executor from './executor';
import { ServeExecutorSchema } from './schema';

describe('Serve Executor', () => {
	let context: ExecutorContext;
	let options: ServeExecutorSchema;

	beforeEach(() => {
		jest.spyOn(console, 'error').mockImplementation((e) => {
			throw new Error('Console error: ' + e);
		});
		jest.spyOn(devkit, 'readTargetOptions').mockImplementation((target: Target) => ({
			outputPath: `/some/path/dist/${target.project}`,
		}));
		jest.spyOn(process, 'chdir').mockImplementation();
		jest.spyOn(childProcess, 'execSync').mockImplementation();
		jest.spyOn(run, 'run').mockResolvedValue(0);
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
	});

	it('runs the build target first', async () => {
		const output = await executor(options, context);
		expect(output.success).toBe(true);
		expect(run.run).toHaveBeenCalledWith(
			'/current',
			'/root',
			{
				configuration: 'development',
				project: 'my-app',
				target: 'build',
			},
			{
				some: 'build-option',
			},
			false,
			{
				roots: [],
				dependencies: {},
				tasks: {},
			}
		);
	});

	it('if the build fails, we fail', async () => {
		jest.mocked(console.error).mockImplementation();
		jest.mocked(run.run).mockResolvedValue(2);
		const output = await executor(options, context);
		expect(output.success).toBe(false);
		expect(console.error).toHaveBeenCalledWith('Build failed.');
	});

	it('will execute func start in dist of the app', async () => {
		const output = await executor(options, context);
		expect(output.success).toBe(true);
		expect(execSync).toHaveBeenCalledWith('func host start --language-worker -- --inspect=9229', { cwd: '/root/some/path/dist/my-app', stdio: 'inherit' });
	});

	it('the func start fails, we fail', async () => {
		jest.mocked(execSync).mockImplementation(() => {
			throw new Error('Some error.');
		});
		const output = await executor(options, context);
		expect(output.success).toBe(false);
	});
});
