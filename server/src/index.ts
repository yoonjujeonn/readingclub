import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth.routes';
import bookRouter from './routes/book.routes';
import groupRouter from './routes/group.routes';
import memoRouter from './routes/memo.routes';
import discussionRouter from './routes/discussion.routes';
import mypageRouter from './routes/mypage.routes';
import dashboardRouter from './routes/dashboard.routes';
import aiRouter from './routes/ai.routes';
import tokenRouter from './routes/token.routes';
import insightRouter from './routes/insight.routes';
import notificationRouter from './routes/notification.routes';
import rankingRouter from './routes/ranking.routes';
import { globalErrorHandler } from './middleware/errorHandler';
import { isS3StorageEnabled } from './services/file-storage.service';
import { notificationService } from './services/notification.service';

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// uploads 폴더 자동 생성
const uploadsDir = path.join(__dirname, '../uploads');
if (!isS3StorageEnabled() && !fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// CORS: 개발 환경에서는 Vite dev server 허용, 프로덕션에서는 CORS_ORIGIN이 있으면 해당 origin만 허용
if (isProduction) {
  if (corsOrigins.length > 0) {
    app.use(cors({
      origin: corsOrigins,
      credentials: true,
    }));
  }
} else {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }));
}

app.use(express.json());

// 로컬 저장소를 쓸 때만 업로드 파일 정적 서빙
if (!isS3StorageEnabled()) {
  app.use('/uploads', express.static(uploadsDir));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 라우터 등록
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/groups', dashboardRouter);
app.use('/api/groups', groupRouter);
app.use('/api', memoRouter);
app.use('/api', discussionRouter);
app.use('/api/me', mypageRouter);
app.use('/api/me/notifications', notificationRouter);
app.use('/api', dashboardRouter);
app.use('/api', aiRouter);
app.use('/api', tokenRouter);
app.use('/api', insightRouter);
app.use('/api', rankingRouter);

// 글로벌 에러 핸들러 (모든 라우터 뒤에 등록)
app.use(globalErrorHandler);

// 프로덕션: React 빌드 정적 파일 서빙 + SPA fallback
if (isProduction) {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on 127.0.0.1:${PORT} (${isProduction ? 'production' : 'development'})`);
  notificationService.startDateNotificationScheduler();
});

export default app;
