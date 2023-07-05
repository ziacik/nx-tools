import { Stat } from './dist-stats';

export type ComparisonResult = {
	readonly totalSizeDifferencePercentage: number;
	readonly fileCountDifferencePercentage: number;
	readonly newFilesPercentage: number;
	readonly deletedFilesPercentage: number;
};

export function compareStats(existingStats: Stat, newStats: Stat): ComparisonResult {
	const totalSizeDifferencePercentage = countDiffPercentage(existingStats.size, newStats.size);
	const fileCountDifferencePercentage = countDiffPercentage(countFiles(existingStats), countFiles(newStats));
	const newFilesPercentage = countPercentage(countNewFiles(existingStats, newStats), countFiles(newStats));
	const deletedFilesPercentage = countPercentage(countDeletedFiles(existingStats, newStats), countFiles(existingStats));
	return {
		totalSizeDifferencePercentage,
		fileCountDifferencePercentage,
		newFilesPercentage,
		deletedFilesPercentage,
	};
}

function countDiffPercentage(existingNumber: number, newNumber: number): number {
	return countPercentage(newNumber - existingNumber, existingNumber);
}

function countPercentage(partNumber: number, totalNumber: number): number {
	return Math.round((partNumber * 100) / totalNumber);
}

function countFiles(stats: Stat): number {
	return stats.items.length + stats.items.reduce((result, item) => result + countFiles(item), 0);
}

function countNewFiles(existingStats: Stat, newStats: Stat): number {
	const existingNames = flatFileNamesSet(existingStats);
	const newNames = flatFileNamesList(newStats);
	return newNames.filter((name) => !existingNames.has(name)).length;
}

function countDeletedFiles(existingStats: Stat, newStats: Stat): number {
	const existingNames = flatFileNamesList(existingStats);
	const newNames = flatFileNamesSet(newStats);
	return existingNames.filter((name) => !newNames.has(name)).length;
}

function flatFileNamesSet(stats: Stat): Set<string> {
	return new Set(flatFileNamesList(stats));
}

function flatFileNamesList(stats: Stat, prefix = ''): string[] {
	return stats.items.map((item) => `${prefix}/${item.name}`).concat(stats.items.flatMap((item) => flatFileNamesList(item, item.name)));
}
