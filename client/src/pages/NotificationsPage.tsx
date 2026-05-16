import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../stores/authStore';
import type { NotificationItem } from '../types';

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
    color: '#C8962E',
    fontWeight: 500,
    textDecoration: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#3D2E1E',
  },
  readAll: {
    padding: '8px 14px',
    border: '1px solid #c3dafe',
    backgroundColor: '#fff',
    color: '#4E342E',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  list: {
    backgroundColor: '#fff',
    border: '1px solid #E8DFD3',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  item: {
    width: '100%',
    display: 'block',
    textAlign: 'left',
    border: 'none',
    borderBottom: '1px solid #E8DFD3',
    backgroundColor: '#fff',
    padding: '16px 18px',
    cursor: 'pointer',
  },
  unreadItem: {
    backgroundColor: '#f7fbff',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  group: {
    fontSize: 13,
    fontWeight: 700,
    color: '#C8962E',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#e53e3e',
    flexShrink: 0,
  },
  message: {
    fontSize: 14,
    color: '#3D2E1E',
    lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  time: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 8,
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#a0aec0',
    fontSize: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #E8DFD3',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#a0aec0',
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

function NotificationsPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.list();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [accessToken]);

  const handleReadAll = async () => {
    await notificationsApi.markAllRead();
    fetchNotifications();
  };

  const handleItemClick = async (item: NotificationItem) => {
    await notificationsApi.markRead(item.id).catch(() => {});
    if (!item.linkUrl) return;
    if (item.linkUrl.includes('#tokenRequests')) {
      const basePath = item.linkUrl.split('#')[0] ?? '';
      navigate(basePath, { state: { openTab: 'tokenRequests' } });
    } else {
      navigate(item.linkUrl);
    }
  };

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <Link to="/mypage" style={styles.backLink}>← 뒤로</Link>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>알림</div>
          <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
            읽지 않은 알림 {unreadCount}개
          </div>
        </div>
        <button type="button" style={styles.readAll} onClick={handleReadAll} disabled={unreadCount === 0}>
          모두 읽음
        </button>
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>아직 알림이 없습니다.</div>
      ) : (
        <div style={styles.list}>
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              style={{ ...styles.item, ...(!item.isRead ? styles.unreadItem : {}) }}
              onClick={() => handleItemClick(item)}
            >
              <div style={styles.topRow}>
                <div style={styles.group}>[{item.groupName}]</div>
                {!item.isRead && <span style={styles.unreadDot} />}
              </div>
              <div style={styles.message}>{item.message}</div>
              <div style={styles.time}>{formatTime(item.createdAt)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
