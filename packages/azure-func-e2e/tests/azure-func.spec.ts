import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { getPackageManagerCommand } from '@nx/devkit';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

const TMP_DIRECTORY = join(process.cwd(), 'tmp');
const PACKAGE_MANAGER_COMMAND = getPackageManagerCommand();

describe('azure-func', () => {
	let projectDirectory: string;

	beforeAll(() => {
		projectDirectory = createTestProject();

		execSync(`${PACKAGE_MANAGER_COMMAND.addDev} @ziacik/azure-func@e2e`, {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: getCommandEnvironment(),
		});
	});

	afterAll(() => {
		removeDirectory(projectDirectory);
	});

	it('should be installed', () => {
		execSync(`${PACKAGE_MANAGER_COMMAND.list} @ziacik/azure-func`, {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: getCommandEnvironment(),
		});
	});

	it('should generate app', () => {
		execSync(
			`${PACKAGE_MANAGER_COMMAND.exec} nx generate @ziacik/azure-func:application --directory=my-func-app --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --framework=none`,
			{
				cwd: projectDirectory,
				stdio: 'inherit',
				env: getCommandEnvironment(),
			}
		);
	});
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
	const projectName = `azure-func-e2e-${randomUUID().slice(0, 8)}`;
	const projectDirectory = join(TMP_DIRECTORY, projectName);

	// Ensure projectDirectory is empty
	removeDirectory(projectDirectory);
	mkdirSync(dirname(projectDirectory), { recursive: true });

	execSync(`${PACKAGE_MANAGER_COMMAND.dlx} create-nx-workspace@latest ${projectName} --preset apps --nxCloud skip --no-interactive`, {
		cwd: dirname(projectDirectory),
		stdio: 'inherit',
		env: getCommandEnvironment(),
	});
	console.log(`Created test project in "${projectDirectory}"`);

	return projectDirectory;
}

function getCommandEnvironment(extraEnvironment: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
	return {
		...process.env,
		CI: 'true',
		// The daemon can outlive CLI commands and interfere with workspace cleanup.
		NX_DAEMON: 'false',
		...extraEnvironment,
	};
}

function removeDirectory(directory: string) {
	rmSync(directory, {
		recursive: true,
		force: true,
		maxRetries: 10,
		retryDelay: 200,
	});
}
