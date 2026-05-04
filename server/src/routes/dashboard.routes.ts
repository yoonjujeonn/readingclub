import { Router, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AppError } from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ===== 초대 링크 =====

// POST /api/groups/:id/invite - 초대 코드 생성/재생성
router.post('/:id/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const code = await dashboardService.generateInviteCode(req.params.id as string, req.user!.userId);
    res.json({ inviteCode: code });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// GET /api/groups/:id/invite - 현재 초대 코드 조회
router.get('/:id/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const code = await dashboardService.getInviteCode(req.params.id as string, req.user!.userId);
    res.json({ inviteCode: code });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/invite/:code/join - 초대 코드로 참여
router.post('/invite/:code/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await dashboardService.joinByInviteCode(req.params.code as string, req.user!.userId);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// ===== 멤버 삭제 =====

// DELETE /api/groups/:id/members/:userId
router.delete('/:id/members/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await dashboardService.removeMember(req.params.id as string, req.user!.userId, req.params.userId as string);
    res.json({ message: '멤버가 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// ===== 토론 일정 =====

// GET /api/groups/:id/schedules
router.get('/:id/schedules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schedules = await dashboardService.listSchedules(req.params.id as string);
    res.json(schedules);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/groups/:id/schedules
router.post('/:id/schedules', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    if (!title || !startDate || !endDate) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '제목, 시작일, 종료일을 입력해주세요' } });
      return;
    }
    const schedule = await dashboardService.createSchedule(req.params.id as string, req.user!.userId, { title, description, startDate, endDate });
    res.status(201).json(schedule);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// PUT /api/groups/:id/schedules/:scheduleId
router.put('/:id/schedules/:scheduleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    const schedule = await dashboardService.updateSchedule(req.params.scheduleId as string, req.user!.userId, { title, description, startDate, endDate });
    res.json(schedule);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// DELETE /api/groups/:id/schedules/:scheduleId
router.delete('/:id/schedules/:scheduleId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await dashboardService.deleteSchedule(req.params.scheduleId as string, req.user!.userId);
    res.json({ message: '일정이 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// ===== 공지사항 =====

// GET /api/groups/:id/announcements
router.get('/:id/announcements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const announcements = await dashboardService.listAnnouncements(req.params.id as string);
    res.json(announcements);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// POST /api/groups/:id/announcements
router.post('/:id/announcements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '제목과 내용을 입력해주세요' } });
      return;
    }
    const ann = await dashboardService.createAnnouncement(req.params.id as string, req.user!.userId, { title, content });
    res.status(201).json(ann);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// PUT /api/groups/:id/announcements/:annId
router.put('/:id/announcements/:annId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, content } = req.body;
    const ann = await dashboardService.updateAnnouncement(req.params.annId as string, req.user!.userId, { title, content });
    res.json(ann);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// DELETE /api/groups/:id/announcements/:annId
router.delete('/:id/announcements/:annId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await dashboardService.deleteAnnouncement(req.params.annId as string, req.user!.userId);
    res.json({ message: '공지사항이 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// ===== 댓글/답글 삭제 =====

// DELETE /api/comments/:id
router.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await dashboardService.deleteComment(req.params.id as string, req.user!.userId);
    res.json({ message: '의견이 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

// DELETE /api/replies/:id
router.delete('/replies/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await dashboardService.deleteReply(req.params.id as string, req.user!.userId);
    res.json({ message: '답글이 삭제되었습니다' });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } });
  }
});

export default router;
