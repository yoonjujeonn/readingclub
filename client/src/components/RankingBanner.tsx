import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rankingApi, type RankingTop3 } from '../api/ranking';

function RankingBanner() {
  const navigate = useNavigate();
  const [top3, setTop3] = useState<RankingTop3[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    rankingApi.getTop3().then(res => setTop3(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (top3.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % top3.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [top3]);

  if (top3.length === 0) return null;

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇 1위';
    if (rank === 2) return '🥈 2위';
    if (rank === 3) return '🥉 3위';
    return `${rank}위`;
  };

  return (
    <div
      style={styles.banner}
      onClick={() => navigate('/ranking')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/ranking')}
    >
      <span style={styles.label}>🏆 활동 랭킹</span>
      <div style={styles.roller}>
        <div style={{
          transform: `translateY(-${currentIndex * 20}px)`,
          transition: 'transform 0.4s ease',
        }}>
          {top3.map((item, i) => (
            <div key={i} style={styles.entry}>
              {getMedal(item.rank)} {item.nickname} ({item.score}점)
            </div>
          ))}
        </div>
      </div>
      <span style={styles.arrow}>전체보기 →</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 8,
    marginBottom: 16,
    cursor: 'pointer',
    overflow: 'hidden',
  },
  label: { fontSize: 13, fontWeight: 700, color: '#975a16', flexShrink: 0 },
  roller: { flex: 1, height: 20, overflow: 'hidden' },
  entry: { fontSize: 13, fontWeight: 600, color: '#2d3748', height: 20, lineHeight: '20px' },
  arrow: { fontSize: 12, color: '#975a16', flexShrink: 0, fontWeight: 600 },
};

export default RankingBanner;
