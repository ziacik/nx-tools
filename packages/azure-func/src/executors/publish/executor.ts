import { ExecutorContext, logger, runExecutor } from '@nx/devkit';
import { join } from 'path';
import { getBuildOptions } from '../../utils/getBuildOptions';
import { getBuildTarget } from '../../utils/getBuildTarget';
import { spawnSyncChecked } from '../../utils/spawnSyncChecked';
import { PublishExecutorSchema } from './schema';

export default async function runPublishExecutor(options: PublishExecutorSchema, context: ExecutorContext): Promise<{ success: boolean }> {
	process.env['NODE_ENV'] ??= context?.configurationName ?? 'production';

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

	const azureAppName = options.azureAppName ?? context.projectName;
	const projectLanguage = options.projectLanguage ? `--${options.projectLanguage}` : '';
	if (!azureAppName) {
		logger.error(
			'Unable to determine Azure Function App name for publishing because projectName is undefined or empty. Please set azureAppName option explicitly.'
		);
		return {
			success: false,
		};
	}

	return publishDist(distDir, azureAppName, projectLanguage);
}

function buildDependenciesInDist(distDir: string): { success: boolean } {
	return spawnSyncChecked('npm', ['install', '--omit=dev'], {
		cwd: distDir,
		stdio: 'inherit',
	});
}

function publishDist(distDir: string, azureAppName: string, projectLanguage: string): { success: boolean } {
	return spawnSyncChecked(
		'func',
		['azure', 'functionapp', 'publish', azureAppName, projectLanguage],
		{
			cwd: distDir,
			stdio: 'inherit',
		},
		`The func cli command not found. Please install it with 'npm i -g azure-functions-core-tools@4 --unsafe-perm true' or see https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools`
	);
}
