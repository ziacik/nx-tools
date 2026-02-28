import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

const LOCAL_REGISTRY = 'http://localhost:4873';
const TMP_DIRECTORY = join(process.cwd(), 'tmp');

describe('azure-func', () => {
	let projectDirectory: string;

	beforeAll(() => {
		projectDirectory = createTestProject();

		execSync(`npm install @ziacik/azure-func@e2e`, {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: getCommandEnvironment({
				NPM_CONFIG_REGISTRY: LOCAL_REGISTRY,
				npm_config_registry: LOCAL_REGISTRY,
			}),
		});
	});

	afterAll(() => {
		removeDirectory(projectDirectory);
	});

	it('should be installed', () => {
		execSync('npm ls @ziacik/azure-func', {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: getCommandEnvironment(),
		});
	});

	it('should generate app', () => {
		execSync('nx generate @ziacik/azure-func:application --directory=my-func-app --linter=eslint --unitTestRunner=jest --e2eTestRunner=none --framework=none', {
			cwd: projectDirectory,
			stdio: 'inherit',
			env: getCommandEnvironment(),
		});
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

	execSync(`npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud skip --no-interactive`, {
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
