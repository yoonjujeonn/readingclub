import { Router, Response } from 'express';
import { reportService } from '../services/report.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// POST /api/reports
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '신고 대상과 사유를 입력해주세요.' } });
      return;
    }
    const result = await reportService.create(req.user!.userId, targetType, targetId, reason);
    res.status(201).json(result);
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
