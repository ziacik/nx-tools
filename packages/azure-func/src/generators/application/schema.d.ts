import type { ProjectNameAndRootFormat } from '@nx/devkit/src/generators/project-name-and-root-utils';
import type { Linter } from '@nx/eslint';

export interface ApplicationGeneratorSchema {
	name: string;
	azureAppName?: string;
	projectLanguage?: string;
	strict?: boolean;
	skipFormat?: boolean;
	directory?: string;
	projectNameAndRootFormat?: ProjectNameAndRootFormat;
	unitTestRunner?: 'jest' | 'none';
	e2eTestRunner?: 'jest' | 'none';
	linter?: Linter;
	tags?: string;
	swcJest?: boolean;
	js?: boolean;
	setParserOptionsProject?: boolean;
	bundler?: 'esbuild' | 'webpack';
	port?: number;
	rootProject?: boolean;
	docker?: boolean;
}
