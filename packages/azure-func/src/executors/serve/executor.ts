import { ExecutorContext, parseTargetString, readTargetOptions } from '@nx/devkit';
import { ExecutorOptions } from '@nx/js/src/utils/schema';
import * as chalk from 'chalk';
import { execSync } from 'child_process';
import { run } from 'nx/src/command-line/run/run';
import { join } from 'path';
import { ServeExecutorSchema } from './schema';

export default async function runExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
	process.env.NODE_ENV ??= context?.configurationName ?? 'development';

	const project = context.projectGraph.nodes[context.projectName];
	const buildTarget = parseTargetString(options.buildTarget, context.projectGraph);

	if (!project.data.targets[buildTarget.target]) {
		throw new Error(`Cannot find build target ${chalk.bold(options.buildTarget)} for project ${chalk.bold(context.projectName)}`);
	}

	const buildOptions: ExecutorOptions = {
		...readTargetOptions(buildTarget, context),
		...options.buildTargetOptions,
	};

	const result = await run(context.cwd, context.root, buildTarget, { ...options.buildTargetOptions }, context.isVerbose, context.taskGraph);

	if (result !== 0) {
		console.error('Build failed.');
		return {
			success: false,
		};
	}

	const outputPath: string = buildOptions.outputPath;
	const distDir = join(context.root, outputPath);

	try {
		execSync('func host start --language-worker -- --inspect=9229', {
			cwd: distDir,
			stdio: 'inherit',
		});

		return {
			success: true,
		};
	} catch {
		return {
			success: false,
		};
	}
}
