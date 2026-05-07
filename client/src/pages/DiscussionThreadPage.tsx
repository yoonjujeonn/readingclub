import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { discussionsApi } from '../api/discussions';
import { dashboardApi } from '../api/dashboard';
import { groupsApi } from '../api/groups';
import { useAuthStore } from '../stores/authStore';
import { aiApi } from '../api/ai';
import { Markdown } from '../components/Markdown';
import { timeAgo } from '../utils/timeAgo';
import type { Comment as CommentType, Discussion } from '../types';

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

  let currentUserId = user?.id || '';
  if (!currentUserId && accessToken) {
    try { currentUserId = JSON.parse(atob(accessToken.split('.')[1] || '')).userId || ''; } catch {}
  }

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reply forms
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // AI summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

      // Check if current user is group owner
      if (topicRes.data?.groupId) {
        const groupRes = await groupsApi.getDetail(topicRes.data.groupId).catch(() => ({ data: null }));
        if (groupRes.data) {
          setIsOwner(groupRes.data.ownerId === currentUserId);
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
    if (!newComment.trim() || !discussionId) return;
    setSubmittingComment(true);
    try {
      await discussionsApi.addComment(discussionId, newComment.trim());
      setNewComment('');
      fetchData();
    } catch { /* ignore */ }
    finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
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
    if (!confirm('이 의견을 삭제하시겠습니까?')) return;
    try {
      await dashboardApi.deleteComment(commentId);
      fetchData();
    } catch { /* ignore */ }
  };

  const handleDeleteReply = async (replyId: string) => {
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

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← 홈으로</Link>

      {/* Topic Header */}
      <div style={styles.topicSection}>
        <div style={styles.topicTitle}>
          {topic?.title || '토론 스레드'}
          {topic?.isRecommended && <span style={styles.recommendedBadge}>추천</span>}
        </div>
        {topic?.content && <div style={styles.topicContent}>{topic.content}</div>}
        <div style={styles.topicMeta}>
          {topic?.authorNickname || ''} · {topic?.createdAt ? timeAgo(topic.createdAt) : ''}
        </div>
        {(topic as any)?.memo && (
          <div style={styles.memoRef}>
            📝 연결된 메모: p.{(topic as any).memo.pageStart}~{(topic as any).memo.pageEnd} — {(topic as any).memo.content.slice(0, 80)}
          </div>
        )}
      </div>

      {/* Comments List */}
      <div style={styles.section}>
        <div style={styles.commentsHeader}>
          <div style={styles.sectionTitle}>의견 목록</div>
          {comments.length > 0 && (
            <button onClick={handleAiSummary} disabled={aiLoading} style={styles.aiButton}>
              {aiLoading ? '정리 중...' : '🤖 토론 정리'}
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
              <div style={styles.commentMeta}>
                {timeAgo(comment.createdAt)}
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
                {(isOwner || comment.authorId === currentUserId) && (
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
                        {(isOwner || reply.authorId === currentUserId) && (
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
      <div style={styles.section}>
        <div style={styles.sectionTitle}>의견 작성</div>
        <form onSubmit={handleAddComment}>
          <textarea
            style={styles.textarea}
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="의견을 작성해주세요"
          />
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
      </div>

    </div>
  );
}

export default DiscussionThreadPage;
