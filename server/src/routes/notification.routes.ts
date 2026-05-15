import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';
import { AppError } from '../services/auth.service';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
    const result = await notificationService.list(req.user!.userId, Number.isFinite(limit) ? limit : undefined);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

router.patch('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markRead(req.user!.userId, req.params.id as string);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
