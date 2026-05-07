import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import type { GroupDetail, ApiError } from '../types';
import { AxiosError } from 'axios';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 16,
    fontSize: 14,
    color: '#3182ce',
  },
  bookSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  bookSummary: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 1.6,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#2d3748',
  },
  groupName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#3182ce',
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 1.8,
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  },
  progressBar: {
    width: 100,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#48bb78',
    borderRadius: 4,
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#fefcbf',
    color: '#975a16',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 8,
  },
  joinBtn: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#48bb78',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
  joinBtnDisabled: {
    backgroundColor: '#cbd5e0',
    cursor: 'not-allowed',
  },
  joinMsg: {
    textAlign: 'center' as const,
    fontSize: 13,
    color: '#718096',
    marginTop: 8,
  },
  linkRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 16,
  },
  actionLink: {
    flex: 1,
    display: 'block',
    textAlign: 'center' as const,
    padding: '10px 0',
    backgroundColor: '#ebf8ff',
    color: '#3182ce',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
  },
  summaryItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 13,
    color: '#4a5568',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
  },
  error: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#e53e3e',
  },
};

function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMaxMembers, setEditMaxMembers] = useState('');
  const [editReadingStart, setEditReadingStart] = useState('');
  const [editReadingEnd, setEditReadingEnd] = useState('');
  const [editDiscussionDate, setEditDiscussionDate] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await groupsApi.getDetail(id);
      setGroup(data);
    } catch {
      setError('모임 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Decode user ID from token if user is not set
  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
      currentUserId = payload.userId || '';
    } catch { /* ignore */ }
  }

  const isMember = group?.members.some((m) => m.userId === currentUserId) ?? false;
  const isFull = group ? (group.currentMembers || group.memberCount || 0) >= group.maxMembers : false;
  const isOwner = group?.ownerId === currentUserId;

  const startEditing = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditMaxMembers(String(group.maxMembers));
    setEditReadingStart(group.readingStartDate?.slice(0, 10) || '');
    setEditReadingEnd(group.readingEndDate?.slice(0, 10) || '');
    setEditDiscussionDate(group.discussionDate?.slice(0, 10) || '');
    setEditError('');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    setEditError('');
    if (!editName.trim()) { setEditError('모임명을 입력해주세요'); return; }
    setSaving(true);
    try {
      await groupsApi.update(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        maxMembers: parseInt(editMaxMembers),
        readingStartDate: editReadingStart,
        readingEndDate: editReadingEnd,
        discussionDate: editDiscussionDate,
      } as any);
      setEditing(false);
      fetchDetail();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setEditError(axiosErr.response?.data?.error?.message || '수정에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async () => {
    if (!id) return;
    if (!accessToken) {
      navigate('/login');
      return;
    }
    if (isMember || isFull) return;
    setJoining(true);
    setJoinMsg('');
    try {
      await groupsApi.join(id);
      setJoinMsg('모임에 참여했습니다!');
      fetchDetail();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const code = axiosErr.response?.data?.error?.code;
      if (code === 'ALREADY_JOINED') {
        setJoinMsg('이미 참여 중인 모임입니다');
      } else if (code === 'GROUP_FULL') {
        setJoinMsg('모집 인원이 마감되었습니다');
      } else {
        setJoinMsg(axiosErr.response?.data?.error?.message || '참여에 실패했습니다');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;
  if (error || !group) return <div style={styles.error}>{error || '모임을 찾을 수 없습니다'}</div>;

  const formatDate = (d: string) => d?.slice(0, 10) || '';

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← 홈으로</Link>

      {/* Book Info */}
      <div style={styles.bookSection}>
        <div style={{ display: 'flex', gap: 16 }}>
          {group.book.coverImageUrl && (
            <img
              src={group.book.coverImageUrl}
              alt={group.book.title}
              style={{ width: 120, height: 172, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
          )}
          <div>
            <div style={styles.bookTitle}>📖 {group.book.title}</div>
            {group.book.author && <div style={styles.bookAuthor}>{group.book.author}</div>}
            {group.book.summary && (
              <>
                <div style={styles.bookSummary}>
                  {summaryExpanded
                    ? group.book.summary
                    : (() => {
                        const text = group.book.summary!;
                        // 첫 2~3문장까지만 보여주기 (마침표 기준)
                        const sentences = text.match(/[^.!?]+[.!?]+/g);
                        if (!sentences || sentences.length <= 2) return text;
                        const preview = sentences.slice(0, 2).join('').trim();
                        return preview.length < text.length ? preview + '…' : text;
                      })()
                  }
                </div>
                {(() => {
                  const text = group.book.summary!;
                  const sentences = text.match(/[^.!?]+[.!?]+/g);
                  return sentences && sentences.length > 2;
                })() && (
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    style={{ background: 'none', border: 'none', color: '#3182ce', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}
                  >
                    {summaryExpanded ? '접기' : '더보기'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Group Info */}
      <div style={styles.section}>
        {!editing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.groupName}>{group.name}</div>
              {isOwner && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={startEditing}
                    style={{ padding: '6px 14px', fontSize: 13, border: '1px solid #3182ce', borderRadius: 4, backgroundColor: '#fff', color: '#3182ce', cursor: 'pointer' }}
                  >
                    ✏️ 수정
                  </button>
                  {(group.currentMembers || group.memberCount || group.members?.length || 0) <= 1 && (
                    <button
                      onClick={async () => {
                        if (!confirm('정말 이 모임을 삭제하시겠습니까?')) return;
                        try {
                          await groupsApi.delete(id!);
                          navigate('/');
                        } catch (err) {
                          const axiosErr = err as AxiosError<ApiError>;
                          alert(axiosErr.response?.data?.error?.message || '삭제에 실패했습니다');
                        }
                      }}
                      style={{ padding: '6px 14px', fontSize: 13, border: '1px solid #e53e3e', borderRadius: 4, backgroundColor: '#fff', color: '#e53e3e', cursor: 'pointer' }}
                    >
                      🗑️ 삭제
                    </button>
                  )}
                </div>
              )}
            </div>
            {group.description && <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 12 }}>{group.description}</p>}
            <div style={styles.meta}>
              📅 독서 기간: {formatDate(group.readingStartDate)} ~ {formatDate(group.readingEndDate)}<br />
              💬 토론 날짜: {formatDate(group.discussionDate)}<br />
              👥 참여 인원: {group.currentMembers || group.memberCount || group.members?.length}/{group.maxMembers}명
            </div>
          </>
        ) : (
          <>
            {editError && <div style={{ backgroundColor: '#fff5f5', color: '#e53e3e', padding: '8px 12px', borderRadius: 4, fontSize: 13, marginBottom: 12 }}>{editError}</div>}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>모임명</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>방 소개</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, minHeight: 60, fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>모집 인원</label>
                <input type="number" min="1" value={editMaxMembers} onChange={(e) => setEditMaxMembers(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>독서 시작일</label>
                <input type="date" value={editReadingStart} onChange={(e) => setEditReadingStart(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>독서 종료일</label>
                <input type="date" value={editReadingEnd} onChange={(e) => setEditReadingEnd(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>토론 날짜</label>
              <input type="date" value={editDiscussionDate} onChange={(e) => setEditDiscussionDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditing(false)} style={{ padding: '8px 20px', backgroundColor: '#edf2f7', color: '#333', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation Links (for members) */}
      {isMember && (
        <div style={styles.linkRow}>
          <Link to={`/groups/${id}/memos`} style={styles.actionLink}>📝 메모</Link>
          <Link to={`/groups/${id}/discussions`} style={styles.actionLink}>💬 토론 페이지</Link>
          {isOwner && (
            <Link to={`/groups/${id}/dashboard`} style={{ ...styles.actionLink, backgroundColor: '#fefcbf', color: '#975a16' }}>🛠️ 대시보드</Link>
          )}
          {!isOwner && (
            <button
              onClick={async () => {
                if (!confirm('정말 이 모임에서 나가시겠습니까?')) return;
                try {
                  await groupsApi.leave(id!);
                  navigate('/');
                } catch (err) {
                  const axiosErr = err as AxiosError<ApiError>;
                  alert(axiosErr.response?.data?.error?.message || '모임 나가기에 실패했습니다');
                }
              }}
              style={{ flex: 1, display: 'block', textAlign: 'center' as const, padding: '10px 0', backgroundColor: '#fff5f5', color: '#e53e3e', borderRadius: 6, fontSize: 14, fontWeight: 500, border: '1px solid #fed7d7', cursor: 'pointer' }}
            >
              모임 나가기
            </button>
          )}
        </div>
      )}

      {/* Join Button */}
      {!isMember && (
        <div style={styles.section}>
          <button
            style={{ ...styles.joinBtn, ...(isFull ? styles.joinBtnDisabled : {}) }}
            onClick={handleJoin}
            disabled={isFull || joining}
          >
            {joining ? '참여 중...' : isFull ? '모집 마감' : '참여하기'}
          </button>
          {isFull && !joinMsg && <div style={styles.joinMsg}>모집 인원이 마감되었습니다</div>}
          {joinMsg && <div style={styles.joinMsg}>{joinMsg}</div>}
        </div>
      )}

      {/* Announcements */}
      {(group as any).announcements && (group as any).announcements.length > 0 && (
        <div style={{ ...styles.section, borderLeft: '4px solid #f6ad55' }}>
          <div style={styles.sectionTitle}>📢 공지사항</div>
          {(group as any).announcements.map((ann: any) => (
            <div key={ann.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{ann.title}</div>
              <div style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>{ann.content}</div>
              <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 4 }}>{new Date(ann.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>👥 참여자 ({group.members.length}명)</div>
        {group.members.map((m) => (
          <div key={m.id} style={styles.memberItem}>
            <span>
              {m.nickname}
              {m.role === 'owner' && <span style={styles.badge}>방장</span>}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
              <span style={{ fontSize: 12, color: '#a0aec0', width: 36, textAlign: 'right' as const }}>p.{m.readingProgress}</span>
              <div style={{ ...styles.progressBar, flex: 1 }}>
                <div style={{ ...styles.progressFill, width: `${Math.min(m.readingProgress, 100)}%` }} />
              </div>
              {m.userId === currentUserId ? (
                <button
                  style={{ padding: '2px 8px', fontSize: 11, border: '1px solid #3182ce', borderRadius: 4, backgroundColor: '#fff', color: '#3182ce', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                  onClick={() => {
                    const input = prompt('현재 읽은 페이지를 입력해주세요', String(m.readingProgress));
                    if (input !== null && !isNaN(Number(input)) && Number(input) >= 0) {
                      groupsApi.updateProgress(id!, Number(input)).then(() => fetchDetail());
                    }
                  }}
                >
                  수정
                </button>
              ) : (
                <span style={{ width: 42 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Memos */}
      {group.recentMemos && group.recentMemos.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📝 최근 메모</div>
          {group.recentMemos.map((memo) => {
            const myProgress = group.members.find((m) => m.userId === currentUserId)?.readingProgress ?? 0;
            const isSpoiler = (memo as any).visibility === 'spoiler';
            const canView = !isSpoiler || myProgress >= memo.pageEnd;
            return (
              <div key={memo.id} style={styles.summaryItem}>
                <strong>{memo.authorNickname}</strong> — p.{memo.pageStart}~{memo.pageEnd}:{' '}
                {canView
                  ? <>{memo.content.slice(0, 80)}{memo.content.length > 80 ? '...' : ''}</>
                  : <span style={{ color: '#92400e', fontSize: 12 }}>⚠️ p.{memo.pageEnd}까지 읽은 후 열람 가능</span>
                }
                {isSpoiler && <span style={{ marginLeft: 6, fontSize: 11, color: '#92400e', backgroundColor: '#fffbeb', padding: '1px 6px', borderRadius: 8 }}>스포일러</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Discussions */}
      {group.recentDiscussions && group.recentDiscussions.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💬 최근 토론</div>
          {group.recentDiscussions.map((d) => (
            <Link key={d.id} to={`/discussions/${d.id}`} style={{ textDecoration: 'none' }}>
              <div style={styles.summaryItem}>
                <strong>{d.title}</strong>
                <span style={{ fontSize: 12, color: '#a0aec0', marginLeft: 8 }}>{d.authorNickname}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupDetailPage;
