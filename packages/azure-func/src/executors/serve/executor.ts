import { ExecutorContext, Target, parseTargetString, runExecutor } from '@nx/devkit';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { getBuildOptions } from '../../utils/getBuildOptions';
import { ServeExecutorSchema } from './schema';

export default async function runServeExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
	process.env['NODE_ENV'] ??= context?.configurationName ?? 'development';

	if (!context.projectName) {
		throw new Error(`Project name is not defined in the context. Please provide a project name.`);
	}

	const project = context.projectGraph.nodes[context.projectName];
	const buildTarget = parseTargetString(options.buildTarget, context);

	if (!project.data.targets?.[buildTarget.target]) {
		throw new Error(`Cannot find build target ${options.buildTarget} for project ${context.projectName}`);
	}

	const buildOptions: Record<string, unknown> = {
		...options.buildTargetOptions,
		watch: true,
	};

	const buildIterator = await runExecutor(buildTarget, buildOptions, context);
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
	const buildOptions = getBuildOptions(buildTarget, options, context);
	const distDir = join(context.root, buildOptions.outputPath);

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
