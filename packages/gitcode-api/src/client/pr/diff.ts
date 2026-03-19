import { getPullRequestDiffUrl, type PullRequestDiffOptions } from '../../api/pr/index.js';
import { parseGitUrl } from '../../utils/index.js';
import type { GitCodeClient } from '../core.js';

export async function getPullRequestDiff(
  client: GitCodeClient,
  url: string,
  prNumber: number,
  options: PullRequestDiffOptions = {},
): Promise<string> {
  const parsed = parseGitUrl(url);
  if (!parsed?.owner || !parsed?.repo || !parsed.host) {
    throw new Error(`Invalid Git URL: ${url}`);
  }

  const token = await client.auth.getValidToken();
  const diffUrl = new URL(
    getPullRequestDiffUrl(parsed.host, parsed.owner, parsed.repo, prNumber, options),
  );
  diffUrl.searchParams.set('access_token', token);

  return await client.http
    .get(diffUrl.toString(), {
      headers: {
        accept: 'text/plain, application/octet-stream;q=0.9, */*;q=0.8',
        authorization: `Bearer ${token}`,
      },
    })
    .text();
}
