import { AppError } from './auth.service';

const READING_PERIOD_ENDED_MESSAGE = '독서기간이 종료되어 더 이상 작성, 수정, 삭제할 수 없습니다';

export function hasReadingPeriodEnded(readingEndDate: Date, now = new Date()): boolean {
  const endOfReadingDay = new Date(readingEndDate);
  endOfReadingDay.setHours(23, 59, 59, 999);
  return endOfReadingDay < now;
}

export function assertReadingPeriodOpen(readingEndDate: Date): void {
  if (hasReadingPeriodEnded(readingEndDate)) {
    throw new AppError(403, 'READING_PERIOD_ENDED', READING_PERIOD_ENDED_MESSAGE);
  }
}
