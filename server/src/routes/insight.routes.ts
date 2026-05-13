import { Router, Response } from 'express';
import { insightService } from '../services/insight.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /api/groups/:groupId/insights — 인사이트 생성/재생성
router.post('/groups/:groupId/insights', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await insightService.generate(req.params.groupId as string, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    console.error('[Insight generate error]', err?.message || err);
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/groups/:groupId/insights — 저장된 인사이트 조회
router.get('/groups/:groupId/insights', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await insightService.getByGroup(req.params.groupId as string, req.user!.userId);
    if (!result) {
      res.json(null);
      return;
    }
    res.json(result);
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/me/insights — 내 모든 인사이트
router.get('/me/insights', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const results = await insightService.getMyInsights(req.user!.userId);
    res.json(results);
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
