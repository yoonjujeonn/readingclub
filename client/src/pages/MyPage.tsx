import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mypageApi } from '../api/mypage';
import { useAuthStore } from '../stores/authStore';
import type { GroupCard, User } from '../types';

function MyPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) navigate('/login');
  }, [accessToken]);

  const [profile, setProfile] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, gRes] = await Promise.all([
          mypageApi.getProfile().catch(() => ({ data: null })),
          mypageApi.getGroups().catch(() => ({ data: [] })),
        ]);
        setProfile(pRes.data);
        setGroups(gRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (d: string) => d?.slice(0, 10) || '';

  const getReadingStatus = (g: any) => {
    const now = new Date();
    const start = new Date(g.readingStartDate);
    const end = new Date(g.readingEndDate);
    const disc = new Date(g.discussionDate);
    if (now < start) return { label: '시작 전', color: '#a0aec0', bg: '#f7fafc' };
    if (now <= end) return { label: '독서 중', color: '#38a169', bg: '#f0fff4' };
    if (now <= disc) return { label: '토론 준비', color: '#d69e2e', bg: '#fffff0' };
    return { label: '완료', color: '#718096', bg: '#f7fafc' };
  };

  if (loading) return <div style={s.loading}>불러오는 중...</div>;

  return (
    <div style={s.container}>
      <Link to="/" style={s.backLink}>← 홈으로</Link>

      {/* 프로필 섹션 */}
      {profile && (
        <div style={s.profileCard}>
          <div style={s.profileTop}>
            <div style={s.avatar}>
              {profile.nickname.charAt(0).toUpperCase()}
            </div>
            <div style={s.profileInfo}>
              <div style={s.nickname}>{profile.nickname}</div>
              <div style={s.email}>{profile.email}</div>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout}>로그아웃</button>
            <button
              onClick={() => navigate('/settings')}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 }}
              title="설정"
            >
              ⚙️
            </button>
          </div>
          <div style={s.statRow}>
            <div style={s.statItem}>
              <div style={s.statNum}>{groups.length}</div>
              <div style={s.statLabel}>참여 모임</div>
            </div>
            <div style={s.statItem}>
              <div style={s.statNum}>{groups.filter((g: any) => g.role === 'owner').length}</div>
              <div style={s.statLabel}>주관 모임</div>
            </div>
            <div style={s.statItem}>
              <div style={s.statNum}>{formatDate(profile.createdAt || '')}</div>
              <div style={s.statLabel}>가입일</div>
            </div>
          </div>
        </div>
      )}

      {/* 내 독서 클럽 */}
      <div>
          {groups.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <div>참여 중인 모임이 없습니다</div>
              <Link to="/" style={{ color: '#667eea', marginTop: 8, display: 'inline-block' }}>모임 둘러보기 →</Link>
            </div>
          ) : (
            <div style={s.clubGrid}>
              {groups.map((g: any) => {
                const status = getReadingStatus(g);
                return (
                  <div
                    key={g.id}
                    style={s.clubCard}
                    onClick={() => navigate(`/groups/${g.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${g.id}`)}
                  >
                    {/* 책 표지 */}
                    <div style={s.clubCover}>
                      {g.book?.coverImageUrl ? (
                        <img src={g.book.coverImageUrl} alt="" style={s.clubCoverImg} />
                      ) : (
                        <div style={s.clubCoverPlaceholder}>📖</div>
                      )}
                    </div>
                    {/* 정보 */}
                    <div style={s.clubInfo}>
                      <div style={s.clubBookTitle}>{g.book?.title || '제목 없음'}</div>
                      <div style={s.clubName}>{g.name}</div>
                      {/* 상태 뱃지 */}
                      <div style={{ ...s.statusBadge, color: status.color, backgroundColor: status.bg }}>
                        {status.label}
                      </div>
                      {/* 진행률 */}
                      <div style={s.progressRow}>
                        <div style={s.progressBar}>
                          <div style={{ ...s.progressFill, width: `${Math.min(g.readingProgress || 0, 100)}%` }} />
                        </div>
                        <span style={s.progressText}>p.{g.readingProgress || 0}</span>
                      </div>
                      {/* 메타 */}
                      <div style={s.clubMeta}>
                        👥 {g.memberCount || g.currentMembers || 0}/{g.maxMembers}명
                        {g.role === 'owner' && <span style={s.ownerBadge}>방장</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#667eea', fontWeight: 500, textDecoration: 'none' },
  loading: { textAlign: 'center', padding: '60px 20px', color: '#a0aec0' },

  // 프로필
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 20, border: '1px solid #f0f0f5' },
  profileTop: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  profileInfo: { flex: 1 },
  nickname: { fontSize: 20, fontWeight: 800, color: '#1a202c', letterSpacing: '-0.3px' },
  email: { fontSize: 13, color: '#718096', marginTop: 2 },
  logoutBtn: { padding: '8px 16px', background: 'none', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  statRow: { display: 'flex', gap: 0, borderTop: '1px solid #f0f0f5', paddingTop: 16 },
  statItem: { flex: 1, textAlign: 'center' as const },
  statNum: { fontSize: 18, fontWeight: 700, color: '#2d3748' },
  statLabel: { fontSize: 12, color: '#a0aec0', marginTop: 2 },

  // 탭
  tabRow: { display: 'flex', gap: 4, marginBottom: 20, backgroundColor: '#f7f8fc', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: '10px 0', textAlign: 'center' as const, fontSize: 14, fontWeight: 600, color: '#718096', border: 'none', borderRadius: 8, cursor: 'pointer', backgroundColor: 'transparent', transition: 'all 0.2s' },
  tabActive: { backgroundColor: '#fff', color: '#1a202c', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },

  // 클럽 그리드
  clubGrid: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  clubCard: { display: 'flex', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.05)', border: '1px solid #f0f0f5', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' },
  clubCover: { width: 64, height: 90, borderRadius: 6, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f7f8fc' },
  clubCoverImg: { width: '100%', height: '100%', objectFit: 'contain' as const },
  clubCoverPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 },
  clubInfo: { flex: 1, minWidth: 0 },
  clubBookTitle: { fontSize: 15, fontWeight: 700, color: '#1a202c', marginBottom: 2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  clubName: { fontSize: 13, color: '#667eea', fontWeight: 600, marginBottom: 8 },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 8 },
  progressRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#edf2f7', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 3, transition: 'width 0.3s' },
  progressText: { fontSize: 11, color: '#a0aec0', whiteSpace: 'nowrap' as const },
  clubMeta: { fontSize: 12, color: '#a0aec0' },
  ownerBadge: { display: 'inline-block', backgroundColor: '#fefcbf', color: '#975a16', padding: '1px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, marginLeft: 8 },

  // 설정
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f5' },
  settingGroup: { marginBottom: 20 },
  settingGroupTitle: { fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 10 },
  settingItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f7f8fc', fontSize: 14, color: '#2d3748' },

  // 빈 상태
  emptyState: { textAlign: 'center' as const, padding: '40px 20px', color: '#a0aec0', fontSize: 14, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f0f0f5' },
};

export default MyPage;
