import { parseGitUrl, type ForkRepoBody } from '@xbghc/gitcode-api';
import { resolveGitCodeRepoUrl } from '../../utils/resolve-repo-url.js';
import { withClient } from '../../utils/with-client.js';

interface ForkOptions extends ForkRepoBody {
  json?: boolean;
}

export async function forkCommand(url?: string, options: ForkOptions = {}): Promise<void> {
  await withClient(async (client) => {
    const repoUrl = await resolveGitCodeRepoUrl(url);
    const parsed = parseGitUrl(repoUrl);

    if (!parsed) {
      console.error('无法解析仓库 URL:', repoUrl);
      process.exit(1);
    }

    const body: ForkRepoBody = {};
    if (options.organization) body.organization = options.organization;
    if (options.name) body.name = options.name;
    if (options.path) body.path = options.path;

    const forked = await client.repo.fork(repoUrl, body);

    if (options.json) {
      console.log(JSON.stringify(forked, null, 2));
      return;
    }

    console.log(`Forked ${parsed.owner}/${parsed.repo} -> ${forked.full_name}`);
    console.log(forked.html_url);
  }, 'Failed to fork repository');
}
