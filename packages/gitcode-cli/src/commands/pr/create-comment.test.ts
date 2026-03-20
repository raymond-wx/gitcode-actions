import { beforeEach, describe, expect, it, vi } from 'vitest';

const { withClientMock, resolveGitCodeRepoUrlMock } = vi.hoisted(() => ({
  withClientMock: vi.fn(),
  resolveGitCodeRepoUrlMock: vi.fn(),
}));

vi.mock('../../utils/with-client.js', () => ({
  withClient: withClientMock,
}));

vi.mock('../../utils/resolve-repo-url.js', () => ({
  resolveGitCodeRepoUrl: resolveGitCodeRepoUrlMock,
}));

import { createPrCommentAction, createPrCommentCommand } from './create-comment.js';

describe('createPrCommentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveGitCodeRepoUrlMock.mockResolvedValue('https://gitcode.com/owner/repo.git');
  });

  it('passes path and position to client.pr.createComment', async () => {
    const createCommentMock = vi.fn().mockResolvedValue({ id: 1, body: 'LGTM' });
    withClientMock.mockImplementation(async (fn: (client: unknown) => Promise<void>) => {
      await fn({
        pr: {
          createComment: createCommentMock,
        },
      });
    });
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await createPrCommentAction('123', 'LGTM', {
      repo: 'owner/repo',
      path: 'src/file.ts',
      position: 42,
    });

    expect(createCommentMock).toHaveBeenCalledWith(
      'https://gitcode.com/owner/repo.git',
      123,
      'LGTM',
      {
        path: 'src/file.ts',
        position: 42,
      },
    );

    consoleLogSpy.mockRestore();
  });
});

describe('createPrCommentCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function parseCommand(args: string[]) {
    const command = createPrCommentCommand();
    command.exitOverride();
    return command.parseAsync(args, { from: 'user' });
  }

  it('rejects --path without --position', async () => {
    await expect(
      parseCommand(['comment', '123', '--body', 'LGTM', '--path', 'src/file.ts']),
    ).rejects.toThrow('--path and --position must be supplied together');
  });

  it('rejects whitespace-only --path without --position', async () => {
    await expect(
      parseCommand(['comment', '123', '--body', 'LGTM', '--path', '   ']),
    ).rejects.toThrow('--path and --position must be supplied together');
  });

  it('rejects --position without --path', async () => {
    await expect(
      parseCommand(['comment', '123', '--body', 'LGTM', '--position', '1']),
    ).rejects.toThrow('--path and --position must be supplied together');
  });

  it('rejects non-positive position values', async () => {
    await expect(
      parseCommand([
        'comment',
        '123',
        '--body',
        'LGTM',
        '--path',
        'src/file.ts',
        '--position',
        '0',
      ]),
    ).rejects.toThrow('Position must be a positive integer');
  });

  it.each(['abc', '1.5'])('rejects non-integer position value %s', async (position) => {
    await expect(
      parseCommand([
        'comment',
        '123',
        '--body',
        'LGTM',
        '--path',
        'src/file.ts',
        '--position',
        position,
      ]),
    ).rejects.toThrow('Position must be a positive integer');
  });
});
