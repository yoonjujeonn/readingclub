import { useState } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChangeStart: (date: string) => void;
  onChangeEnd: (date: string) => void;
  minDate?: string;
  startError?: string;
  endError?: string;
}

function DateRangePicker({ startDate, endDate, onChangeStart, onChangeEnd, minDate, startError, endError }: DateRangePickerProps) {
  const today: string = minDate ?? new Date().toISOString().split('T')[0]!;
  const [viewDate, setViewDate] = useState(() => {
    if (startDate) return new Date(startDate + 'T00:00:00');
    return new Date();
  });
  const [selecting, setSelecting] = useState<'start' | 'end'>(startDate ? 'end' : 'start');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const formatDate = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleDayClick = (day: number) => {
    const dateStr = formatDate(year, month, day);
    if (dateStr < today) return;

    if (selecting === 'start') {
      onChangeStart(dateStr);
      if (endDate && dateStr > endDate) onChangeEnd('');
      setSelecting('end');
    } else {
      if (dateStr < startDate) {
        onChangeStart(dateStr);
        onChangeEnd('');
        setSelecting('end');
      } else {
        onChangeEnd(dateStr);
        setSelecting('start');
      }
    }
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const dateStr = formatDate(year, month, day);
    return dateStr > startDate && dateStr < endDate;
  };

  const isStart = (day: number) => formatDate(year, month, day) === startDate;
  const isEnd = (day: number) => formatDate(year, month, day) === endDate;
  const isPast = (day: number) => formatDate(year, month, day) < today;

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button type="button" onClick={prevMonth} style={styles.navBtn}>◀</button>
        <span style={styles.monthLabel}>{year}년 {month + 1}월</span>
        <button type="button" onClick={nextMonth} style={styles.navBtn}>▶</button>
      </div>

      <div style={styles.weekRow}>
        {weekdays.map(w => <div key={w} style={styles.weekCell}>{w}</div>)}
      </div>

      <div style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} style={styles.emptyCell} />;
          const past = isPast(day);
          const start = isStart(day);
          const end = isEnd(day);
          const inRange = isInRange(day);

          let cellStyle: React.CSSProperties = { ...styles.dayCell };
          if (past) cellStyle = { ...cellStyle, ...styles.pastDay };
          else if (start || end) cellStyle = { ...cellStyle, ...styles.selectedDay };
          else if (inRange) cellStyle = { ...cellStyle, ...styles.rangeDay };

          return (
            <div
              key={day}
              style={cellStyle}
              onClick={() => !past && handleDayClick(day)}
              role="button"
              tabIndex={past ? -1 : 0}
              onKeyDown={(e) => e.key === 'Enter' && !past && handleDayClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#3182ce' }} />
          <span>시작일: {startDate || '선택해주세요'}</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#e53e3e' }} />
          <span>종료일: {endDate || '선택해주세요'}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4 }}>
        {selecting === 'start' ? '시작일을 선택하세요' : '종료일을 선택하세요'}
      </div>
      {startError && <div style={styles.error}>{startError}</div>}
      {endError && <div style={styles.error}>{endError}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, backgroundColor: '#fff', maxWidth: 320 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  navBtn: { background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', padding: '2px 6px', color: '#4a5568' },
  monthLabel: { fontSize: 13, fontWeight: 600, color: '#2d3748' },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 },
  weekCell: { textAlign: 'center' as const, fontSize: 11, color: '#a0aec0', fontWeight: 600, padding: '2px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 },
  emptyCell: { padding: 6 },
  dayCell: { textAlign: 'center' as const, padding: '6px 2px', fontSize: 12, borderRadius: 4, cursor: 'pointer', transition: 'background 0.15s' },
  pastDay: { color: '#cbd5e0', cursor: 'default' },
  selectedDay: { backgroundColor: '#3182ce', color: '#fff', fontWeight: 700 },
  rangeDay: { backgroundColor: '#bee3f8', color: '#2b6cb0' },
  legend: { display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 12, color: '#4a5568' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  error: { color: '#e53e3e', fontSize: 11, marginTop: 4, textAlign: 'center' as const },
};

export default DateRangePicker;
