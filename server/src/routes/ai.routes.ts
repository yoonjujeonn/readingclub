import { Router, Response } from 'express';
import { aiService } from '../services/ai.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /api/groups/:groupId/ai/topics
router.post('/groups/:groupId/ai/topics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await aiService.suggestTopics(req.params.groupId as string);
    res.json(result);
  } catch (err: any) {
    console.error('[AI topics error]', err?.response?.data || err?.message || err);
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    const msg = err?.response?.data?.error?.message || err?.message || '서버 오류가 발생했습니다';
    res.status(500).json({ error: { code: 'AI_ERROR', message: msg } });
  }
});

// POST /api/discussions/:id/ai/summary
router.post('/discussions/:id/ai/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await aiService.summarizeThread(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    console.error('[AI summary error]', err?.response?.data || err?.message || err);
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    const msg = err?.response?.data?.error?.message || err?.message || '서버 오류가 발생했습니다';
    res.status(500).json({ error: { code: 'AI_ERROR', message: msg } });
  }
});

// POST /api/groups/:groupId/ai/insight
router.post('/groups/:groupId/ai/insight', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await aiService.generateInsight(req.params.groupId as string, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    console.error('[AI insight error]', err?.response?.data || err?.message || err);
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    const msg = err?.response?.data?.error?.message || err?.message || '서버 오류가 발생했습니다';
    res.status(500).json({ error: { code: 'AI_ERROR', message: msg } });
  }
});

export default router;
