import { SpawnSyncOptions, spawnSync } from 'child_process';

export function spawnSyncChecked(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions): { success: boolean } {
	try {
		const { status } = spawnSync(command, args, options);

		return {
			success: status === 0,
		};
	} catch (e) {
		console.error(e);
		return { success: false };
	}
}
