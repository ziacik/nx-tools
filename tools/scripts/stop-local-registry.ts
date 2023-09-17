/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

declare module globalThis {
	function stopLocalRegistry(): void;
}

export default () => {
	if (globalThis.stopLocalRegistry) {
		globalThis.stopLocalRegistry();
	}
};
