import * as devkit from '@nx/devkit';
import { ExecutorContext, runExecutor } from '@nx/devkit';
import executor from './executor';
import { VerifyBuildExecutorSchema } from './schema';
const options: VerifyBuildExecutorSchema = {};

describe('VerifyBuild Executor', () => {
	let context: ExecutorContext;

	beforeEach(() => {
		jest.spyOn(devkit, 'runExecutor').mockResolvedValue(
			(async function* () {
				yield {
					success: true,
					options: {
						outputPath: '/some/path/dist/packages/test-app',
					},
				};
			})()
		);

		context = {
			root: 'some-root',
			cwd: '.',
			isVerbose: false,
			projectName: 'some-project',
			workspace: {
				version: 2,
				projects: {
					'some-project': {
						root: 'some-root',
						targets: {
							build: {
								configurations: {
									production: {},
									development: {},
								},
							},
						},
					},
				},
			},
		};
	});

	it('sequentially runs a build for each configuration', async () => {
		const output = await executor(options, context);
		expect(output.success).toBe(true);
		expect(runExecutor).toHaveBeenCalledWith(
			{
				project: 'some-project',
				target: 'build',
				configuration: 'production',
			},
			{},
			context
		);
		expect(runExecutor).toHaveBeenCalledWith(
			{
				project: 'some-project',
				target: 'build',
				configuration: 'development',
			},
			{},
			context
		);
	});

	it('calculates and stores stats after each build', async () => {
		// const output = await executor(options, context);
	});
});
