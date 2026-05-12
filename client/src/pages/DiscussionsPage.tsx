import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { discussionsApi } from '../api/discussions';
import { groupsApi } from '../api/groups';
import { memosApi } from '../api/memos';
import { aiApi, type AiTopic } from '../api/ai';
import { useAuthStore } from '../stores/authStore';
import type { Discussion, Memo, RecommendedTopic, ApiError } from '../types';
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
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
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
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
    minHeight: 80,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 24px',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  discussionItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  discussionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#2d3748',
    marginBottom: 4,
  },
  discussionMeta: {
    fontSize: 12,
    color: '#a0aec0',
  },
  recommendedBadge: {
    display: 'inline-block',
    backgroundColor: '#fefcbf',
    color: '#975a16',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 500,
    marginLeft: 8,
  },
  recCard: {
    padding: '12px 16px',
    border: '1px dashed #3182ce',
    borderRadius: 6,
    marginBottom: 8,
    cursor: 'pointer',
    backgroundColor: '#ebf8ff',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#2b6cb0',
    marginBottom: 4,
  },
  recContent: {
    fontSize: 13,
    color: '#4a5568',
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    padding: '6px 14px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: '#3182ce',
    color: '#fff',
    borderColor: '#3182ce',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#a0aec0',
    fontSize: 14,
  },
  serverError: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  // 모달 스타일
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 640,
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a202c',
  },
  closeBtn: {
    padding: '6px 12px',
    fontSize: 20,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#718096',
    lineHeight: 1,
  },
  createBtn: {
    padding: '10px 20px',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
};

function DiscussionsPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [aiTopics, setAiTopics] = useState<AiTopic[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [myMemos, setMyMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMine, setFilterMine] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMemoId, setFormMemoId] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try {
      const token = accessToken;
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1] || ''));
      currentUserId = payload.userId || '';
    } catch { /* ignore */ }
  }

  const fetchData = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const params = filterMine && currentUserId ? { authorId: currentUserId } : undefined;
      const [discRes, recRes, memoRes] = await Promise.all([
        discussionsApi.listByGroup(groupId!, params),
        discussionsApi.getRecommendations(groupId!).catch(() => ({ data: [] as RecommendedTopic[] })),
        memosApi.listByGroup(groupId!).catch(() => ({ data: { myMemos: [] as Memo[], publicMemos: [] as Memo[] } })),
      ]);
      setDiscussions(discRes.data);
      setRecommendations(recRes.data);
      setMyMemos(memoRes.data.myMemos || []);

      // 방장 여부 확인
      if (currentUserId) {
        const groupRes = await groupsApi.getDetail(groupId!).catch(() => ({ data: null }));
        if (groupRes.data) {
          setIsOwner(groupRes.data.ownerId === currentUserId);
        }
      }
    } catch {
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, filterMine]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs: Record<string, string> = {};
<<<<<<< Updated upstream
    if (!formTitle.trim()) errs.title = '주제를 입력해주세요';
    if (!formEndDate) errs.endDate = '종료일을 입력해주세요';
=======
    if (!formTitle.trim()) errs.title = '제목을 입력해주세요';
    if (!formContent.trim()) errs.content = '내용을 입력해주세요';
>>>>>>> Stashed changes
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!groupId) return;

    setSubmitting(true);
    try {
      await discussionsApi.create(groupId!, {
        title: formTitle.trim(),
        content: formContent.trim(),
        memoId: formMemoId || undefined,
        endDate: formEndDate || undefined,
      });
      setFormTitle('');
      setFormContent('');
      setFormMemoId('');
      setFormEndDate('');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setServerError(axiosErr.response?.data?.error?.message || '스레드 생성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRecommendation = async (rec: RecommendedTopic) => {
    if (!groupId) return;
    try {
      await discussionsApi.create(groupId!, {
        title: rec.title,
        content: rec.content,
      });
      setShowCreateModal(false);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleAiSuggest = async () => {
    if (!groupId) return;
    setAiLoading(true);
    try {
      const res = await aiApi.suggestTopics(groupId);
      setAiTopics(res.data.topics || []);
    } catch {
      alert('AI 요청이 많아 일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectAiTopic = async (topic: AiTopic) => {
    if (!groupId) return;
    try {
      await discussionsApi.create(groupId, {
        title: topic.title,
        content: topic.content,
      });
      setAiTopics([]);
      setShowCreateModal(false);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowCreateModal(false);
    }
  };

  return (
    <div style={styles.container}>
      <Link to={`/groups/${groupId}`} style={styles.backLink}>← 모임으로</Link>
<<<<<<< Updated upstream
      <h1 style={styles.title}>📚 책수다</h1>

      {/* 헤더: 책수다 만들기 버튼 */}
=======
      <h1 style={styles.title}>💬 스레드</h1>

      {/* 헤더: 스레드 만들기 버튼 */}
>>>>>>> Stashed changes
      <div style={styles.headerRow}>
        {/* Filter */}
        <div style={styles.filterRow}>
          <button
            style={{ ...styles.filterBtn, ...(!filterMine ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterMine(false)}
          >
            전체
          </button>
          <button
            style={{ ...styles.filterBtn, ...(filterMine ? styles.filterBtnActive : {}) }}
            onClick={() => setFilterMine(true)}
          >
            내 작성
          </button>
        </div>
        <button style={styles.createBtn} onClick={() => setShowCreateModal(true)}>
<<<<<<< Updated upstream
          + 책수다 만들기
        </button>
      </div>

      {/* 📌 대표 수다 (고정) */}
      {discussions.filter((d: any) => d.isPinned).length > 0 && (
        <div style={{ ...styles.section, borderLeft: '4px solid #3182ce' }}>
          <div style={styles.sectionTitle}>📌 대표 수다</div>
          {discussions.filter((d: any) => d.isPinned).map((d) => (
=======
          + 스레드 만들기
        </button>
      </div>

      {/* Discussion List */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>스레드 목록</div>
        {loading ? (
          <div style={styles.emptyState}>불러오는 중...</div>
        ) : discussions.length === 0 ? (
          <div style={styles.emptyState}>스레드가 없습니다</div>
        ) : (
          discussions.map((d) => (
>>>>>>> Stashed changes
            <div
              key={d.id}
              style={styles.discussionItem}
              onClick={() => navigate(`/discussions/${d.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/discussions/${d.id}`)}
            >
              <div style={styles.discussionTitle}>
                {d.title}
                {(d as any).status === 'closed' && <span style={{ fontSize: 11, backgroundColor: '#fed7d7', color: '#c53030', padding: '2px 8px', borderRadius: 12, marginLeft: 8 }}>종료</span>}
              </div>
              <div style={styles.discussionMeta}>
                {d.authorNickname} · {(d as any).endDate && `~${new Date((d as any).endDate).toLocaleDateString()}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 진행중인 수다 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>🟢 진행중인 수다</div>
        {discussions.filter((d: any) => d.status !== 'closed').length === 0 ? (
          <div style={styles.emptyState}>진행중인 수다가 없습니다</div>
        ) : (
          discussions.filter((d: any) => d.status !== 'closed').map((d) => (
            <div
              key={d.id}
              style={styles.discussionItem}
              onClick={() => navigate(`/discussions/${d.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/discussions/${d.id}`)}
            >
              <div style={styles.discussionTitle}>
                {d.title}
                {(d as any).endDate && <span style={{ fontSize: 11, color: '#718096', marginLeft: 8 }}>~{new Date((d as any).endDate).toLocaleDateString()}</span>}
              </div>
              <div style={styles.discussionMeta}>
                {d.authorNickname} · {new Date(d.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

<<<<<<< Updated upstream
      {/* 종료된 수다 */}
      {discussions.filter((d: any) => d.status === 'closed').length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🔴 종료된 수다</div>
          {discussions.filter((d: any) => d.status === 'closed').map((d) => (
            <div
              key={d.id}
              style={{ ...styles.discussionItem, opacity: 0.6 }}
              onClick={() => navigate(`/discussions/${d.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/discussions/${d.id}`)}
            >
              <div style={styles.discussionTitle}>
                {d.title}
                <span style={{ fontSize: 11, backgroundColor: '#fed7d7', color: '#c53030', padding: '2px 8px', borderRadius: 12, marginLeft: 8 }}>종료</span>
              </div>
              <div style={styles.discussionMeta}>
                {d.authorNickname} · {new Date(d.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 책수다 만들기 모달 */}
=======
      {/* 스레드 만들기 모달 */}
>>>>>>> Stashed changes
      {showCreateModal && (
        <div style={styles.overlay} onClick={handleOverlayClick}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
<<<<<<< Updated upstream
              <div style={styles.modalTitle}>💬 책수다 만들기</div>
=======
              <div style={styles.modalTitle}>💬 스레드 만들기</div>
>>>>>>> Stashed changes
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)} aria-label="닫기">×</button>
            </div>

            {/* 직접 작성 폼 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...styles.sectionTitle, marginBottom: 12 }}>✏️ 직접 작성</div>
              <form onSubmit={handleSubmit} noValidate>
                {serverError && <div style={styles.serverError}>{serverError}</div>}

                <div style={styles.field}>
                  <label style={styles.label}>제목 *</label>
                  <input
                    type="text"
                    style={{ ...styles.input, ...(formErrors.title ? styles.inputError : {}) }}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
<<<<<<< Updated upstream
                    placeholder="주제를 입력해주세요"
=======
                    placeholder="제목을 입력해주세요"
>>>>>>> Stashed changes
                  />
                  {formErrors.title && <div style={styles.errorText}>{formErrors.title}</div>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>내용 *</label>
                  <textarea
                    style={styles.textarea}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
<<<<<<< Updated upstream
                    placeholder="주제에 대한 설명 (선택)"
=======
                    placeholder="내용을 입력해주세요"
>>>>>>> Stashed changes
                  />
                  {formErrors.content && <div style={styles.errorText}>{formErrors.content}</div>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>메모 연결 (선택)</label>
                  <select
                    style={styles.select}
                    value={formMemoId}
                    onChange={(e) => setFormMemoId(e.target.value)}
                  >
                    <option value="">메모를 선택하세요 (선택)</option>
                    {myMemos.map((m) => (
                      <option key={m.id} value={m.id}>
                        p.{m.pageStart}~{m.pageEnd}: {m.content.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>종료일 *</label>
                  <input
                    type="date"
                    style={{ ...styles.input, ...(formErrors.endDate ? styles.inputError : {}) }}
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                  {formErrors.endDate && <div style={styles.errorText}>{formErrors.endDate}</div>}
                </div>

                <button
                  type="submit"
                  style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
                  disabled={submitting}
                >
<<<<<<< Updated upstream
                  {submitting ? '생성 중...' : '책수다 만들기'}
=======
                  {submitting ? '생성 중...' : '스레드 만들기'}
>>>>>>> Stashed changes
                </button>
              </form>
            </div>

            {/* 구분선 */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />

            {/* AI 스레드 주제 제안 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={styles.sectionTitle}>🤖 AI 스레드 주제 제안</div>
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  style={{ ...styles.button, padding: '8px 16px', fontSize: 13, ...(aiLoading ? styles.buttonDisabled : {}) }}
                >
                  {aiLoading ? '생성 중...' : '🤖 AI 주제 생성'}
                </button>
              </div>
              {aiTopics.length > 0 && aiTopics.map((topic, i) => (
                <div
                  key={i}
                  style={{ ...styles.recCard, borderColor: '#805ad5', backgroundColor: '#faf5ff' }}
                  onClick={() => handleSelectAiTopic(topic)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectAiTopic(topic)}
                >
                  <div style={{ ...styles.recTitle, color: '#6b46c1' }}>🤖 {topic.title}</div>
                  <div style={styles.recContent}>{topic.content}</div>
                </div>
              ))}
              {aiTopics.length === 0 && !aiLoading && (
                <div style={styles.emptyState}>
                  버튼을 눌러 AI가 책과 메모 기반으로 스레드 주제를 제안합니다. 원하는 주제를 클릭하면 바로 스레드로 등록됩니다.
                </div>
              )}
            </div>

            {/* 추천 주제 */}
            {recommendations.length > 0 && (
              <div>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' }} />
                <div style={styles.sectionTitle}>✨ 추천 주제</div>
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    style={styles.recCard}
                    onClick={() => handleSelectRecommendation(rec)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectRecommendation(rec)}
                  >
                    <div style={styles.recTitle}>{rec.title}</div>
                    <div style={styles.recContent}>{rec.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscussionsPage;
