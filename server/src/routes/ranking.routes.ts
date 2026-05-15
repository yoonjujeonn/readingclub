import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ranking?limit=10
router.get('/ranking', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { activityScore: 'desc' },
      take: limit,
      select: {
        id: true,
        nickname: true,
        activityScore: true,
        profileImageUrl: true,
      },
    });

    const ranking = users.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      nickname: u.nickname,
      score: u.activityScore,
      profileImageUrl: u.profileImageUrl,
    }));

    res.json(ranking);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/ranking/top3
router.get('/ranking/top3', async (_req, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { activityScore: 'desc' },
      take: 3,
      select: {
        id: true,
        nickname: true,
        activityScore: true,
      },
    });

    const ranking = users.map((u, i) => ({
      rank: i + 1,
      nickname: u.nickname,
      score: u.activityScore,
    }));

    res.json(ranking);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
