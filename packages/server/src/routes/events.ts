import type { RepoEventsQuery } from '@xbghc/gitcode-api';
import { Router } from 'express';
import { withAuth } from '../middleware/auth.js';
import { createGitCodeClient } from '../utils/gitcode-client.js';
import { logger } from '../utils/logger.js';
import { getSingleValue } from '../utils/request-param.js';
import { ExternalServiceError } from '../errors/index.js';

export const eventsRouter: Router = Router();

/**
 * 获取仓库事件列表
 * GET /api/repo/:owner/:repo/events
 */
eventsRouter.get(
  '/repo/:owner/:repo/events',
  withAuth(async (req, res, token) => {
    const owner = getSingleValue(req.params.owner);
    const repo = getSingleValue(req.params.repo);
    const filter = getSingleValue(req.query.filter);
    const author = getSingleValue(req.query.author);
    const before = getSingleValue(req.query.before);
    const after = getSingleValue(req.query.after);
    const page = getSingleValue(req.query.page);
    const perPage = getSingleValue(req.query.per_page);

    if (!owner || !repo) {
      throw new ExternalServiceError('GitCode', 'Invalid repository route params');
    }

    const client = createGitCodeClient(token);

    const query: RepoEventsQuery = {};
    if (filter) query.filter = filter as RepoEventsQuery['filter'];
    if (author) query.author = author;
    if (before) query.before = before;
    if (after) query.after = after;
    if (page) query.page = Number(page);
    if (perPage) query.per_page = Number(perPage);

    try {
      const events = await client.repo.getEvents(owner, repo, query);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      logger.error({ owner, repo, query, error }, 'Failed to fetch repo events');
      throw new ExternalServiceError('GitCode', 'Failed to fetch repo events', error as Error);
    }
  }),
);
