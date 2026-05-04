import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mypageApi } from '../api/mypage';
import { useAuthStore } from '../stores/authStore';
import type { GroupCard, Memo, Discussion, User } from '../types';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#1a202c',
  },
  logoutBtn: {
    padding: '9px 20px',
    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(229,62,62,0.25)',
    transition: 'transform 0.15s',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 16,
    fontSize: 14,
    color: '#667eea',
    fontWeight: 500,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: 16,
    border: '1px solid #f0f0f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: '#2d3748',
  },
  listItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    fontSize: 14,
    color: '#4a5568',
    transition: 'background-color 0.15s',
  },
  listItemTitle: {
    fontWeight: 600,
    color: '#1a202c',
    marginBottom: 3,
  },
  listItemMeta: {
    fontSize: 12,
    color: '#a0aec0',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#a0aec0',
    fontSize: 14,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
  },
};

function MyPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  // 닉네임 수정 상태
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, gRes, mRes, dRes] = await Promise.all([
          mypageApi.getProfile().catch(() => ({ data: null })),
          mypageApi.getGroups().catch(() => ({ data: [] })),
          mypageApi.getMemos().catch(() => ({ data: [] })),
          mypageApi.getDiscussions().catch(() => ({ data: [] })),
        ]);
        setProfile(pRes.data);
        setGroups(gRes.data);
        setMemos(mRes.data);
        setDiscussions(dRes.data);
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

  const handleCheckNickname = async () => {
    if (!newNickname.trim()) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }
    if (newNickname === profile?.nickname) {
      setNicknameError('현재 닉네임과 동일합니다');
      return;
    }
    setNicknameChecking(true);
    setNicknameError('');
    setNicknameAvailable(null);
    try {
      const res = await mypageApi.checkNickname(newNickname);
      setNicknameAvailable(res.data.available);
      if (!res.data.available) {
        setNicknameError('이미 사용 중인 닉네임입니다');
      }
    } catch {
      setNicknameError('중복 확인 중 오류가 발생했습니다');
    } finally {
      setNicknameChecking(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!nicknameAvailable) return;
    setNicknameSaving(true);
    try {
      const res = await mypageApi.updateNickname(newNickname);
      setProfile(res.data);
      setEditingNickname(false);
      setNicknameAvailable(null);
      setNewNickname('');
    } catch {
      setNicknameError('닉네임 변경 중 오류가 발생했습니다');
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleStartEdit = () => {
    setEditingNickname(true);
    setNewNickname(profile?.nickname || '');
    setNicknameAvailable(null);
    setNicknameError('');
  };

  const handleCancelEdit = () => {
    setEditingNickname(false);
    setNewNickname('');
    setNicknameAvailable(null);
    setNicknameError('');
  };

  const formatDate = (d: string) => d?.slice(0, 10) || '';

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← 홈으로</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>👤 마이페이지</h1>
        <button style={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
      </div>

      {/* Profile */}
      {profile && (
        <div style={styles.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', backgroundColor: '#3182ce',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 24, fontWeight: 700, flexShrink: 0,
            }}>
              {profile.nickname.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              {!editingNickname ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#2d3748' }}>{profile.nickname}</div>
                  <button
                    onClick={handleStartEdit}
                    style={{
                      padding: '3px 10px', fontSize: 12, color: '#667eea', background: '#eef2ff',
                      border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    수정
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => {
                        setNewNickname(e.target.value);
                        setNicknameAvailable(null);
                        setNicknameError('');
                      }}
                      maxLength={50}
                      style={{
                        padding: '6px 10px', fontSize: 14, border: '1px solid #d1d5db',
                        borderRadius: 6, outline: 'none', width: 160,
                      }}
                      placeholder="새 닉네임"
                    />
                    <button
                      onClick={handleCheckNickname}
                      disabled={nicknameChecking}
                      style={{
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                        background: nicknameChecking ? '#a0aec0' : '#667eea',
                        border: 'none', borderRadius: 6, cursor: nicknameChecking ? 'default' : 'pointer',
                      }}
                    >
                      {nicknameChecking ? '확인 중...' : '중복확인'}
                    </button>
                    <button
                      onClick={handleSaveNickname}
                      disabled={!nicknameAvailable || nicknameSaving}
                      style={{
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                        background: nicknameAvailable && !nicknameSaving ? '#38a169' : '#a0aec0',
                        border: 'none', borderRadius: 6, cursor: nicknameAvailable ? 'pointer' : 'default',
                      }}
                    >
                      {nicknameSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#718096',
                        background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      취소
                    </button>
                  </div>
                  {nicknameError && (
                    <div style={{ fontSize: 12, color: '#e53e3e' }}>{nicknameError}</div>
                  )}
                  {nicknameAvailable && (
                    <div style={{ fontSize: 12, color: '#38a169' }}>사용 가능한 닉네임입니다</div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 14, color: '#718096' }}>{profile.email}</div>
              <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 4 }}>
                가입일: {profile.createdAt?.slice(0, 10)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Groups */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📚 참여 모임 ({groups.length})</div>
        {groups.length === 0 ? (
          <div style={styles.emptyState}>참여 중인 모임이 없습니다</div>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              style={styles.listItem}
              onClick={() => navigate(`/groups/${g.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${g.id}`)}
            >
              <div style={styles.listItemTitle}>
                {g.book.title} — {g.name}
                {(g as any).role === 'owner' && (
                  <span style={{ display: 'inline-block', backgroundColor: '#fefcbf', color: '#975a16', padding: '1px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, marginLeft: 8 }}>방장</span>
                )}
              </div>
              <div style={styles.listItemMeta}>
                👥 {g.currentMembers || (g as any).memberCount || 0}/{g.maxMembers}명 · 📅 {formatDate(g.readingStartDate)} ~ {formatDate(g.readingEndDate)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Memos */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>📝 작성 메모 ({memos.length})</div>
        {memos.length === 0 ? (
          <div style={styles.emptyState}>작성한 메모가 없습니다</div>
        ) : (
          memos.map((m) => (
            <div
              key={m.id}
              style={styles.listItem}
              onClick={() => navigate(`/groups/${m.groupId}/memos`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${m.groupId}/memos`)}
            >
              <div style={styles.listItemTitle}>
                {(m as any).bookTitle && <span style={{ color: '#667eea', marginRight: 6 }}>{(m as any).bookTitle}</span>}
                p.{m.pageStart}~{m.pageEnd}: {m.content.slice(0, 60)}{m.content.length > 60 ? '...' : ''}
              </div>
              <div style={styles.listItemMeta}>
                {m.isPublic ? '공개' : '비공개'} · {new Date(m.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Discussions */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>💬 참여 토론 ({discussions.length})</div>
        {discussions.length === 0 ? (
          <div style={styles.emptyState}>참여한 토론이 없습니다</div>
        ) : (
          discussions.map((d) => (
            <div
              key={d.id}
              style={styles.listItem}
              onClick={() => navigate(`/discussions/${d.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/discussions/${d.id}`)}
            >
              <div style={styles.listItemTitle}>
                {(d as any).bookTitle && <span style={{ color: '#667eea', marginRight: 6 }}>{(d as any).bookTitle}</span>}
                {d.title}
              </div>
              <div style={styles.listItemMeta}>
                {d.authorNickname} · {new Date(d.createdAt).toLocaleDateString()}
                {d.isRecommended && ' · ✨ 추천'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyPage;
