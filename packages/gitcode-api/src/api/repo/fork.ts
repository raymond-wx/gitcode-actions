import { z } from 'zod';

const FORK_API_BASE = 'https://api.gitcode.com/api/v5';

export const forkRepoBodySchema = z.object({
  organization: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
});

export type ForkRepoBody = z.infer<typeof forkRepoBodySchema>;

export function forkRepoUrl(owner: string, repo: string): string {
  return `${FORK_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/forks`;
}
