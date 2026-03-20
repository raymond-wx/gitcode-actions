import { describe, expect, it } from 'vitest';
import { GitCodeClient } from '../../../client/core.js';
import { createMockGot } from '../../mocks/http.mock.js';

describe('GitCodeClientPr.diff', () => {
  it('should fetch PR diff text from the repository host', async () => {
    const responses = new Map([
      [
        'GET:https://gitcode.com/owner/repo/pull/123.diff?access_token=test-token',
        { text: 'diff --git a/file.ts b/file.ts\n+console.log("hello");\n' },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    const diff = await client.pr.diff('https://gitcode.com/owner/repo.git', 123);

    expect(diff).toContain('diff --git');
    expect(diff).toContain('console.log("hello")');
    expect(requests).toEqual([
      {
        method: 'GET',
        url: 'https://gitcode.com/owner/repo/pull/123.diff?access_token=test-token',
        options: {
          headers: {
            accept: 'text/plain, application/octet-stream;q=0.9, */*;q=0.8',
            authorization: 'Bearer test-token',
          },
        },
      },
    ]);
  });

  it('should support patch format', async () => {
    const responses = new Map([
      [
        'GET:https://gitcode.com/owner/repo/pull/123.patch?access_token=test-token',
        { text: 'From abcdef Mon Sep 17 00:00:00 2001\nSubject: [PATCH] Test Pull Request\n' },
      ],
    ]);
    const { mockGot } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    const patch = await client.pr.diff('https://gitcode.com/owner/repo.git', 123, {
      format: 'patch',
    });

    expect(patch).toContain('Subject: [PATCH]');
  });

  it('should use oauth access token when available', async () => {
    const responses = new Map([
      [
        'GET:https://gitcode.com/owner/repo/pull/123.diff?access_token=oauth-access-token',
        { text: 'diff --git a/file.ts b/file.ts\n' },
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

    await client.pr.diff('https://gitcode.com/owner/repo.git', 123);

    expect(requests[0]?.options).toEqual({
      headers: {
        accept: 'text/plain, application/octet-stream;q=0.9, */*;q=0.8',
        authorization: 'Bearer oauth-access-token',
      },
    });
    expect(requests[0]?.url).toBe(
      'https://gitcode.com/owner/repo/pull/123.diff?access_token=oauth-access-token',
    );
  });

  it('should reject invalid repository URLs', async () => {
    const { mockGot } = createMockGot();
    const client = new GitCodeClient('test-token', mockGot);

    await expect(client.pr.diff('not-a-url', 123)).rejects.toThrow('Invalid Git URL: not-a-url');
  });
});

describe('GitCodeClientPr.createComment', () => {
  it('should send only the body when options are omitted', async () => {
    const responses = new Map([
      [
        'POST:https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
        { data: { id: 1, body: 'LGTM' } },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    await client.pr.createComment('https://gitcode.com/owner/repo.git', 123, 'LGTM');

    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
      options: {
        json: {
          body: 'LGTM',
        },
      },
    });
  });

  it('should include diff comment coordinates when provided', async () => {
    const responses = new Map([
      [
        'POST:https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
        { data: { id: 1, body: 'LGTM' } },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    await client.pr.createComment('https://gitcode.com/owner/repo.git', 123, 'LGTM', {
      path: 'src/file.ts',
      position: 42,
    });

    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
      options: {
        json: {
          body: 'LGTM',
          path: 'src/file.ts',
          position: 42,
        },
      },
    });
  });

  it('should preserve position zero in the request body', async () => {
    const responses = new Map([
      [
        'POST:https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
        { data: { id: 1, body: 'LGTM' } },
      ],
    ]);
    const { mockGot, requests } = createMockGot(responses);
    const client = new GitCodeClient('test-token', mockGot);

    await client.pr.createComment('https://gitcode.com/owner/repo.git', 123, 'LGTM', {
      position: 0,
    });

    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://gitcode.com/api/v5/repos/owner/repo/pulls/123/comments',
      options: {
        json: {
          body: 'LGTM',
          position: 0,
        },
      },
    });
  });
});
