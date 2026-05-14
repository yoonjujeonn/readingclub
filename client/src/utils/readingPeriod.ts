export function hasReadingPeriodEnded(readingEndDate?: string | null, now = new Date()): boolean {
  if (!readingEndDate) return false;
  const endOfReadingDay = new Date(readingEndDate);
  endOfReadingDay.setHours(23, 59, 59, 999);
  return endOfReadingDay < now;
}
