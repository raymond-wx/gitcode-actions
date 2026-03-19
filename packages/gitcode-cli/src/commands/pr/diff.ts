import { resolveGitCodeRepoUrl } from '../../utils/resolve-repo-url.js';
import { withClient } from '../../utils/with-client.js';

interface DiffOptions {
  patch?: boolean;
}

export async function prDiffCommand(
  prNumber: string,
  url?: string,
  options: DiffOptions = {},
): Promise<void> {
  const n = Number(prNumber);
  if (!Number.isInteger(n) || n <= 0) {
    console.error('Invalid PR number');
    process.exit(1);
    return;
  }

  await withClient(
    async (client) => {
      const repoUrl = await resolveGitCodeRepoUrl(url);
      const diff = await client.pr.diff(repoUrl, n, {
        format: options.patch ? 'patch' : 'diff',
      });
      process.stdout.write(diff);
    },
    options.patch ? 'Failed to get PR patch' : 'Failed to get PR diff',
  );
}
