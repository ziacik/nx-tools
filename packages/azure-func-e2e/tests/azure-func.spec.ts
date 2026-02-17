import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

const LOCAL_REGISTRY = 'http://localhost:4873';

describe('azure-func', () => {
	let projectDirectory: string;

	beforeAll(() => {
		projectDirectory = createTestProject();

		execSync(`npm install @ziacik/azure-func@e2e`, {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: {
				...process.env,
				NPM_CONFIG_REGISTRY: LOCAL_REGISTRY,
				npm_config_registry: LOCAL_REGISTRY,
			},
		});
	});

	afterAll(() => {
		rmSync(projectDirectory, {
			recursive: true,
			force: true,
		});
	});

	it('should be installed', () => {
		execSync('npm ls @ziacik/azure-func', {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: process.env,
		});
	});

	it('should generate app', () => {
		execSync('nx generate @ziacik/azure-func:application --directory=my-func-app --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --framework=none', {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: process.env,
		});
	});
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
	const projectName = 'test-project';
	const projectDirectory = join(process.cwd(), 'tmp', projectName);

	// Ensure projectDirectory is empty
	rmSync(projectDirectory, {
		recursive: true,
		force: true,
	});
	mkdirSync(dirname(projectDirectory), {
		recursive: true,
	});

	execSync(`npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud skip --no-interactive`, {
		cwd: dirname(projectDirectory),
		stdio: 'inherit',
		env: process.env,
	});
	console.log(`Created test project in "${projectDirectory}"`);

	return projectDirectory;
}
