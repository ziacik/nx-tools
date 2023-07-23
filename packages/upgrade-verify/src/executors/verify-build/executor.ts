import { ExecutorContext, logger, runExecutor } from '@nx/devkit';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { env } from 'process';
import { compareStats } from './dist-stat-comparer';
import { calculateDistStats, loadExistingDistStats } from './dist-stats';
import { VerifyBuildExecutorSchema } from './schema';

export default async function verifyBuild(options: VerifyBuildExecutorSchema, context: ExecutorContext) {
	if (context.workspace == null) {
		throw new Error('Workspace context info not available.');
	}

	if (context.projectName == null) {
		throw new Error('Project name not specified in context info.');
	}

	const projectConfig = context.workspace.projects[context.projectName];

	if (projectConfig.targets == null) {
		throw new Error('Target info not available for the project in context info.');
	}

	const distDir = join(context.root, projectConfig.targets['build'].options.outputPath);
	const statsDir = join(context.root, projectConfig.root, '.stats');
	await tryMkdir(statsDir);

	if (projectConfig.targets['build'].configurations == null) {
		throw new Error('Configurations info not available for the project, target "build", in context info.');
	}

	let success = true;
	const envBackup = { ...env };

	for (const configurationName of Object.keys(projectConfig.targets['build'].configurations)) {
		retainEnv(envBackup);
		const runContext: ExecutorContext = JSON.parse(JSON.stringify(context));

		const result = await runExecutor(
			{
				project: runContext.projectName ?? '',
				target: 'build',
				configuration: configurationName,
			},
			{},
			runContext
		);

		for await (const x of result) {
			if (!x.success) {
				return { success: false };
			}
		}

		const statsPath = join(statsDir, configurationName + '.json');
		const existingStats = await loadExistingDistStats(statsPath);
		const newStats = await calculateDistStats(distDir);

		await writeFile(statsPath, JSON.stringify(newStats, null, '\t'));

		if (existingStats != null) {
			const comparison = compareStats(existingStats, newStats);
			logger.info(
				`Stats for ${runContext.projectName}/${configurationName}: ${comparison.totalSizeDifferencePercentage}% total size difference, ${comparison.fileCountDifferencePercentage}% file count difference, ${comparison.newFilesPercentage}% new files, ${comparison.deletedFilesPercentage}% deleted files`
			);

			if (
				Math.abs(comparison.deletedFilesPercentage) > 10 ||
				Math.abs(comparison.fileCountDifferencePercentage) > 10 ||
				Math.abs(comparison.newFilesPercentage) > 10 ||
				Math.abs(comparison.totalSizeDifferencePercentage) > 10
			) {
				success = false;
			}
		}
	}

	return { success };
}

async function tryMkdir(statsDir: string) {
	try {
		await mkdir(statsDir);
	} catch {
		// ignore
	}
}

function retainEnv(envBackup: Record<string, unknown>): void {
	for (const key of Object.keys(env)) {
		delete env[key];
	}
	Object.assign(env, envBackup);
}
