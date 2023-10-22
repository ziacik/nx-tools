const HASH_REGEX = /\.[a-f0-9]{16}\./g;

export function withHashRemoved(fileName: string): string {
	return fileName.replace(HASH_REGEX, '.');
}
