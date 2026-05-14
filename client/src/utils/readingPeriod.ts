export function hasReadingPeriodNotStarted(readingStartDate?: string | null, now = new Date()): boolean {
  if (!readingStartDate) return false;
  const startOfReadingDay = new Date(readingStartDate);
  startOfReadingDay.setHours(0, 0, 0, 0);
  return startOfReadingDay > now;
}

export function hasReadingPeriodEnded(readingEndDate?: string | null, now = new Date()): boolean {
  if (!readingEndDate) return false;
  const endOfReadingDay = new Date(readingEndDate);
  endOfReadingDay.setHours(23, 59, 59, 999);
  return endOfReadingDay < now;
}

export function isOutsideReadingPeriod(readingStartDate?: string | null, readingEndDate?: string | null): boolean {
  return hasReadingPeriodNotStarted(readingStartDate) || hasReadingPeriodEnded(readingEndDate);
}

export function getReadingPeriodWriteBlockMessage(
  readingStartDate?: string | null,
  readingEndDate?: string | null,
): string {
  if (hasReadingPeriodNotStarted(readingStartDate)) {
    return '독서기간이 시작되지 않아 아직 작성, 수정, 삭제할 수 없습니다';
  }
  if (hasReadingPeriodEnded(readingEndDate)) {
    return '독서기간이 종료되어 작성, 수정, 삭제할 수 없습니다';
  }
  return '';
}
