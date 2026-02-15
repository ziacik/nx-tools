export default {
	displayName: 'test-app',
	preset: '../../jest.preset.js',
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	transform: {
		// @swc/core 1.5.x does not support es2023; pin a supported target for Jest transforms.
		'^.+\\.[tj]s$': ['@swc/jest', { jsc: { target: 'es2022' } }],
	},
	moduleFileExtensions: ['ts', 'js', 'html'],
	coverageDirectory: '../../coverage/packages/test-app',
};
