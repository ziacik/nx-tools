import { ExecutorContext, Target, parseTargetString, readTargetOptions, runExecutor } from '@nx/devkit';
import { ExecutorOptions } from '@nx/js/src/utils/schema';
import * as chalk from 'chalk';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { ServeExecutorSchema } from './schema';

export default async function runxExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
	process.env['NODE_ENV'] ??= context?.configurationName ?? 'development';

	if (context.projectName == null) {
		throw new Error('ProjectName undefined in executor context.');
	}

	if (context.projectGraph == null) {
		throw new Error('ProjectName undefined in executor context.');
	}

	const project = context.projectGraph.nodes[context.projectName];

	if (project.data.targets == null) {
		throw new Error('Project targets undefined in executor context.');
	}

	const buildTarget = parseTargetString(options.buildTarget, context.projectGraph);

	if (!project.data.targets[buildTarget.target]) {
		throw new Error(`Cannot find build target ${chalk.bold(options.buildTarget)} for project ${chalk.bold(context.projectName)}`);
	}

	const buildIterator = await runExecutor(buildTarget, { ...options.buildTargetOptions, watch: true }, context);
	let buildResult = await buildIterator.next();

	if (buildResult.done) {
		return { success: false };
	}

	buildResult = await waitForSuccessfulBuild(buildResult, buildIterator);

	const azureFuncProcess = runAzureFunction(buildTarget, options, context);
	const azureFuncExitIterator = getProcessExitIterator(azureFuncProcess);

	while (!buildResult.done) {
		buildResult = await Promise.race([buildIterator.next(), azureFuncExitIterator.next()]);
	}

	azureFuncProcess.kill('SIGINT');

	return {
		success: false,
	};
}

async function waitForSuccessfulBuild(
	buildResult: IteratorResult<{ success: boolean }, { success: boolean }>,
	buildIterator: AsyncIterableIterator<{ success: boolean }>
) {
	while (!buildResult.value.success) {
		buildResult = await buildIterator.next();
	}
	return buildResult;
}

function runAzureFunction(buildTarget: Target, options: ServeExecutorSchema, context: ExecutorContext) {
	const buildOptions: ExecutorOptions = {
		...readTargetOptions(buildTarget, context),
		...options.buildTargetOptions,
	};

	const outputPath = buildOptions.outputPath;
	const distDir = join(context.root, outputPath);

	const funcProcess = spawn('func', ['host', 'start', '--language-worker', '--', '--inspect=9229'], {
		cwd: distDir,
	});

	funcProcess.stdout.pipe(process.stdout);
	funcProcess.stderr.pipe(process.stderr);

	return funcProcess;
}

async function* getProcessExitIterator(funcProcess: ChildProcess): AsyncGenerator<{ success: boolean }> {
	yield await new Promise((resolve) => {
		funcProcess.on('exit', (code) => {
			resolve({ success: code === 0 });
		});
	});
}
