import { ExecutorContext, runExecutor } from '@nx/devkit';
import { VerifyBuildExecutorSchema } from './schema';

export default async function verifyBuild(options: VerifyBuildExecutorSchema, context: ExecutorContext) {
	const projectConfig = context.workspace.projects[context.projectName];

	for (const configurationName of Object.keys(projectConfig.targets.build.configurations)) {
		const result = await runExecutor(
			{
				project: context.projectName,
				target: 'build',
				configuration: configurationName,
			},
			{},
			context
		);

		for await (const x of result) {
			console.log(x);
		}
	}

	return {
		success: true,
	};
}
