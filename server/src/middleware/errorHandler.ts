import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../services/auth.service';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? '이미지는 5MB 이하의 파일만 사용할 수 있습니다'
      : '이미지 업로드 요청이 올바르지 않습니다';
    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      error: {
        code: err.code,
        message,
      },
    });
    return;
  }

  console.error('Unexpected error:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: '서버 오류가 발생했습니다',
    },
  });
}
