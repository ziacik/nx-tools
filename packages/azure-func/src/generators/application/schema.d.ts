export interface ApplicationGeneratorSchema {
	name: string;
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
