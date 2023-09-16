import { ExecutorContext, runExecutor } from '@nx/devkit';
import { getBuildOptions, getBuildTarget, spawnSyncChecked } from '@ziacik/util';
import { join } from 'path';
import { PublishExecutorSchema } from './schema';

export default async function runPublishExecutor(options: PublishExecutorSchema, context: ExecutorContext): Promise<{ success: boolean }> {
	process.env['NODE_ENV'] ??= context?.configurationName ?? 'development';

	const buildTarget = getBuildTarget(options, context);

	const buildIterator = await runExecutor(buildTarget, { ...options.buildTargetOptions, watch: false }, context);

	for await (const buildResult of buildIterator) {
		if (!buildResult.success) {
			return buildResult;
		}
	}

	const buildOptions = getBuildOptions(buildTarget, options, context);
	const distDir = join(context.root, buildOptions.outputPath);

	const npmResult = buildDependenciesInDist(distDir);

	if (!npmResult.success) {
		return npmResult;
	}

	return publishDist(distDir, options.azureAppName);
}

function buildDependenciesInDist(distDir: string): { success: boolean } {
	return spawnSyncChecked('npm', ['install', '--omit=dev'], {
		cwd: distDir,
		stdio: 'inherit',
	});
}

function publishDist(distDir: string, azureAppName: string): { success: boolean } {
	return spawnSyncChecked('func', ['azure', 'functionapp', 'publish', azureAppName], {
		cwd: distDir,
		stdio: 'inherit',
	});
}
