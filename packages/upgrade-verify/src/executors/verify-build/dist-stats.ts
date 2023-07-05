import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

export type Stat = {
	readonly name: string;
	readonly size: number;
	readonly items: Stat[];
};

export async function loadExistingDistStats(statsPath: string): Promise<Stat | undefined> {
	try {
		const statsStr = await readFile(statsPath, 'utf-8');
		return JSON.parse(statsStr);
	} catch {
		return undefined;
	}
}

export async function calculateDistStats(distDir: string): Promise<Stat> {
	return getFolderStats(distDir, '');
}

async function getFolderStats(root: string, relative: string): Promise<Stat> {
	return calculateStats(root, relative);
}

async function calculateStats(root: string, relative: string): Promise<Stat> {
	const path = join(root, relative);
	const stats = await stat(path);

	if (stats.isFile()) {
		return {
			name: relative,
			size: stats.size,
			items: [],
		};
	} else if (stats.isDirectory()) {
		const nestedFiles = await readdir(path);
		const nestedStats = await Promise.all(nestedFiles.map((nestedFile) => calculateStats(join(root, relative), nestedFile)));
		return {
			name: relative,
			size: nestedStats.reduce((result, stat) => result + stat.size, 0),
			items: nestedStats,
		};
	} else {
		throw new Error('What: ' + path);
	}
}
