import { logger } from '@nx/devkit';
import { SpawnSyncOptions } from 'child_process';
import { sync } from 'cross-spawn';

export function spawnSyncChecked(command: string, args?: ReadonlyArray<string>, options?: SpawnSyncOptions, enoentMessage?: string): { success: boolean } {
	try {
		const { status, error } = sync(command, args, options);

		if (error) {
			logError(enoentMessage, error);
		}

		return {
			success: status === 0,
		};
	} catch (e) {
		logError(enoentMessage, e);
		return { success: false };
	}
}

function logError(enoentMessage: string | undefined, e: unknown) {
	if (enoentMessage && isEnoent(e)) {
		logger.error(enoentMessage);
	} else {
		logger.error(e);
	}
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'errno' in error && 'code' in error;
}

function isEnoent(error: unknown): boolean {
	return isErrnoException(error) && error.code === 'ENOENT';
}
