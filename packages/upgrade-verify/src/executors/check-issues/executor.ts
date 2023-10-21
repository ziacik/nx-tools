import { ExecutorContext, logger } from '@nx/devkit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CheckIssuesExecutorSchema } from './schema';

const GITHUB_ISSUE_REGEX = /https:\/\/github.com\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issueNumber>\d+)/;

export default async function runExecutor(options: CheckIssuesExecutorSchema, context: ExecutorContext) {
	const issuesMd = await tryLoadIssuesMd(context.root);

	if (issuesMd != null) {
		const issueMdLines = issuesMd.split('\n');
		await printClosedIssueLines(issueMdLines);
	} else {
		logger.info("There is no 'ISSUES.md' file in the workspace root.");
	}

	return {
		success: true,
	};
}

async function printClosedIssueLines(issueMdLines: string[]) {
	const resolvedLines = await Promise.all(issueMdLines.map(resolveIssueMdLine));
	const closedLines = resolvedLines.filter((resolvedLine) => resolvedLine.result === 'closed');

	if (closedLines.length > 0) {
		logger.info('Issues which are closed now:');

		for (const closedLine of closedLines) {
			logger.info(`- ${closedLine.issueMdLine}`);
		}
	} else {
		logger.info('No issues have been closed.');
	}
}

async function resolveIssueMdLine(issueMdLine: string): Promise<{ issueMdLine: string; result: 'noissue' | 'active' | 'closed' }> {
	const githubLink = issueMdLine.match(GITHUB_ISSUE_REGEX);

	if (!githubLink) {
		return { issueMdLine, result: 'noissue' };
	}

	const [, owner, repo, issueNumber] = githubLink;

	const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`);
	const { state } = await response.json();

	return {
		issueMdLine,
		result: state === 'closed' ? 'closed' : 'active',
	};
}

async function tryLoadIssuesMd(root: string): Promise<string | undefined> {
	try {
		return await readFile(join(root, 'ISSUES.md'), 'utf8');
	} catch (e) {
		if (isNodeError(e) && e.code === 'ENOENT') {
			return undefined;
		} else {
			throw e;
		}
	}
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}
