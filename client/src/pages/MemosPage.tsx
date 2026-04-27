import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { memosApi } from '../api/memos';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import type { Memo, ApiError, GroupDetail, MemoVisibility } from '../types';
import { AxiosError } from 'axios';

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#3182ce' },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
  section: { backgroundColor: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#2d3748' },
  field: { marginBottom: 14 },
  label: { display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 },
  input: { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const },
  inputError: { borderColor: '#e53e3e' },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4 },
  textarea: { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' as const, minHeight: 100, resize: 'vertical' as const, fontFamily: 'inherit' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  button: { width: '100%', padding: '10px 0', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  memoCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 12 },
  memoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  memoRange: { fontSize: 13, fontWeight: 600, color: '#3182ce' },
  memoContent: { fontSize: 14, color: '#4a5568', lineHeight: 1.6, marginBottom: 8 },
  memoMeta: { fontSize: 12, color: '#a0aec0' },
  actionBtn: { padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff', cursor: 'pointer', marginLeft: 4 },
  deleteBtn: { padding: '4px 10px', fontSize: 12, border: '1px solid #e53e3e', borderRadius: 4, backgroundColor: '#fff', color: '#e53e3e', cursor: 'pointer', marginLeft: 4 },
  hiddenMsg: { backgroundColor: '#fefcbf', color: '#975a16', padding: '12px 16px', borderRadius: 6, fontSize: 13, textAlign: 'center' as const },
  serverError: { backgroundColor: '#fff5f5', color: '#e53e3e', padding: '10px 12px', borderRadius: 4, fontSize: 14, marginBottom: 16, textAlign: 'center' as const },
  emptyState: { textAlign: 'center' as const, padding: '30px 20px', color: '#a0aec0', fontSize: 14 },
  visSelect: { padding: '6px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff', cursor: 'pointer', marginLeft: 4 },
};

const visibilityLabel = (v: MemoVisibility) => {
  switch (v) {
    case 'public': return '🔓 공개';
    case 'spoiler': return '⚠️ 스포일러';
    case 'private': default: return '🔒 비공개';
  }
};

const visibilityColor = (v: MemoVisibility) => {
  switch (v) {
    case 'public': return { bg: '#f0fff4', color: '#276749' };
    case 'spoiler': return { bg: '#fffbeb', color: '#92400e' };
    case 'private': default: return { bg: '#f7fafc', color: '#718096' };
  }
};

function MemosPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [myMemos, setMyMemos] = useState<Memo[]>([]);
  const [publicMemos, setPublicMemos] = useState<Memo[]>([]);
  const [spoilerMemos, setSpoilerMemos] = useState<Memo[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [pageStart, setPageStart] = useState('');
  const [pageEnd, setPageEnd] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<MemoVisibility>('private');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPageStart, setEditPageStart] = useState('');
  const [editPageEnd, setEditPageEnd] = useState('');

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
      currentUserId = payload.userId || '';
    } catch { /* ignore */ }
  }

  const fetchMemos = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [memoRes, groupRes] = await Promise.all([
        memosApi.listByGroup(groupId),
        groupsApi.getDetail(groupId).catch(() => ({ data: null })),
      ]);
      setMyMemos(memoRes.data.myMemos || []);
      setPublicMemos(memoRes.data.publicMemos || []);
      setSpoilerMemos(memoRes.data.spoilerMemos || []);
      if (groupRes.data) setGroupInfo(groupRes.data);
    } catch {
      setMyMemos([]);
      setPublicMemos([]);
      setSpoilerMemos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemos(); }, [groupId]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!pageStart || parseInt(pageStart) < 0) errs.pageStart = '시작 페이지를 입력해주세요';
    if (!pageEnd || parseInt(pageEnd) < 0) errs.pageEnd = '끝 페이지를 입력해주세요';
    if (pageStart && pageEnd && parseInt(pageEnd) < parseInt(pageStart)) errs.pageEnd = '끝 페이지는 시작 페이지 이상이어야 합니다';
    if (!content.trim()) errs.content = '메모 내용을 입력해주세요';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!groupId) return;

    setSubmitting(true);
    try {
      await memosApi.create(groupId, {
        pageStart: parseInt(pageStart),
        pageEnd: parseInt(pageEnd),
        content: content.trim(),
        visibility,
      });
      setPageStart('');
      setPageEnd('');
      setContent('');
      setVisibility('private');
      fetchMemos();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setServerError(axiosErr.response?.data?.error?.message || '메모 작성에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memoId: string) => {
    if (!confirm('메모를 삭제하시겠습니까?')) return;
    try { await memosApi.delete(memoId); fetchMemos(); } catch { /* ignore */ }
  };

  const handleChangeVisibility = async (memo: Memo, newVis: MemoVisibility) => {
    try {
      await memosApi.updateVisibility(memo.id, newVis);
      fetchMemos();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.error?.message;
      if (msg) alert(msg);
    }
  };

  const startEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditContent(memo.content);
    setEditPageStart(String(memo.pageStart));
    setEditPageEnd(String(memo.pageEnd));
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await memosApi.update(editingId, {
        pageStart: parseInt(editPageStart),
        pageEnd: parseInt(editPageEnd),
        content: editContent.trim(),
      });
      setEditingId(null);
      fetchMemos();
    } catch { /* ignore */ }
  };

  const renderMyMemo = (memo: Memo) => (
    <div key={memo.id} style={styles.memoCard}>
      {editingId === memo.id ? (
        <>
          <div style={styles.row}>
            <input type="number" style={styles.input} value={editPageStart} onChange={(e) => setEditPageStart(e.target.value)} />
            <input type="number" style={styles.input} value={editPageEnd} onChange={(e) => setEditPageEnd(e.target.value)} />
          </div>
          <textarea style={{ ...styles.textarea, marginTop: 8 }} value={editContent} onChange={(e) => setEditContent(e.target.value)} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button style={styles.actionBtn} onClick={handleUpdate}>저장</button>
            <button style={styles.actionBtn} onClick={() => setEditingId(null)}>취소</button>
          </div>
        </>
      ) : (
        <>
          <div style={styles.memoHeader}>
            <span style={styles.memoRange}>p.{memo.pageStart} ~ p.{memo.pageEnd}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <select
                style={styles.visSelect}
                value={memo.visibility || (memo.isPublic ? 'public' : 'private')}
                onChange={(e) => handleChangeVisibility(memo, e.target.value as MemoVisibility)}
              >
                <option value="private">🔒 비공개</option>
                <option value="public">🔓 공개</option>
                <option value="spoiler">⚠️ 스포일러</option>
              </select>
              <button style={styles.actionBtn} onClick={() => startEdit(memo)}>수정</button>
              <button style={styles.deleteBtn} onClick={() => handleDelete(memo.id)}>삭제</button>
            </div>
          </div>
          <div style={styles.memoContent}>{memo.content}</div>
          <div style={styles.memoMeta}>{new Date(memo.createdAt).toLocaleDateString()}</div>
        </>
      )}
    </div>
  );

  const renderOtherMemo = (memo: Memo) => {
    const vc = visibilityColor(memo.visibility || 'public');
    return (
      <div key={memo.id} style={styles.memoCard}>
        <div style={styles.memoHeader}>
          <span style={styles.memoRange}>p.{memo.pageStart} ~ p.{memo.pageEnd}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500, backgroundColor: vc.bg, color: vc.color }}>
              {visibilityLabel(memo.visibility || 'public')}
            </span>
            <span style={{ fontSize: 13, color: '#718096' }}>{memo.authorNickname}</span>
          </div>
        </div>
        {memo.isContentHidden ? (
          <div style={styles.hiddenMsg}>
            ⚠️ p.{memo.pageEnd}까지 읽은 후 열람할 수 있습니다
          </div>
        ) : (
          <div style={styles.memoContent}>{memo.content}</div>
        )}
        <div style={styles.memoMeta}>{new Date(memo.createdAt).toLocaleDateString()}</div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Link to={`/groups/${groupId}`} style={styles.backLink}>← 모임으로</Link>
      <h1 style={styles.title}>📝 메모</h1>

      {groupInfo && (
        <div style={{ backgroundColor: '#f7f8fc', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          {groupInfo.book?.coverImageUrl && (
            <img src={groupInfo.book.coverImageUrl} alt="" style={{ width: 40, height: 56, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a202c' }}>{groupInfo.book?.title}</div>
            <div style={{ fontSize: 13, color: '#718096' }}>{groupInfo.name}</div>
          </div>
        </div>
      )}

      {/* 메모 작성 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>메모 작성</div>
        <form onSubmit={handleSubmit} noValidate>
          {serverError && <div style={styles.serverError}>{serverError}</div>}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>시작 페이지</label>
              <input type="number" min="0" style={{ ...styles.input, ...(formErrors.pageStart ? styles.inputError : {}) }} value={pageStart} onChange={(e) => setPageStart(e.target.value)} placeholder="0" />
              {formErrors.pageStart && <div style={styles.errorText}>{formErrors.pageStart}</div>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>끝 페이지</label>
              <input type="number" min="0" style={{ ...styles.input, ...(formErrors.pageEnd ? styles.inputError : {}) }} value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} placeholder="0" />
              {formErrors.pageEnd && <div style={styles.errorText}>{formErrors.pageEnd}</div>}
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>내용</label>
            <textarea style={{ ...styles.textarea, ...(formErrors.content ? styles.inputError : {}) }} value={content} onChange={(e) => setContent(e.target.value)} placeholder="메모 내용을 입력해주세요" />
            {formErrors.content && <div style={styles.errorText}>{formErrors.content}</div>}
          </div>
          <div style={{ ...styles.field, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>공개 설정:</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as MemoVisibility)}
                style={{ padding: '6px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
              >
                <option value="private">🔒 비공개 (나만 보기)</option>
                <option value="public">🔓 공개 (모두 열람)</option>
                <option value="spoiler">⚠️ 스포일러 (해당 페이지 읽은 사람만)</option>
              </select>
            </div>
            <button type="submit" style={{ ...styles.button, width: 'auto', padding: '10px 24px', ...(submitting ? styles.buttonDisabled : {}) }} disabled={submitting}>
              {submitting ? '저장 중...' : '메모 저장'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div style={styles.emptyState}>불러오는 중...</div>
      ) : (
        <>
          {/* 내 메모 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>내 메모 ({myMemos.length})</div>
            {myMemos.length === 0 ? <div style={styles.emptyState}>작성한 메모가 없습니다</div> : myMemos.map(renderMyMemo)}
          </div>

          {/* 공개 메모 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>🔓 공개 메모 ({publicMemos.length})</div>
            {publicMemos.length === 0 ? <div style={styles.emptyState}>공개된 메모가 없습니다</div> : publicMemos.map(renderOtherMemo)}
          </div>

          {/* 스포일러 메모 */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>⚠️ 스포일러 메모 ({spoilerMemos.length})</div>
            {spoilerMemos.length === 0 ? (
              <div style={styles.emptyState}>스포일러 메모가 없습니다</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#92400e', backgroundColor: '#fffbeb', padding: '8px 12px', borderRadius: 4, marginBottom: 12 }}>
                  해당 페이지까지 읽어야 내용을 볼 수 있습니다
                </div>
                {spoilerMemos.map(renderOtherMemo)}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MemosPage;
