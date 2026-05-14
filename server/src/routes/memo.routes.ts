import { Router, Response } from 'express';
import multer from 'multer';
import { memoService } from '../services/memo.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { CreateMemoSchema, UpdateMemoSchema } from '../validators';
import { isAllowedImageType, saveMemoImage } from '../services/file-storage.service';

const router = Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedImageType(file.mimetype)) {
      cb(new AppError(400, 'VALIDATION_ERROR', 'JPG, PNG, GIF, WEBP 형식의 이미지만 사용할 수 있습니다'));
      return;
    }
    cb(null, true);
  },
});

// GET /api/groups/:groupId/memos
router.get('/groups/:groupId/memos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memos = await memoService.listByGroup(req.params.groupId as string, req.user!.userId);
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

// POST /api/groups/:groupId/memos
router.post('/groups/:groupId/memos', authMiddleware, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const body = {
      ...req.body,
      pageStart: typeof req.body.pageStart === 'string' ? Number(req.body.pageStart) : req.body.pageStart,
      pageEnd: typeof req.body.pageEnd === 'string' ? Number(req.body.pageEnd) : req.body.pageEnd,
      isPublic: typeof req.body.isPublic === 'string' ? req.body.isPublic === 'true' : req.body.isPublic,
    };
    const parsed = CreateMemoSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
      return;
    }

    const imageUrl = req.file ? await saveMemoImage(req.file) : undefined;
    const memo = await memoService.create(req.params.groupId as string, req.user!.userId, parsed.data, imageUrl);
    res.status(201).json(memo);
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

// PUT /api/memos/:id
router.put('/memos/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = UpdateMemoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
      });
      return;
    }

    const memo = await memoService.update(req.params.id as string, req.user!.userId, parsed.data);
    res.json(memo);
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

// DELETE /api/memos/:id
router.delete('/memos/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await memoService.delete(req.params.id as string, req.user!.userId);
    res.json({ message: '메모가 삭제되었습니다' });
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

// PATCH /api/memos/:id/visibility
router.patch('/memos/:id/visibility', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { visibility, isPublic } = req.body;

    // 새 visibility 필드 우선, 하위 호환을 위해 isPublic도 지원
    let vis: string;
    if (typeof visibility === 'string' && ['private', 'public', 'spoiler'].includes(visibility)) {
      vis = visibility;
    } else if (typeof isPublic === 'boolean') {
      vis = isPublic ? 'public' : 'private';
    } else {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'visibility는 private, public, spoiler 중 하나여야 합니다',
        },
      });
      return;
    }

    const memo = await memoService.updateVisibility(req.params.id as string, req.user!.userId, vis);
    res.json(memo);
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
