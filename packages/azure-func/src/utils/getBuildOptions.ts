import { ExecutorContext, Target, readTargetOptions } from '@nx/devkit';
import { SchemaWithBuildTarget } from './schemaWithBuildTarget';

interface BuildOptions {
	outputPath: string;
	[key: string]: unknown;
}

export function getBuildOptions(buildTarget: Target, options: SchemaWithBuildTarget, context: ExecutorContext): BuildOptions {
	return {
		...readTargetOptions(buildTarget, context),
		...options.buildTargetOptions,
	};
}
