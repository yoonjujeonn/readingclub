import { Router, Response } from 'express';
import { tokenService } from '../services/token.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/discussions/:id/tokens - 내 발언권 조회
router.get('/discussions/:id/tokens', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = await tokenService.getOrCreate(req.params.id as string, req.user!.userId);
    res.json(token);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/discussions/:id/tokens/request - 발언권 추가 요청
router.post('/discussions/:id/tokens/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const token = await tokenService.requestTokens(req.params.id as string, req.user!.userId);
    res.json(token);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/discussions/:id/tokens/requests - 발언권 요청 목록 (모임장)
router.get('/discussions/:id/tokens/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await tokenService.listRequests(req.params.id as string, req.user!.userId);
    res.json(requests);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/discussions/:id/tokens/grant - 발언권 지급 (모임장)
router.post('/discussions/:id/tokens/grant', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount || amount < 1) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '대상 사용자와 지급 수량을 입력해주세요' } });
      return;
    }
    const token = await tokenService.grantTokens(req.params.id as string, userId, amount, req.user!.userId);
    res.json(token);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
