import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import type { NotificationItem } from '../types';

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
  },
  button: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 19,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 9,
    backgroundColor: '#e53e3e',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: '18px',
  },
  panel: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 340,
    maxWidth: 'calc(100vw - 32px)',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
    zIndex: 30,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderBottom: '1px solid #edf2f7',
    fontSize: 14,
    fontWeight: 700,
    color: '#2d3748',
  },
  item: {
    width: '100%',
    display: 'block',
    textAlign: 'left',
    padding: '11px 14px',
    border: 'none',
    borderBottom: '1px solid #f0f0f5',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  unreadItem: {
    backgroundColor: '#f7fbff',
  },
  group: {
    fontSize: 12,
    fontWeight: 700,
    color: '#667eea',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#2d3748',
    lineHeight: 1.45,
  },
  time: {
    fontSize: 11,
    color: '#a0aec0',
    marginTop: 5,
  },
  empty: {
    padding: '24px 14px',
    textAlign: 'center',
    fontSize: 13,
    color: '#a0aec0',
  },
  more: {
    width: '100%',
    border: 'none',
    backgroundColor: '#f7f8fc',
    color: '#4c51bf',
    fontSize: 20,
    fontWeight: 700,
    padding: '9px 0',
    cursor: 'pointer',
  },
};

const formatTime = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return date.toLocaleDateString();
};

function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsApi.list(7);
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setItems([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
      // 패널 열릴 때 모두 읽음 처리
      if (unreadCount > 0) {
        notificationsApi.markAllRead().then(() => {
          setUnreadCount(0);
          setItems(prev => prev.map(item => ({ ...item, isRead: true })));
        }).catch(() => {});
      }
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    await notificationsApi.markRead(item.id).catch(() => {});
    setOpen(false);
    navigate(item.linkUrl);
  };

  return (
    <div style={styles.wrap} ref={ref}>
      <button type="button" style={styles.button} onClick={handleToggle} aria-label="알림">
        {'\u{1F514}'}
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <span>알림</span>
            <span style={{ fontSize: 12, color: '#718096', fontWeight: 500 }}>최근 7개</span>
          </div>
          {items.length === 0 ? (
            <div style={styles.empty}>새 알림이 없습니다.</div>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                style={{ ...styles.item, ...(!item.isRead ? styles.unreadItem : {}) }}
                onClick={() => handleItemClick(item)}
              >
                <div style={styles.group}>[{item.groupName}]</div>
                <div style={styles.message}>{item.message}</div>
                <div style={styles.time}>{formatTime(item.createdAt)}</div>
              </button>
            ))
          )}
          <button type="button" style={styles.more} onClick={() => navigate('/notifications')} aria-label="전체 알림 보기">
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
