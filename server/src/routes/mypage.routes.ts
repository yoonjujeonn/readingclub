import { Router, Response } from 'express';
import { mypageService } from '../services/mypage.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/me/profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await mypageService.getProfile(req.user!.userId);
    res.json(profile);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/me/groups
router.get('/groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await mypageService.getMyGroups(req.user!.userId);
    res.json(groups);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/me/memos
router.get('/memos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memos = await mypageService.getMyMemos(req.user!.userId);
    res.json(memos);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/me/discussions
router.get('/discussions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const discussions = await mypageService.getMyDiscussions(req.user!.userId);
    res.json(discussions);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

// GET /api/me/recommended-groups
router.get('/recommended-groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await mypageService.getRecommendedGroups(req.user!.userId);
    res.json(groups);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
      return;
    }
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' },
    });
  }
});

export default router;
