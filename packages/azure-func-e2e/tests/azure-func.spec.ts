import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

describe('azure-func', () => {
	let projectDirectory: string;

	beforeAll(() => {
		projectDirectory = createTestProject();

		// The plugin has been built and published to a local registry in the jest globalSetup
		// Install the plugin built with the latest source code into the test repo
		execSync(`npm install @ziacik/azure-func@e2e`, {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: process.env,
		});
	});

	afterAll(() => {
		// Cleanup the test project
		rmSync(projectDirectory, {
			recursive: true,
			force: true,
		});
	});

	it('should be installed', () => {
		// npm ls will fail if the package is not installed properly
		execSync('npm ls @ziacik/azure-func', {
			cwd: projectDirectory,
			stdio: 'inherit',
		});
	});

	it('should generate app', () => {
		// npm ls will fail if the package is not installed properly
		execSync('nx generate @ziacik/azure-func:application --name=my-func-app', {
			cwd: projectDirectory,
			stdio: 'inherit',
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

	execSync(`npx --yes create-nx-workspace@latest ${projectName} --preset apps --no-nxCloud --no-interactive`, {
		cwd: dirname(projectDirectory),
		stdio: 'inherit',
		env: process.env,
	});
	console.log(`Created test project in "${projectDirectory}"`);

	return projectDirectory;
}
