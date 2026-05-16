import { useState } from 'react';
import type { GroupCard } from '../types';
import GroupTags from './GroupTags';

interface GroupJoinModalProps {
  group: GroupCard;
  onClose: () => void;
  onJoin: (password?: string) => void;
  joining: boolean;
  joinMsg: string;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    color: '#a0aec0',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    lineHeight: 1,
  },
  body: {
    padding: '16px 24px 24px',
    flex: 1,
    overflowY: 'auto' as const,
    minHeight: 0,
  },
  bookInfo: {
    display: 'flex',
    gap: 14,
    marginBottom: 16,
  },
  coverImage: {
    width: 80,
    height: 112,
    objectFit: 'cover' as const,
    borderRadius: 6,
    flexShrink: 0,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#3D2E1E',
    marginBottom: 4,
    letterSpacing: '-0.3px',
  },
  bookAuthor: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#C8962E',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#5C4A32',
    lineHeight: 1.6,
    marginBottom: 16,
  },
  summaryBox: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
    maxHeight: '8.2em',
    overflowY: 'auto' as const,
    paddingRight: 4,
    marginBottom: 16,
  },
  meta: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 1.9,
    marginBottom: 16,
    padding: '12px 14px',
    backgroundColor: '#FDF8F0',
    borderRadius: 8,
  },
  members: {
    display: 'inline-block',
    background: '#FFF8E7',
    color: '#4E342E',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  footer: {
    padding: '0 24px 24px',
  },
  joinBtn: {
    width: '100%',
    padding: '14px 0',
    background: '#C8962E',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  joinBtnDisabled: {
    background: '#cbd5e0',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  privateRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: '12px 14px',
    fontSize: 14,
    border: '2px solid #E8DFD3',
    borderRadius: 10,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  privateJoinBtn: {
    padding: '12px 20px',
    background: '#C8962E',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  joinMsg: {
    textAlign: 'center' as const,
    fontSize: 13,
    color: '#718096',
    marginTop: 10,
  },
  privateBadge: {
    display: 'inline-block',
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 8,
  },
};

function GroupJoinModal({ group, onClose, onJoin, joining, joinMsg }: GroupJoinModalProps) {
  const [password, setPassword] = useState('');
  const isFull = group.currentMembers >= group.maxMembers;

  const formatDate = (d: string) => d?.slice(0, 10) || '';

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleJoinClick = () => {
    if (group.isPrivate) {
      onJoin(password);
    } else {
      onJoin();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="독서 모임 참여"
    >
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#3D2E1E' }}>
            모임 소개
            {group.isPrivate && <span style={styles.privateBadge}>🔒 비공개</span>}
          </div>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Book Info */}
          <div style={styles.bookInfo}>
            {group.book.coverImageUrl && (
              <img
                src={group.book.coverImageUrl}
                alt={group.book.title}
                style={styles.coverImage}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.bookTitle}>{group.book.title || '제목 없음'}</div>
              {group.book.author && <div style={styles.bookAuthor}>{group.book.author}</div>}
              <div style={styles.groupName}>{group.name}</div>
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <div style={styles.description}>{group.description}</div>
          )}

          <div style={{ marginBottom: group.tags?.length ? 16 : 0 }}>
            <GroupTags tags={group.tags} />
          </div>

          {/* Meta Info */}
          <div style={styles.meta}>
            📅 독서 기간: {formatDate(group.readingStartDate)} ~ {formatDate(group.readingEndDate)}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
              {group.ownerNickname && (
                <span style={{ display: 'inline-block', background: '#FFF8E7', color: '#4E342E', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  👤 {group.ownerNickname}
                </span>
              )}
              <span style={styles.members}>👥 {group.currentMembers}/{group.maxMembers}명</span>
            </div>
          </div>

          {/* Book Summary */}
          {group.book.summary && (
            <div style={styles.summaryBox}>
              {group.book.summary}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          {isFull ? (
            <button style={{ ...styles.joinBtn, ...styles.joinBtnDisabled }} disabled>
              모집 마감
            </button>
          ) : group.isPrivate ? (
            <div style={styles.privateRow}>
              <input
                type="password"
                style={styles.passwordInput}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password.trim()) {
                    e.stopPropagation();
                    handleJoinClick();
                  }
                }}
                autoFocus
              />
              <button
                style={{
                  ...styles.privateJoinBtn,
                  ...(joining || !password.trim() ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                }}
                onClick={handleJoinClick}
                disabled={joining || !password.trim()}
              >
                {joining ? '참여 중...' : '참여하기'}
              </button>
            </div>
          ) : (
            <button
              style={{ ...styles.joinBtn, ...(joining ? { opacity: 0.7 } : {}) }}
              onClick={handleJoinClick}
              disabled={joining}
            >
              {joining ? '참여 중...' : '참여하기'}
            </button>
          )}
          {joinMsg && <div style={styles.joinMsg}>{joinMsg}</div>}
        </div>
      </div>
    </div>
  );
}

export default GroupJoinModal;
