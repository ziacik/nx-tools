import {
	applyChangesToString,
	ChangeType,
	formatFiles,
	generateFiles,
	getProjects,
	joinPathFragments,
	logger,
	names,
	readProjectConfiguration,
	StringChange,
	Tree,
} from '@nx/devkit';
import { findNodes } from '@nx/js';
import { createSourceFile, ScriptTarget, SourceFile, SyntaxKind } from 'typescript';
import { FunctionGeneratorSchema } from './schema';

export async function functionGenerator(tree: Tree, options: FunctionGeneratorSchema) {
	const project = readProjectConfiguration(tree, options.project);

	if (!project) {
		return;
	}

	const nameVariants = names(options.name);

	generateFiles(tree, joinPathFragments(__dirname, 'files'), project.root, nameVariants);
	registerTheFuncInMain(tree, options, nameVariants);

	await formatFiles(tree);
}

export default functionGenerator;

function registerTheFuncInMain(
	tree: Tree,
	options: FunctionGeneratorSchema,
	nameVariants: { name: string; className: string; propertyName: string; constantName: string; fileName: string }
) {
	const workspace = getProjects(tree);
	const project = workspace.get(options.project);

	if (project == null) {
		return;
	}

	const mainFilePath = joinPathFragments(project.sourceRoot ?? '', 'main.ts');

	if (!tree.exists(mainFilePath)) {
		logger.warn(
			`The apps's main file could not be found. The register function will not be called, please call the register function in your app entry point.`
		);
		return;
	}

	const mainSource = tree.read(mainFilePath, 'utf-8');

	if (mainSource !== null) {
		const mainSourceFile = createSourceFile(mainFilePath, mainSource, ScriptTarget.Latest, true);
		const importAddition = addImport(
			mainSourceFile,
			`import { register${nameVariants.className}Function } from './${nameVariants.fileName}/${nameVariants.fileName}.function';`
		);
		const registerAddition = addLine(mainSourceFile, `register${nameVariants.className}Function();`);
		const newSource = applyChangesToString(mainSource, [importAddition, registerAddition]);
		tree.write(mainFilePath, newSource);
	}
}

function addImport(source: SourceFile, statement: string): StringChange {
	const allImports = findNodes(source, SyntaxKind.ImportDeclaration);
	const lastImport = allImports != null ? allImports[allImports.length - 1] : null;
	const index = lastImport != null ? lastImport.end + 1 : 0;
	return {
		type: ChangeType.Insert,
		index,
		text: `\n${statement}\n`,
	};
}

function addLine(source: SourceFile, statement: string): StringChange {
	return {
		type: ChangeType.Insert,
		index: source.end,
		text: `\n${statement}\n`,
	};
}
