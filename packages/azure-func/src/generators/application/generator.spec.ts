import { Tree, getProjects, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { applicationGenerator } from './generator';

describe('application generator', () => {
	let tree: Tree;

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should install azure func dependencies', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
		});

		const packageJson = readJson(tree, 'package.json');
		expect(packageJson).toMatchObject({
			dependencies: {
				'@azure/functions': '^4.1.0',
			},
		});
	});

	it('should update project config', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
		});

		const project = readProjectConfiguration(tree, 'my-function-app');

		expect(project.root).toEqual('my-function-app');
		expect(project.targets?.['build']).toStrictEqual({
			executor: '@nx/esbuild:esbuild',
			outputs: ['{options.outputPath}'],
			defaultConfiguration: 'production',
			options: {
				platform: 'node',
				outputPath: 'dist/my-function-app',
				format: ['cjs'],
				bundle: true,
				main: 'my-function-app/src/main.ts',
				tsConfig: 'my-function-app/tsconfig.app.json',
				assets: [
					{
						input: 'my-function-app',
						glob: 'host.json',
						output: '',
					},
					{
						input: 'my-function-app',
						glob: 'local.settings.json',
						output: '',
					},
				],
				generatePackageJson: true,
				esbuildOptions: {
					sourcemap: true,
					outExtension: {
						'.js': '.js',
					},
				},
			},
			configurations: {
				development: {},
				production: {
					esbuildOptions: {
						sourcemap: false,
						outExtension: {
							'.js': '.js',
						},
					},
				},
			},
		});

		expect(project.targets?.['serve']).toStrictEqual({
			executor: '@ziacik/azure-func:serve',
			defaultConfiguration: 'development',
			options: {
				buildTarget: 'my-function-app:build',
			},
			configurations: {
				development: {
					buildTarget: 'my-function-app:build:development',
				},
				production: {
					buildTarget: 'my-function-app:build:production',
				},
			},
		});

		expect(project.targets?.['publish']).toStrictEqual({
			executor: '@ziacik/azure-func:publish',
			defaultConfiguration: 'production',
			options: {
				buildTarget: 'my-function-app:build',
			},
			configurations: {
				development: {
					buildTarget: 'my-function-app:build:development',
				},
				production: {
					buildTarget: 'my-function-app:build:production',
				},
			},
			dependsOn: ['build'],
		});

		expect(project.targets?.['lint']).toStrictEqual({
			executor: '@nx/eslint:lint',
			outputs: ['{options.outputFile}'],
		});

		expect(() => readProjectConfiguration(tree, 'my-function-app-e2e')).not.toThrow();
	});

	it('should update tags', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
			tags: 'one,two',
		});
		const projects = Object.fromEntries(getProjects(tree));
		expect(projects).toMatchObject({
			'my-function-app': {
				tags: ['one', 'two'],
			},
		});
	});

	it('should generate files', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
		});
		expect(tree.exists(`my-function-app/jest.config.ts`)).toBeTruthy();
		expect(tree.exists('my-function-app/src/main.ts')).toBeTruthy();
		expect(tree.exists('my-function-app/src/hello/hello.function.ts')).toBeTruthy();
		expect(tree.exists('my-function-app/src/hello/hello.function.spec.ts')).toBeTruthy();
		expect(tree.exists('my-function-app/.funcignore')).toBeTruthy();
		expect(tree.exists('my-function-app/host.json')).toBeTruthy();
		expect(tree.exists('my-function-app/local.settings.json')).toBeTruthy();

		const tsconfig = readJson(tree, 'my-function-app/tsconfig.json');
		expect(tsconfig).toMatchInlineSnapshot(`
			{
			  "compilerOptions": {
			    "esModuleInterop": true,
			    "forceConsistentCasingInFileNames": true,
			    "noFallthroughCasesInSwitch": true,
			    "noImplicitOverride": true,
			    "noImplicitReturns": true,
			    "noPropertyAccessFromIndexSignature": true,
			    "strict": true,
			  },
			  "extends": "../tsconfig.base.json",
			  "files": [],
			  "include": [],
			  "references": [
			    {
			      "path": "./tsconfig.app.json",
			    },
			    {
			      "path": "./tsconfig.spec.json",
			    },
			  ],
			}
		`);

		const tsconfigApp = readJson(tree, 'my-function-app/tsconfig.app.json');
		expect(tsconfigApp.compilerOptions.outDir).toEqual('../dist/out-tsc');
		expect(tsconfigApp.extends).toEqual('./tsconfig.json');
		expect(tsconfigApp.exclude).toEqual(['jest.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts']);
		const eslintrc = readJson(tree, 'my-function-app/.eslintrc.json');
		expect(eslintrc).toMatchInlineSnapshot(`
			        {
			          "extends": [
			            "../.eslintrc.json",
			          ],
			          "ignorePatterns": [
			            "!**/*",
			          ],
			          "overrides": [
			            {
			              "files": [
			                "*.ts",
			                "*.tsx",
			                "*.js",
			                "*.jsx",
			              ],
			              "rules": {},
			            },
			            {
			              "files": [
			                "*.ts",
			                "*.tsx",
			              ],
			              "rules": {},
			            },
			            {
			              "files": [
			                "*.js",
			                "*.jsx",
			              ],
			              "rules": {},
			            },
			          ],
			        }
		      `);
	});

	it('should extend from root tsconfig.json when no tsconfig.base.json', async () => {
		tree.rename('tsconfig.base.json', 'tsconfig.json');

		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
		});

		const tsconfig = readJson(tree, 'my-function-app/tsconfig.json');
		expect(tsconfig.extends).toBe('../tsconfig.json');
	});

	it('should generate strict by default', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
		});

		const tsconfig = readJson(tree, 'my-function-app/tsconfig.json');
		expect(tsconfig.compilerOptions).toStrictEqual({
			esModuleInterop: true,
			forceConsistentCasingInFileNames: true,
			strict: true,
			noImplicitOverride: true,
			noPropertyAccessFromIndexSignature: true,
			noImplicitReturns: true,
			noFallthroughCasesInSwitch: true,
		});
	});

	it('can generate non-strict', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
			strict: false,
		});

		const tsconfig = readJson(tree, 'my-function-app/tsconfig.json');
		expect(tsconfig.compilerOptions).toStrictEqual({
			esModuleInterop: true,
		});
	});

	it('can set custom azureAppName', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
			azureAppName: 'my-custom-app',
		});

		const project = readProjectConfiguration(tree, 'my-function-app');
		expect(project.targets?.['publish'].options.azureAppName).toStrictEqual('my-custom-app');
	});

	it('can set custom projectLanguage', async () => {
		await applicationGenerator(tree, {
			name: 'my-function-app',
			directory: 'my-function-app',
			projectNameAndRootFormat: 'as-provided',
			projectLanguage: 'typescript',
		});

		const project = readProjectConfiguration(tree, 'my-function-app');
		expect(project.targets?.['publish'].options.projectLanguage).toStrictEqual('typescript');
	});
});
