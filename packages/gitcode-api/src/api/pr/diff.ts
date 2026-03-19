export type PullRequestDiffFormat = 'diff' | 'patch';

export interface PullRequestDiffOptions {
  format?: PullRequestDiffFormat;
}

export function getPullRequestDiffUrl(
  host: string,
  owner: string,
  repo: string,
  prNumber: number,
  options: PullRequestDiffOptions = {},
): string {
  const format = options.format ?? 'diff';
  const normalizedHost = host.replace(/^https?:\/\//, '');
  return `https://${normalizedHost}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pull/${prNumber}.${format}`;
}
