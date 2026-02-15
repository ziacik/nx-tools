import {
	GeneratorCallback,
	ProjectConfiguration,
	Tree,
	addDependenciesToPackageJson,
	convertNxGenerator,
	formatFiles,
	generateFiles,
	joinPathFragments,
	offsetFromRoot,
	readProjectConfiguration,
	runTasksInSerial,
	toJS,
	updateJson,
	updateProjectConfiguration,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { getRelativePathToRootTsConfig } from '@nx/js';
import { applicationGenerator as nodeApplicationGenerator } from '@nx/node';
import { join } from 'path';
import functionGenerator from '../function/generator';
import { ApplicationGeneratorSchema } from './schema';

export interface NormalizedSchema extends ApplicationGeneratorSchema {
	appProjectRoot: string;
	parsedTags: string[];
}

function addFiles(tree: Tree, options: NormalizedSchema) {
	generateFiles(tree, join(__dirname, './files'), options.appProjectRoot, {
		...options,
		tmpl: '',
		name: options.name,
		root: options.appProjectRoot,
		offset: offsetFromRoot(options.appProjectRoot),
		rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.appProjectRoot),
	});

	if (options.js) {
		toJS(tree);
	}
}

function adjustProjectConfig(tree: Tree, normalizedOptions: NormalizedSchema): ProjectConfiguration {
	const generatedProjectConfig = readProjectConfiguration(tree, normalizedOptions.name);
	const generatedServeTarget = generatedProjectConfig.targets?.['serve'];
	const serveBuildTargetOptions = generatedServeTarget?.options?.buildTargetOptions;

	const sharedBuildOptions = {
		buildTarget: generatedServeTarget?.options?.buildTarget ?? `${normalizedOptions.name}:build`,
		...(serveBuildTargetOptions !== undefined ? { buildTargetOptions: serveBuildTargetOptions } : {}),
	};

	return {
		...generatedProjectConfig,
		targets: {
			...generatedProjectConfig.targets,
			build: {
				...generatedProjectConfig.targets?.['build'],
				options: {
					...generatedProjectConfig.targets?.['build'].options,
					bundle: true,
					assets: [
						{
							glob: 'host.json',
							input: normalizedOptions.appProjectRoot,
							output: '',
						},
						{
							glob: 'local.settings.json',
							input: normalizedOptions.appProjectRoot,
							output: '',
						},
					],
				},
			},
			serve: {
				...generatedServeTarget,
				executor: '@ziacik/azure-func:serve',
				options: sharedBuildOptions,
			},
			publish: {
				executor: '@ziacik/azure-func:publish',
				defaultConfiguration: 'production',
				options: {
					...sharedBuildOptions,
					azureAppName: normalizedOptions.azureAppName,
				},
				configurations: generatedServeTarget?.configurations,
				dependsOn: ['build'],
			},
		},
	};
}

async function normalizeOptions(host: Tree, options: ApplicationGeneratorSchema): Promise<NormalizedSchema> {
	const { projectName: appProjectName, projectRoot: appProjectRoot } = await determineProjectNameAndRootOptions(host, {
		name: options.name,
		projectType: 'application',
		directory: options.directory,
		rootProject: options.rootProject,
	});

	options.rootProject = appProjectRoot === '.';

	options.bundler = 'esbuild';
	options.e2eTestRunner = options.e2eTestRunner ?? 'jest';

	const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

	return {
		...options,
		name: appProjectName,
		appProjectRoot,
		parsedTags,
		linter: options.linter ?? 'eslint',
		unitTestRunner: options.unitTestRunner ?? 'jest',
		rootProject: options.rootProject ?? false,
	};
}

function makeStrict(host: Tree, options: NormalizedSchema): void {
	updateJson(host, joinPathFragments(options.appProjectRoot, 'tsconfig.json'), (tsconfig) => {
		tsconfig.compilerOptions = {
			...tsconfig.compilerOptions,
			forceConsistentCasingInFileNames: true,
			strict: true,
			noImplicitOverride: true,
			noPropertyAccessFromIndexSignature: true,
			noImplicitReturns: true,
			noFallthroughCasesInSwitch: true,
		};

		return tsconfig;
	});
}

function addProjectDependencies(tree: Tree): GeneratorCallback {
	return addDependenciesToPackageJson(
		tree,
		{
			'@azure/functions': '^4.7.0',
		},
		{},
	);
}

export async function applicationGenerator(tree: Tree, schema: ApplicationGeneratorSchema) {
	const normalizedOptions = await normalizeOptions(tree, schema);

	await nodeApplicationGenerator(tree, {
		...normalizedOptions,
	});

	const tasks: GeneratorCallback[] = [];
	const installTask = addProjectDependencies(tree);
	tasks.push(installTask);

	const projectConfig = adjustProjectConfig(tree, normalizedOptions);

	updateProjectConfiguration(tree, normalizedOptions.name, projectConfig);
	makeStrict(tree, normalizedOptions);

	addFiles(tree, normalizedOptions);
	await functionGenerator(tree, { name: 'hello', project: normalizedOptions.name });

	await formatFiles(tree);

	return runTasksInSerial(...tasks);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
