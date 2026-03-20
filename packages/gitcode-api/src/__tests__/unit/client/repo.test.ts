import { describe, expect, it } from 'vitest';
import { GitCodeClient } from '../../../client/core.js';
import { createMockGot } from '../../mocks/http.mock.js';

describe('GitCodeClientRepo.fork', () => {
  it('should fork a repository using the API endpoint with access token query', async () => {
    const responses = new Map([
      [
        'POST:https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=test-token',
        {
          data: {
            full_name: 'forker/repo-fork',
            path: 'repo-fork',
            name: 'repo-fork',
            html_url: 'https://gitcode.com/forker/repo-fork',
          },
        },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    const forked = await client.repo.fork('https://gitcode.com/owner/repo.git', {
      name: 'repo-fork',
    });

    expect(forked.full_name).toBe('forker/repo-fork');
    expect(requests).toEqual([
      {
        method: 'POST',
        url: 'https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=test-token',
        options: {
          json: {
            name: 'repo-fork',
          },
        },
      },
    ]);
  });

  it('should support organization, name and path override fields', async () => {
    const responses = new Map([
      [
        'POST:https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=test-token',
        {
          data: {
            full_name: 'team/repo-copy',
            path: 'repo-copy-path',
            name: 'repo-copy',
            html_url: 'https://gitcode.com/team/repo-copy',
          },
        },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    await client.repo.fork('https://gitcode.com/owner/repo.git', {
      organization: 'team',
      name: 'repo-copy',
      path: 'repo-copy-path',
    });

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=test-token',
      options: {
        json: {
          organization: 'team',
          name: 'repo-copy',
          path: 'repo-copy-path',
        },
      },
    });
  });

  it('should use oauth access token when available', async () => {
    const responses = new Map([
      [
        'POST:https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=oauth-access-token',
        {
          data: {
            full_name: 'forker/repo',
            path: 'repo',
            name: 'repo',
            html_url: 'https://gitcode.com/forker/repo',
          },
        },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('pat-token', mockGot);

    client.auth.configureOAuth({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
    });

    client.auth.setOAuthToken({
      access_token: 'oauth-access-token',
      refresh_token: 'oauth-refresh-token',
      expires_in: 3600,
      scope: 'repo',
      token_type: 'bearer',
    });

    await client.repo.fork('https://gitcode.com/owner/repo.git');

    expect(requests[0]?.url).toBe(
      'https://api.gitcode.com/api/v5/repos/owner/repo/forks?access_token=oauth-access-token',
    );
  });

  it('should reject invalid repository URLs', async () => {
    const { mockGot } = createMockGot();
    const client = new GitCodeClient('test-token', mockGot);

    await expect(client.repo.fork('not-a-url')).rejects.toThrow('Invalid Git URL: not-a-url');
  });

  it('should reject non-GitCode repository URLs', async () => {
    const { mockGot } = createMockGot();
    const client = new GitCodeClient('test-token', mockGot);

    await expect(client.repo.fork('https://github.com/org/repo.git')).rejects.toThrow(
      'Invalid GitCode repository URL: https://github.com/org/repo.git',
    );
  });
});
