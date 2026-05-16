import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { dashboardApi, type Announcement } from '../api/dashboard';
import { groupsApi } from '../api/groups';
import { discussionsApi } from '../api/discussions';
import { useAuthStore } from '../stores/authStore';
import type { GroupDetail, Discussion } from '../types';

const tabs = [
  { id: 'threads', label: '📚 스레드 관리' },
  { id: 'announcements', label: '📢 공지사항' },
  { id: 'members', label: '👥 멤버 관리' },
  { id: 'invite', label: '🔗 초대 링크' },
] as const;

type TabId = typeof tabs[number]['id'];

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#C8962E' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  tabBar: { display: 'flex', gap: 0, borderBottom: '2px solid #E8DFD3', marginBottom: 20 },
  tab: { padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', color: '#718096', borderBottom: '2px solid transparent', marginBottom: -2 },
  tabActive: { color: '#C8962E', borderBottomColor: '#C8962E', fontWeight: 600 },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#3D2E1E' },
  btn: { padding: '8px 16px', fontSize: 13, border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 },
  btnPrimary: { backgroundColor: '#4E342E', color: '#fff' },
  btnDanger: { backgroundColor: '#e53e3e', color: '#fff' },
  btnSecondary: { backgroundColor: '#edf2f7', color: '#333' },
  input: { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, marginBottom: 8 },
  textarea: { width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, minHeight: 80, fontFamily: 'inherit', marginBottom: 8 },
  memberItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 },
  annItem: { padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  inviteBox: { backgroundColor: '#f7fafc', padding: '12px 16px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' as const },
  calCell: { padding: '8px 4px', fontSize: 12, borderRadius: 4, minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

function DashboardPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const stateTab = (location.state as any)?.openTab;
  const hash = location.hash.replace('#', '');
  const resolvedTab = stateTab || hash;
  const [activeTab, setActiveTab] = useState<TabId>(resolvedTab === 'tokenRequests' ? 'threads' : (tabs.some(t => t.id === resolvedTab) ? resolvedTab as TabId : 'threads'));

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<Discussion[]>([]);
  const [editingEndDateId, setEditingEndDateId] = useState<string | null>(null);
  const [editingEndDateValue, setEditingEndDateValue] = useState('');
  const [threadMgmtTab, setThreadMgmtTab] = useState<'active' | 'closed' | 'tokenRequests'>(resolvedTab === 'tokenRequests' ? 'tokenRequests' : 'active');
  const [threadMgmtSort, setThreadMgmtSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [threadMgmtClosedSort, setThreadMgmtClosedSort] = useState<'newest' | 'oldest' | 'popular'>('popular');
  const [threadMgmtPage, setThreadMgmtPage] = useState(1);
  const [requestedThreads, setRequestedThreads] = useState<any[]>([]);
  const MGMT_PAGE_SIZE = 5;
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [copied, setCopied] = useState(false);

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try { currentUserId = JSON.parse(atob(accessToken.split('.')[1] || '')).userId || ''; } catch {}
  }

  const fetchAll = async () => {
    if (!groupId) return;
    try {
      const [gRes, invRes, annRes, threadsRes] = await Promise.all([
        groupsApi.getDetail(groupId),
        dashboardApi.getInviteCode(groupId).catch(() => ({ data: { inviteCode: null, expiresAt: null } })),
        dashboardApi.listAnnouncements(groupId).catch(() => ({ data: [] })),
        discussionsApi.listByGroup(groupId).catch(() => ({ data: [] })),
      ]);
      setGroup(gRes.data);
      setInviteCode(invRes.data.inviteCode);
      setInviteExpiresAt(invRes.data.expiresAt || null);
      setAnnouncements(annRes.data);
      setThreads(threadsRes.data);

      // 발언권 요청 스레드 조회
      if (groupId) {
        const reqThreadsRes = await discussionsApi.getRequestedThreads(groupId).catch(() => ({ data: [] }));
        setRequestedThreads(reqThreadsRes.data);
      }
    } catch {}
  };

  useEffect(() => { fetchAll(); }, [groupId]);

  // URL hash 또는 state 변경 시 탭 동기화
  useEffect(() => {
    const tab = (location.state as any)?.openTab || location.hash.replace('#', '');
    if (tab === 'tokenRequests') {
      setActiveTab('threads');
      setThreadMgmtTab('tokenRequests');
    } else if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }, [location]);

  const handleGenerateInvite = async () => {
    if (!groupId) return;
    const { data } = await dashboardApi.generateInviteCode(groupId);
    setInviteCode(data.inviteCode);
    setInviteExpiresAt(data.expiresAt || null);
    setCopied(false);
  };

  const copyInviteLink = () => {
    if (!inviteCode) return;
    const link = `${window.location.origin}/invite/${inviteCode}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [kickTarget, setKickTarget] = useState<{ userId: string; nickname: string } | null>(null);
  const [kickInput, setKickInput] = useState('');

  const handleRemoveMember = async (userId: string, nickname: string) => {
    setKickTarget({ userId, nickname });
    setKickInput('');
  };

  const confirmKick = async () => {
    if (!groupId || !kickTarget) return;
    if (kickInput !== '강제 퇴장') {
      alert('입력이 일치하지 않습니다.');
      return;
    }
    await dashboardApi.removeMember(groupId, kickTarget.userId);
    setKickTarget(null);
    setKickInput('');
    fetchAll();
  };

  const handleCreateAnnouncement = async () => {
    if (!groupId || !newAnnTitle.trim() || !newAnnContent.trim()) return;
    await dashboardApi.createAnnouncement(groupId, { title: newAnnTitle.trim(), content: newAnnContent.trim() });
    setNewAnnTitle(''); setNewAnnContent(''); fetchAll();
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!groupId || !confirm('공지사항을 삭제하시겠습니까?')) return;
    await dashboardApi.deleteAnnouncement(groupId, annId); fetchAll();
  };

  const handleUpdateEndDate = async (discussionId: string) => {
    setEditingEndDateId(discussionId);
    const thread = threads.find((t: any) => t.id === discussionId);
    setEditingEndDateValue(thread?.endDate ? new Date(thread.endDate).toISOString().slice(0, 10) : '');
  };

  const handleSaveEndDate = async () => {
    if (!editingEndDateId || !editingEndDateValue) return;
    try {
      await discussionsApi.updateEndDate(editingEndDateId, editingEndDateValue);
      setEditingEndDateId(null);
      setEditingEndDateValue('');
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '종료일 수정에 실패했습니다');
    }
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handlePinThread = async (discussionId: string) => {
    try {
      await discussionsApi.pinThread(discussionId);
      fetchAll();
    } catch (err: any) {
      setAlertMessage(err.response?.data?.error?.message || '대표 설정에 실패했습니다');
    }
  };

  const handleUnpinThread = async (discussionId: string) => {
    try {
      await discussionsApi.unpinThread(discussionId);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '대표 해제에 실패했습니다');
    }
  };

  const handleGrantTokens = async (discussionId: string, userId: string) => {
    try {
      await discussionsApi.grantTokens(discussionId, userId, 5);
      alert('발언권 5개를 지급했습니다');
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '지급에 실패했습니다');
    }
  };

  if (!group) return <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>불러오는 중...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'invite':
        return (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🔗 초대 링크</div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>초대 링크를 생성하여 새 멤버를 모임에 초대합니다. 링크는 생성 후 30분간 유효합니다.</div>
            {inviteCode ? (
              <div>
                <div style={styles.inviteBox}>
                  <code style={{ flex: 1, fontSize: 13, wordBreak: 'break-all' }}>{window.location.origin}/invite/{inviteCode}</code>
                  <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={copyInviteLink}>{copied ? '복사됨!' : '복사'}</button>
                  <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handleGenerateInvite}>재생성</button>
                </div>
                {inviteExpiresAt && (
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>
                    ⏰ 만료: {new Date(inviteExpiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleGenerateInvite}>초대 링크 생성</button>
            )}
          </div>
        );

      case 'announcements':
        return (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📢 공지사항</div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>모임 참여자 전체에게 보이는 공지를 작성합니다.</div>
            <input style={styles.input} placeholder="제목" value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)} />
            <textarea style={styles.textarea} placeholder="내용" value={newAnnContent} onChange={e => setNewAnnContent(e.target.value)} />
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleCreateAnnouncement}>공지 작성</button>
            <div style={{ marginTop: 16 }}>
              {announcements.length === 0 ? <div style={{ color: '#a0aec0', fontSize: 13 }}>공지사항이 없습니다</div> : announcements.map(ann => (
                <div key={ann.id} style={styles.annItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{ann.title}</strong>
                    <button style={{ ...styles.btn, ...styles.btnDanger, padding: '4px 10px', fontSize: 11 }} onClick={() => handleDeleteAnnouncement(ann.id)}>삭제</button>
                  </div>
                  <div style={{ fontSize: 13, color: '#5C4A32', marginTop: 4 }}>{ann.content}</div>
                  <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 4 }}>{new Date(ann.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'members':
        return (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👥 멤버 관리</div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>부적절한 멤버를 강제 퇴장시킬 수 있습니다. 퇴장된 멤버는 재참여가 불가능합니다.</div>
            {group.members.filter(m => m.role !== 'owner').map(m => (
              <div key={m.id} style={styles.memberItem}>
                <span>{m.nickname}</span>
                <button style={{ ...styles.btn, ...styles.btnDanger, padding: '4px 10px', fontSize: 11 }} onClick={() => handleRemoveMember(m.userId, m.nickname)}>강퇴</button>
              </div>
            ))}
            {group.members.filter(m => m.role !== 'owner').length === 0 && <div style={{ color: '#a0aec0', fontSize: 13 }}>멤버가 없습니다</div>}
          </div>
        );

      case 'threads':
        const currentMgmtSort = threadMgmtTab === 'active' ? threadMgmtSort : threadMgmtClosedSort;
        const mgmtFiltered = threads.filter((d: any) => threadMgmtTab === 'active' ? d.status !== 'closed' : d.status === 'closed');
        const mgmtSorted = [...mgmtFiltered].sort((a: any, b: any) => {
          if (currentMgmtSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (currentMgmtSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return (b.commentCount || 0) - (a.commentCount || 0);
        });
        const mgmtTotalPages = Math.ceil(mgmtSorted.length / MGMT_PAGE_SIZE);
        const mgmtPaged = mgmtSorted.slice((threadMgmtPage - 1) * MGMT_PAGE_SIZE, threadMgmtPage * MGMT_PAGE_SIZE);

        return (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>📚 스레드 관리</div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>스레드 종료일 수정, 대표 스레드 설정/해제, 발언권 관리를 합니다.</div>

            {/* 진행중/종료/발언권 요청 탭 */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E8DFD3', marginBottom: 12 }}>
              <button
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: threadMgmtTab === 'active' ? 600 : 400, cursor: 'pointer', border: 'none', background: 'none', color: threadMgmtTab === 'active' ? '#C8962E' : '#718096', borderBottom: threadMgmtTab === 'active' ? '2px solid #C8962E' : '2px solid transparent', marginBottom: -2 }}
                onClick={() => { setThreadMgmtTab('active'); setThreadMgmtPage(1); }}
              >🟢 진행중</button>
              <button
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: threadMgmtTab === 'closed' ? 600 : 400, cursor: 'pointer', border: 'none', background: 'none', color: threadMgmtTab === 'closed' ? '#e53e3e' : '#718096', borderBottom: threadMgmtTab === 'closed' ? '2px solid #e53e3e' : '2px solid transparent', marginBottom: -2 }}
                onClick={() => { setThreadMgmtTab('closed'); setThreadMgmtPage(1); }}
              >🔴 종료</button>
              <button
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: threadMgmtTab === 'tokenRequests' ? 600 : 400, cursor: 'pointer', border: 'none', background: 'none', color: threadMgmtTab === 'tokenRequests' ? '#d69e2e' : '#718096', borderBottom: threadMgmtTab === 'tokenRequests' ? '2px solid #d69e2e' : '2px solid transparent', marginBottom: -2 }}
                onClick={() => setThreadMgmtTab('tokenRequests')}
              >🎫 발언권 요청 {requestedThreads.length > 0 && `(${requestedThreads.length})`}</button>
            </div>

            {/* 발언권 요청 탭 콘텐츠 */}
            {threadMgmtTab === 'tokenRequests' ? (
              <div>
                {requestedThreads.length === 0 ? (
                  <div style={{ color: '#a0aec0', fontSize: 13 }}>발언권 요청이 없습니다</div>
                ) : requestedThreads.map((item: any) => (
                  <div key={item.discussion.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#3D2E1E', marginBottom: 8 }}>
                      {item.discussion.title}
                      {item.discussion.status === 'closed' && <span style={{ fontSize: 11, backgroundColor: '#fed7d7', color: '#c53030', padding: '2px 6px', borderRadius: 10, marginLeft: 6 }}>종료</span>}
                    </div>
                    {item.requests.map((req: any) => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 4px 12px', fontSize: 13 }}>
                        <span>{req.nickname} (남은 발언권: {req.remaining})</span>
                        <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '2px 8px', fontSize: 11 }} onClick={() => handleGrantTokens(item.discussion.id, req.userId)}>+5 지급</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
            <>
            {/* 정렬 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <select
                style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4 }}
                value={currentMgmtSort}
                onChange={e => {
                  const v = e.target.value as 'newest' | 'oldest' | 'popular';
                  if (threadMgmtTab === 'active') setThreadMgmtSort(v);
                  else setThreadMgmtClosedSort(v);
                  setThreadMgmtPage(1);
                }}
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="popular">답글 많은순</option>
              </select>
            </div>

            {mgmtSorted.length === 0 ? (
              <div style={{ color: '#a0aec0', fontSize: 13 }}>{threadMgmtTab === 'active' ? '진행중인 스레드가 없습니다' : '종료된 스레드가 없습니다'}</div>
            ) : (
              <>
                {mgmtPaged.map((d: any) => (
                  <div key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#3D2E1E' }}>
                          {d.title}
                          {d.isPinned && <span style={{ fontSize: 11, backgroundColor: '#FFF8E7', color: '#C8962E', padding: '2px 6px', borderRadius: 10, marginLeft: 6 }}>대표</span>}
                          {d.status === 'closed' && <span style={{ fontSize: 11, backgroundColor: '#fed7d7', color: '#c53030', padding: '2px 6px', borderRadius: 10, marginLeft: 6 }}>종료</span>}
                          {d.commentCount > 0 && <span style={{ fontSize: 11, color: '#a0aec0', marginLeft: 6 }}>💬 {d.commentCount}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>
                          종료일: {d.endDate ? new Date(d.endDate).toLocaleDateString() : '없음'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => handleUpdateEndDate(d.id)}>종료일 수정</button>
                        {d.isPinned ? (
                          <button style={{ ...styles.btn, ...styles.btnSecondary, padding: '4px 8px', fontSize: 11 }} onClick={() => handleUnpinThread(d.id)}>대표 해제</button>
                        ) : (
                          <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '4px 8px', fontSize: 11 }} onClick={() => handlePinThread(d.id)}>대표 설정</button>
                        )}
    
                      </div>
                    </div>
                    {editingEndDateId === d.id && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="date" style={{ ...styles.input, marginBottom: 0, flex: 1 }} value={editingEndDateValue} onChange={e => setEditingEndDateValue(e.target.value)} />
                        <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '6px 12px', fontSize: 12 }} onClick={handleSaveEndDate}>저장</button>
                        <button style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 12px', fontSize: 12 }} onClick={() => setEditingEndDateId(null)}>취소</button>
                      </div>
                    )}
                  </div>
                ))}

                {/* 페이지네이션 */}
                {mgmtTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    {Array.from({ length: mgmtTotalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, backgroundColor: p === threadMgmtPage ? '#C8962E' : '#fff', color: p === threadMgmtPage ? '#fff' : '#333', cursor: 'pointer' }}
                        onClick={() => setThreadMgmtPage(p)}
                      >{p}</button>
                    ))}
                  </div>
                )}
              </>
            )}
            </>
            )}
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <Link to={`/groups/${groupId}`} style={styles.backLink}>← 모임으로</Link>
      <h1 style={styles.title}>🛠️ 모임장 대시보드</h1>

      {/* 탭 바 */}
      <div style={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {renderTabContent()}

      {/* 강퇴 확인 모달 */}
      {kickTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setKickTarget(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 400, maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e53e3e', marginBottom: 12 }}>⚠️ 멤버 강제 퇴장</div>
            <div style={{ fontSize: 14, color: '#5C4A32', lineHeight: 1.6, marginBottom: 16 }}>
              퇴장된 멤버는 모임 재참여가 불가능합니다.<br/>
              정말로 <strong>{kickTarget.nickname}</strong>님을 강제 퇴장시키겠습니까?
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>진행하려면 <strong>"강제 퇴장"</strong>을 입력하세요.</div>
            <input
              type="text"
              style={{ ...styles.input, marginBottom: 16 }}
              value={kickInput}
              onChange={e => setKickInput(e.target.value)}
              placeholder="강제 퇴장"
              onKeyDown={e => e.key === 'Enter' && confirmKick()}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setKickTarget(null)}>취소</button>
              <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={confirmKick}>진행</button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {alertMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setAlertMessage(null)}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, width: 380, maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 15, color: '#3D2E1E', lineHeight: 1.6, marginBottom: 20 }}>{alertMessage}</div>
            <button style={{ ...styles.btn, ...styles.btnPrimary, padding: '8px 24px' }} onClick={() => setAlertMessage(null)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
