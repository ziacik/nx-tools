import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import applicationGenerator from '../application/generator';
import { functionGenerator } from './generator';
import { FunctionGeneratorSchema } from './schema';

describe('function generator', () => {
	let tree: Tree;
	const options: FunctionGeneratorSchema = { name: 'some-func', project: 'my-func-app' };

	beforeEach(async () => {
		tree = createTreeWithEmptyWorkspace();
		await applicationGenerator(tree, { name: 'my-func-app' });
	});

	it('should generate a function file', async () => {
		await functionGenerator(tree, options);
		expect(tree.exists('my-func-app/src/some-func/some-func.function.ts')).toBeTruthy();
	});

	it('should generate a spec file', async () => {
		await functionGenerator(tree, options);
		expect(tree.exists('my-func-app/src/some-func/some-func.function.spec.ts')).toBeTruthy();
	});

	it('should register the function in app entry point', async () => {
		await functionGenerator(tree, options);
		const main = tree.read('my-func-app/src/main.ts', 'utf8');
		expect(main).toContain(`import { registerSomeFuncFunction } from './some-func/some-func.function';`);
		expect(main).toContain(`registerSomeFuncFunction();`);
	});
});
