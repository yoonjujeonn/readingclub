import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { discussionsApi } from '../api/discussions';
import { dashboardApi } from '../api/dashboard';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import { aiApi } from '../api/ai';
import { showToast } from '../api/client';
import { Markdown } from '../components/Markdown';
import { InsightCard } from '../components/InsightCard';
import { timeAgo } from '../utils/timeAgo';
import { getReadingPeriodWriteBlockMessage, isOutsideReadingPeriod } from '../utils/readingPeriod';
import type { Comment as CommentType, Discussion } from '../types';

const MAX_COMMENT_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_COMMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const COMMENT_IMAGE_HELP_TEXT = '제한 용량: 5MB 지원 형식: JPG, PNG, GIF, WEBP';

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
  topicSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: '#2d3748',
  },
  topicContent: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  attachedImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 420,
    objectFit: 'contain' as const,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    marginTop: 12,
    marginBottom: 12,
  },
  topicMeta: {
    fontSize: 12,
    color: '#a0aec0',
  },
  memoRef: {
    backgroundColor: '#ebf8ff',
    padding: '10px 14px',
    borderRadius: 6,
    fontSize: 13,
    color: '#2b6cb0',
    marginTop: 12,
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
  commentCard: {
    padding: '16px 0',
    borderBottom: '1px solid #e2e8f0',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a202c',
    marginBottom: 6,
  },
  commentContent: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 1.7,
    marginBottom: 8,
    whiteSpace: 'pre-wrap' as const,
  },
  commentImage: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: 320,
    objectFit: 'contain' as const,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    marginBottom: 8,
  },
  commentMeta: {
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 8,
  },
  replySection: {
    marginLeft: 24,
    paddingLeft: 12,
    borderLeft: '2px solid #e2e8f0',
  },
  replyCard: {
    padding: '8px 0',
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4a5568',
    marginBottom: 2,
  },
  replyContent: {
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 1.5,
  },
  replyMeta: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 2,
  },
  formRow: {
    display: 'flex',
    gap: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    minHeight: 80,
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    resize: 'vertical' as const,
    lineHeight: 1.6,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    padding: '8px 16px',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  replyToggle: {
    fontSize: 12,
    color: '#3182ce',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  fileButton: {
    display: 'inline-block',
    padding: '7px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#3182ce',
    backgroundColor: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: 6,
    cursor: 'pointer',
  },
  helpText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 6,
  },
  imagePreview: {
    width: 120,
    height: 80,
    objectFit: 'cover' as const,
    borderRadius: 6,
    border: '1px solid #e2e8f0',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#a0aec0',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '30px 20px',
    color: '#a0aec0',
    fontSize: 14,
  },
  commentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiButton: {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: '#805ad5',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
  },
  aiSummaryResult: {
    backgroundColor: '#faf5ff',
    padding: '12px 16px',
    borderRadius: 6,
    marginBottom: 16,
    borderLeft: '3px solid #805ad5',
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
};

function DiscussionThreadPage() {
  const { id: discussionId } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [topic, setTopic] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [readOnlyMessage, setReadOnlyMessage] = useState('');

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try { currentUserId = JSON.parse(atob(accessToken.split('.')[1] || '')).userId || ''; } catch {}
  }

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [tokenRemaining, setTokenRemaining] = useState<number | null>(null);
  const [tokenRequested, setTokenRequested] = useState(false);

  // Reply forms
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // AI summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Thread insight (종료 시 자동 생성된 인사이트)
  const [threadInsight, setThreadInsight] = useState<any>(null);

  const fetchData = async () => {
    if (!discussionId) return;
    setLoading(true);
    try {
      const [topicRes, commentsRes] = await Promise.all([
        discussionsApi.getById(discussionId).catch(() => ({ data: null })),
        discussionsApi.getComments(discussionId),
      ]);
      setTopic(topicRes.data);
      setComments(commentsRes.data);

      // 발언권 조회
      if (discussionId) {
        const tokenRes = await discussionsApi.getTokens(discussionId).catch(() => ({ data: { remaining: 10, requested: false } }));
        setTokenRemaining(tokenRes.data.remaining);
        setTokenRequested(tokenRes.data.requested);
      }

      // Check if current user is group owner
      if (topicRes.data?.groupId) {
        const groupRes = await groupsApi.getDetail(topicRes.data.groupId).catch(() => ({ data: null }));
        if (groupRes.data) {
          setIsOwner(groupRes.data.ownerId === currentUserId);
          setIsReadOnly(isOutsideReadingPeriod(groupRes.data.readingStartDate, groupRes.data.readingEndDate));
          setReadOnlyMessage(getReadingPeriodWriteBlockMessage(groupRes.data.readingStartDate, groupRes.data.readingEndDate));
        }

        // 종료된 스레드면 인사이트 불러오기
        if (topicRes.data && (topicRes.data as any).status === 'closed' && topicRes.data.groupId) {
          const insightRes = await aiApi.getSavedInsight(topicRes.data.groupId).catch(() => ({ data: null }));
          if (insightRes.data) setThreadInsight(insightRes.data);
        }
      }
    } catch { /* ignore */ }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [discussionId]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast(readOnlyMessage || '독서기간 중에만 의견을 작성할 수 있습니다');
      return;
    }
    if (!newComment.trim() || !discussionId) return;
    setSubmittingComment(true);
    try {
      await discussionsApi.addComment(discussionId, newComment.trim(), commentImage);
      setNewComment('');
      setCommentImage(null);
      setCommentImagePreview('');
      fetchData();
    } catch { /* ignore */ }
    finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (isReadOnly) {
      showToast(readOnlyMessage || '독서기간 중에만 댓글을 작성할 수 있습니다');
      return;
    }
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      await discussionsApi.addReply(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
      fetchData();
    } catch { /* ignore */ }
    finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isReadOnly) {
      showToast(readOnlyMessage || '독서기간 중에만 삭제할 수 있습니다');
      return;
    }
    if (!confirm('이 의견을 삭제하시겠습니까?')) return;
    try {
      await dashboardApi.deleteComment(commentId);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (isReadOnly) {
      showToast(readOnlyMessage || '독서기간 중에만 삭제할 수 있습니다');
      return;
    }
    if (!confirm('이 답글을 삭제하시겠습니까?')) return;
    try {
      await dashboardApi.deleteReply(replyId);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleAiSummary = async () => {
    if (!discussionId) return;
    setAiLoading(true);
    try {
      const res = await aiApi.summarizeThread(discussionId);
      setAiSummary(res.data.summary);
    } catch {
      alert('AI 요청이 많아 일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_COMMENT_IMAGE_TYPES.includes(file.type)) {
      showToast('JPG, PNG, GIF, WEBP 형식의 이미지만 사용할 수 있습니다');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_COMMENT_IMAGE_SIZE) {
      showToast('댓글 이미지는 5MB 이하의 파일만 사용할 수 있습니다');
      e.target.value = '';
      return;
    }
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const clearCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview('');
  };

  return (
    <div style={styles.container}>
      <Link
        to={topic?.groupId ? `/groups/${topic.groupId}/discussions` : '/'}
        style={styles.backLink}
      >
        ← 목록으로
      </Link>

      {/* Topic Header */}
      <div style={styles.topicSection}>
        <div style={styles.topicTitle}>
          {topic?.title || '스레드'}
          {topic?.isRecommended && <span style={styles.recommendedBadge}>추천</span>}
        </div>
        {topic?.content && <div style={styles.topicContent}>{topic.content}</div>}
        {topic?.imageUrl && <img src={topic.imageUrl} alt="" style={styles.attachedImage} />}
        <div style={styles.topicMeta}>
          {topic?.authorNickname || ''} · {topic?.createdAt ? timeAgo(topic.createdAt) : ''}
        </div>
        {(topic as any)?.memo && (
          <div style={styles.memoRef}>
            📝 연결된 메모: p.{(topic as any).memo.pageStart}~{(topic as any).memo.pageEnd} — {(topic as any).memo.content.slice(0, 80)}
          </div>
        )}
      </div>

      {/* Thread Insight (종료된 스레드) */}
      {threadInsight && (topic as any)?.status === 'closed' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 인사이트</div>
          <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
            이 스레드가 종료되어 AI가 자동으로 생성한 인사이트입니다.
          </div>
          <InsightCard insight={threadInsight} />
        </div>
      )}

      {/* Comments List */}
      <div style={styles.section}>
        <div style={styles.commentsHeader}>
          <div style={styles.sectionTitle}>의견 목록</div>
          {comments.length > 0 && (
            <button onClick={handleAiSummary} disabled={aiLoading} style={styles.aiButton}>
              {aiLoading ? '정리 중...' : '🤖 스레드 정리'}
            </button>
          )}
        </div>
        {aiSummary && (
          <div style={styles.aiSummaryResult}>
            <Markdown content={aiSummary} />
          </div>
        )}
        {loading ? (
          <div style={styles.emptyState}>불러오는 중...</div>
        ) : comments.length === 0 ? (
          <div style={styles.emptyState}>아직 의견이 없습니다. 첫 의견을 남겨보세요!</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} style={styles.commentCard}>
              <div style={styles.commentAuthor}>{comment.authorNickname}</div>
              <div style={styles.commentContent}>{comment.content}</div>
              {comment.imageUrl && <img src={comment.imageUrl} alt="" style={styles.commentImage} />}
              <div style={styles.commentMeta}>
                {timeAgo(comment.createdAt)}
                {!isReadOnly && (
                  <>
                    {' · '}
                    <button
                      style={styles.replyToggle}
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyContent('');
                      }}
                    >
                      {replyingTo === comment.id ? '취소' : '댓글 달기'}
                    </button>
                  </>
                )}
                {!isReadOnly && (isOwner || comment.authorId === currentUserId) && (
                  <>
                    {' · '}
                    <button style={{ ...styles.replyToggle, color: '#e53e3e' }} onClick={() => handleDeleteComment(comment.id)}>삭제</button>
                  </>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div style={{ ...styles.formRow, marginLeft: 24 }}>
                  <input
                    type="text"
                    style={styles.input}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="댓글을 작성해주세요"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReply(comment.id))}
                  />
                  <button
                    style={styles.submitBtn}
                    onClick={() => handleAddReply(comment.id)}
                    disabled={submittingReply}
                  >
                    {submittingReply ? '...' : '댓글'}
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={styles.replySection}>
                  {comment.replies.map((reply) => (
                    <div key={reply.id} style={styles.replyCard}>
                      <div style={styles.replyAuthor}>{reply.authorNickname}</div>
                      <div style={styles.replyContent}>{reply.content}</div>
                      <div style={styles.replyMeta}>
                        {timeAgo(reply.createdAt)}
                        {!isReadOnly && (isOwner || reply.authorId === currentUserId) && (
                          <>
                            {' · '}
                            <button style={{ ...styles.replyToggle, color: '#e53e3e', fontSize: 11 }} onClick={() => handleDeleteReply(reply.id)}>삭제</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment */}
      {isReadOnly ? (
        <div style={{ ...styles.section, backgroundColor: '#f7f8fc', textAlign: 'center' as const }}>
          <div style={{ color: '#4a5568', fontSize: 14, fontWeight: 500 }}>{readOnlyMessage || '독서기간 중에만 작성할 수 있습니다'}</div>
        </div>
      ) : (topic as any)?.status === 'closed' ? (
        <div style={{ ...styles.section, backgroundColor: '#fff5f5', textAlign: 'center' as const }}>
          <div style={{ color: '#c53030', fontSize: 14, fontWeight: 500 }}>🔴 이 스레드는 종료되었습니다. 의견 작성이 불가능합니다.</div>
        </div>
      ) : (
        <div style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={styles.sectionTitle}>의견 작성</div>
            {!isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: tokenRemaining && tokenRemaining > 3 ? '#48bb78' : '#e53e3e' }}>
                🎫 내 발언권: {tokenRemaining ?? '...'}개
                <span style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
                  onMouseEnter={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'block'; }}
                  onMouseLeave={e => { const tip = e.currentTarget.querySelector('[data-tip]') as HTMLElement; if (tip) tip.style.display = 'none'; }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#4a5568', fontSize: 11, fontWeight: 700 }}>?</span>
                  <span data-tip="" style={{ display: 'none', position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2d3748', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 }}>
                    의견/댓글 작성 시 발언권이 차감되며,<br/>삭제해도 돌려받을 수 없으니 신중하게 작성해주세요!
                  </span>
                </span>
                {tokenRemaining !== null && tokenRemaining <= 0 && !tokenRequested && (
                  <button
                    style={{ marginLeft: 6, padding: '2px 8px', fontSize: 11, border: '1px solid #3182ce', borderRadius: 4, backgroundColor: '#fff', color: '#3182ce', cursor: 'pointer' }}
                    onClick={async () => {
                      try {
                        await discussionsApi.requestTokens(discussionId!);
                        setTokenRequested(true);
                        alert('발언권 추가를 요청했습니다.');
                      } catch { alert('이미 요청했습니다.'); }
                    }}
                  >
                    추가 요청
                  </button>
                )}
                {tokenRequested && <span style={{ marginLeft: 4, fontSize: 11, color: '#718096' }}>(요청됨)</span>}
              </div>
            )}
          </div>
          {!isOwner && tokenRemaining !== null && tokenRemaining <= 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: '#e53e3e', fontSize: 13 }}>
              발언권이 부족합니다. 모임장에게 추가 요청하세요.
            </div>
          ) : (
            <form onSubmit={handleAddComment}>
              <textarea
                style={styles.textarea}
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="의견을 작성해주세요"
              />
              <div style={{ marginTop: 8 }}>
                <label style={styles.fileButton}>
                  {commentImage ? '다른 이미지 선택' : '이미지 선택'}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleCommentImageChange} style={{ display: 'none' }} />
                </label>
                <div style={styles.helpText}>{COMMENT_IMAGE_HELP_TEXT}</div>
                {commentImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    {commentImagePreview && <img src={commentImagePreview} alt="" style={styles.imagePreview} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#4a5568', wordBreak: 'break-all' }}>{commentImage.name}</div>
                      <button type="button" onClick={clearCommentImage} style={{ ...styles.replyToggle, color: '#e53e3e', marginTop: 4 }}>삭제</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={submittingComment}
                >
                  {submittingComment ? '작성 중...' : '의견 작성'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}

export default DiscussionThreadPage;
