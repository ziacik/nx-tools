/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */

/// <reference path="registry.d.ts" />

import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { releasePublish, releaseVersion } from 'nx/release';
import { join } from 'path';

type FileSnapshot = {
	path: string;
	content?: string;
};

const startLocalRegistryForTests = async () => {
	// local registry target to run
	const localRegistryTarget = '@ziacik/source:local-registry';
	// storage folder for the local registry
	const storage = './tmp/local-registry/storage';

	global.stopLocalRegistry = await startLocalRegistry({
		localRegistryTarget,
		storage,
		verbose: false,
		clearStorage: true,
	});

	const releaseFileSnapshots = createReleaseFileSnapshots();
	const releaseVersionOptions = {
		specifier: '0.0.0-e2e',
		stageChanges: false,
		gitCommit: false,
		gitTag: false,
		firstRelease: true,
		versionActionsOptionsOverrides: {
			skipLockFileUpdate: true,
		},
	} as Parameters<typeof releaseVersion>[0];

	try {
		await releaseVersion(releaseVersionOptions);
		await releasePublish({
			tag: 'e2e',
			firstRelease: true,
		});
	} finally {
		restoreReleaseFileSnapshots(releaseFileSnapshots);
	}
};

function createReleaseFileSnapshots(): FileSnapshot[] {
	const packagesDirectory = join(process.cwd(), 'packages');

	return readdirSync(packagesDirectory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.flatMap((entry) => {
			const packageDirectory = join(packagesDirectory, entry.name);
			return [createFileSnapshot(join(packageDirectory, 'package.json')), createFileSnapshot(join(packageDirectory, 'CHANGELOG.md'))];
		});
}

function createFileSnapshot(path: string): FileSnapshot {
	if (!existsSync(path)) {
		return { path };
	}

	return {
		path,
		content: readFileSync(path, 'utf8'),
	};
}

function restoreReleaseFileSnapshots(snapshots: FileSnapshot[]) {
	for (const snapshot of snapshots) {
		if (snapshot.content === undefined) {
			rmSync(snapshot.path, { force: true });
			continue;
		}

		writeFileSync(snapshot.path, snapshot.content);
	}
}

export = startLocalRegistryForTests;
