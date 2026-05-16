import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rankingApi, type RankingUser } from '../api/ranking';
import { useAuthStore } from '../stores/authStore';
import PageHeader from '../components/PageHeader';

function RankingPage() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    rankingApi.getAll(30).then(res => setRanking(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const myRank = ranking.find(r => r.id === user?.id);

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div style={styles.container}>
      <PageHeader />
      <Link to="/" style={styles.backLink}>← 홈으로</Link>
      <h1 style={styles.title}>🏆 활동 랭킹</h1>
      <p style={styles.subtitle}>메모, 스레드, 의견, 댓글 활동으로 점수를 쌓아보세요!</p>

      {/* 내 랭킹 */}
      {myRank && (
        <div style={styles.myRank}>
          <span style={styles.myRankLabel}>내 순위</span>
          <span style={styles.myRankInfo}>{getMedal(myRank.rank)} {myRank.rank}위 · {myRank.nickname} · {myRank.score}점</span>
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>불러오는 중...</div>
      ) : ranking.length === 0 ? (
        <div style={styles.empty}>아직 랭킹 데이터가 없습니다</div>
      ) : (
        <div style={styles.list}>
          {ranking.map((u) => (
            <div key={u.id} style={{ ...styles.row, ...(u.rank <= 3 ? styles.topRow : {}) }}>
              <div style={styles.rankCol}>
                <span style={u.rank <= 3 ? styles.medal : styles.rankNum}>{getMedal(u.rank)}</span>
              </div>
              <div style={styles.avatar}>
                {u.profileImageUrl ? (
                  <img src={u.profileImageUrl} alt="" style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarText}>{u.nickname.charAt(0)}</span>
                )}
              </div>
              <div style={styles.info}>
                <div style={styles.nickname}>{u.nickname}</div>
              </div>
              <div style={styles.score}>{u.score}점</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#C8962E' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#718096', marginBottom: 24 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#a0aec0' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E8DFD3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  topRow: { border: '1px solid #fbd38d', backgroundColor: '#fffff0' },
  rankCol: { width: 32, textAlign: 'center', flexShrink: 0 },
  medal: { fontSize: 20 },
  rankNum: { fontSize: 14, fontWeight: 700, color: '#a0aec0' },
  avatar: { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#E8DFD3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarText: { fontSize: 14, fontWeight: 700, color: '#a0aec0' },
  info: { flex: 1 },
  nickname: { fontSize: 14, fontWeight: 600, color: '#3D2E1E' },
  score: { fontSize: 14, fontWeight: 700, color: '#C8962E', flexShrink: 0 },
  myRank: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: '#FFF8E7', border: '1px solid #E8DFD3', borderRadius: 10, marginBottom: 20 },
  myRankLabel: { fontSize: 12, fontWeight: 700, color: '#C8962E', flexShrink: 0 },
  myRankInfo: { fontSize: 14, fontWeight: 600, color: '#3D2E1E' },
};

export default RankingPage;
