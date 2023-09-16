import { ExecutorContext, Target, runExecutor } from '@nx/devkit';
import { getBuildOptions, getBuildTarget } from '@ziacik/util';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { ServeExecutorSchema } from './schema';

export default async function runServeExecutor(options: ServeExecutorSchema, context: ExecutorContext) {
	process.env['NODE_ENV'] ??= context?.configurationName ?? 'development';

	const buildTarget = getBuildTarget(options, context);

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
