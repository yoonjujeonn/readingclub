import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import type { GroupCard, ApiError } from '../types';
import { AxiosError } from 'axios';
import GroupJoinModal from '../components/GroupJoinModal';
import GroupTags from '../components/GroupTags';
import NotificationBell from '../components/NotificationBell';
import RankingBanner from '../components/RankingBanner';

type SearchType = 'bookTitle' | 'groupName' | 'owner' | 'tag' | 'bookAuthor';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px 16px',
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: '-0.5px',
  },
  nav: {
    display: 'flex',
    gap: 10,
  },
  navLink: {
    padding: '9px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  navLinkSecondary: {
    padding: '9px 20px',
    backgroundColor: '#f7f8fc',
    color: '#4a5568',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid #e2e8f0',
    transition: 'background-color 0.15s',
  },
  searchBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 28,
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 14,
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchSelect: {
    width: 120,
    padding: '12px 14px',
    fontSize: 14,
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#2d3748',
    boxSizing: 'border-box' as const,
    outline: 'none',
    cursor: 'pointer',
  },
  searchButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(102,126,234,0.25)',
    transition: 'transform 0.15s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #f0f0f5',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 4,
    color: '#1a202c',
    letterSpacing: '-0.3px',
  },
  groupName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#667eea',
    marginBottom: 8,
  },
  summary: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 12,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as any,
    overflow: 'hidden',
  },
  meta: {
    fontSize: 12,
    color: '#a0aec0',
    lineHeight: 1.6,
  },
  members: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #ebf4ff 0%, #e8e0ff 100%)',
    color: '#5a67d8',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
    fontSize: 15,
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
    fontSize: 15,
  },
};

function HomePage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!accessToken;

  // 현재 사용자 ID 추출
  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
      currentUserId = payload.userId || '';
    } catch { /* ignore */ }
  }
  // 초기값을 반드시 빈 배열 []로 설정하여 map 에러 방지
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('bookTitle');
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Modal state
  const [selectedGroup, setSelectedGroup] = useState<GroupCard | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const fetchGroups = async (query?: string, type: SearchType = searchType) => {
    setLoading(true);
    try {
      const params = query ? { search: query, searchType: type } : undefined;
      const response = await groupsApi.list(params);
      // API 응답 구조에 따라 데이터가 없을 경우 빈 배열을 기본값으로 사용
      setGroups(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearched(!!search.trim());
    fetchGroups(search.trim() || undefined, searchType);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (!value.trim() && searched) {
      setSearched(false);
      fetchGroups();
    }
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (searched && search.trim()) {
      fetchGroups(search.trim(), type);
    }
  };

  const handleCardClick = (group: GroupCard) => {
    // 이미 참여 중이거나 본인이 생성한 모임이면 바로 상세 페이지로 이동
    if (group.isMember || group.ownerId === currentUserId) {
      navigate(`/groups/${group.id}`);
      return;
    }
    setSelectedGroup(group);
    setJoinMsg('');
    setJoining(false);
  };

  const handleModalClose = () => {
    setSelectedGroup(null);
    setJoinMsg('');
  };

  const handleJoin = async (password?: string) => {
    if (!selectedGroup) return;
    if (!accessToken) {
      setSelectedGroup(null);
      navigate('/login');
      return;
    }
    setJoining(true);
    setJoinMsg('');
    try {
      await groupsApi.join(selectedGroup.id, password);
      setJoinMsg('모임에 참여했습니다!');
      // 참여 성공 시 잠시 후 상세 페이지로 이동
      setTimeout(() => {
        setSelectedGroup(null);
        navigate(`/groups/${selectedGroup.id}`);
      }, 800);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const code = axiosErr.response?.data?.error?.code;
      if (code === 'ALREADY_JOINED') {
        setJoinMsg('이미 참여 중인 모임입니다');
        setTimeout(() => {
          setSelectedGroup(null);
          navigate(`/groups/${selectedGroup.id}`);
        }, 800);
      } else if (code === 'GROUP_FULL') {
        setJoinMsg('모집 인원이 마감되었습니다');
      } else if (code === 'INVALID_PASSWORD') {
        setJoinMsg('비밀번호가 올바르지 않습니다');
      } else {
        setJoinMsg(axiosErr.response?.data?.error?.message || '참여에 실패했습니다');
      }
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (d: string) => d?.slice(0, 10) || '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={() => { setSearch(''); setSearchType('bookTitle'); setSearched(false); fetchGroups(undefined, 'bookTitle'); }}>
          <h1 style={styles.title}>📚 버지페이지</h1>
        </Link>
        <div style={styles.nav}>
          {isLoggedIn ? (
            <>
              <NotificationBell />
              <Link to="/mypage" style={styles.navLinkSecondary}>마이페이지</Link>
            </>
          ) : (
            <Link to="/login" style={styles.navLink}>로그인</Link>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        padding: '32px 28px',
        marginBottom: 24,
        color: '#fff',
        position: 'relative' as const,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            함께 읽고, 함께 나누는 독서 모임
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, maxWidth: 480 }}>
            책을 읽으며 메모를 남기고, 다른 독서가들과 생각을 나눠보세요.
            기록이 스레드로 이어지는 새로운 독서 경험을 시작하세요.
          </div>
          <Link to="/groups/new" style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '10px 24px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            모임 시작하기 →
          </Link>
        </div>
        <div style={{
          position: 'absolute' as const,
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 80,
          opacity: 0.15,
        }}>
          📖
        </div>
      </div>

      <RankingBanner />

      <form onSubmit={handleSearch} style={styles.searchBar}>
        <select
          value={searchType}
          onChange={(e) => handleSearchTypeChange(e.target.value as SearchType)}
          style={styles.searchSelect}
          aria-label="검색 기준"
        >
          <option value="bookTitle">책 제목</option>
          <option value="groupName">모임명</option>
          <option value="tag">태그</option>
          <option value="owner">모임장</option>
          <option value="bookAuthor">글쓴이</option>
        </select>
        <input
          type="text"
          style={styles.searchInput}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="검색어를 입력하세요..."
        />
        <button type="submit" style={styles.searchButton}>검색</button>
      </form>

      {/* 내 모임 — 가로 스크롤 */}
      {isLoggedIn && !searched && groups.filter(g => g.isMember || g.ownerId === currentUserId).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 12 }}>📖 내 모임</div>
          <div style={{
            display: 'flex',
            gap: 14,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'thin' as any,
          }}>
            {groups.filter(g => g.isMember || g.ownerId === currentUserId).map(g => (
              <div
                key={g.id}
                style={{
                  minWidth: 220,
                  maxWidth: 220,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  border: '2px solid #667eea',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                }}
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                {g.book?.coverImageUrl && (
                  <img src={g.book.coverImageUrl} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {g.book?.title || '제목 없음'}
                  </div>
                  <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600, marginBottom: 4 }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: '#a0aec0' }}>
                    👥 {g.currentMembers}/{g.maxMembers}명
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 모임 */}
      {!searched && isLoggedIn && groups.filter(g => !(g.isMember || g.ownerId === currentUserId)).length > 0 && (
        <div style={{ fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 12 }}>🌐 전체 모임</div>
      )}

      {loading ? (
        <div style={styles.loading}>불러오는 중...</div>
      ) : !groups || groups.length === 0 ? (
        <div style={styles.emptyState}>
          {searched ? '검색 결과가 없습니다' : '아직 모임이 없습니다. 첫 모임을 만들어보세요!'}
        </div>
      ) : (
        <div style={styles.grid}>
          {/* 옵셔널 체이닝 ?. 을 추가하여 안전하게 렌더링 */}
          {(isLoggedIn && !searched ? groups.filter(g => !(g.isMember || g.ownerId === currentUserId)) : groups)?.map((g) => (
            <div
              key={g.id}
              style={styles.card}
              onClick={() => handleCardClick(g)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick(g)}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                {g.book?.coverImageUrl && (
                  <img
                    src={g.book.coverImageUrl}
                    alt={g.book.title}
                    style={{ width: 80, minHeight: 110, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const }}>
                  <div style={{ ...styles.bookTitle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{g.book?.title || '제목 없음'}</div>
                  <div style={{ ...styles.groupName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: 2 }}>{g.name}</div>
                  <div style={{ height: 20, overflow: 'hidden', marginBottom: 2 }}>
                    {g.tags && g.tags.length > 0 && <GroupTags tags={g.tags} compact />}
                  </div>
                  <div style={{ height: 34, overflow: 'hidden', marginBottom: 4, fontSize: 13, color: '#718096', lineHeight: '17px' }}>
                    {g.description || '\u00A0'}
                  </div>
                  <div>
                  <div style={styles.meta}>
                    <div style={{ marginBottom: 6 }}>📅 독서 기간: {formatDate(g.readingStartDate)} ~ {formatDate(g.readingEndDate)}</div>
                    <div>
                    {g.ownerNickname && <span style={{ display: 'inline-block', background: '#edf2ff', color: '#4c51bf', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginRight: 6 }}>👤 {g.ownerNickname}</span>}
                    <span style={styles.members}>👥 {g.currentMembers}/{g.maxMembers}명</span>
                    {(g as any).isPrivate && <span style={{ display: 'inline-block', background: '#fefcbf', color: '#975a16', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginLeft: 6 }}>🔒 비공개</span>}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Join Modal */}
      {selectedGroup && (
        <GroupJoinModal
          group={selectedGroup}
          onClose={handleModalClose}
          onJoin={handleJoin}
          joining={joining}
          joinMsg={joinMsg}
        />
      )}
    </div>
  );
}

export default HomePage;
