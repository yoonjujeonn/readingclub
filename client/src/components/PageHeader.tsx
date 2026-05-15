import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from './NotificationBell';

function PageHeader() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoggedIn = !!accessToken;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a202c' }}>📚 독서 모임</span>
      </Link>
      {isLoggedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <Link to="/mypage" style={{
            padding: '7px 16px',
            backgroundColor: '#f7f8fc',
            color: '#4a5568',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            border: '1px solid #e2e8f0',
          }}>
            마이페이지
          </Link>
        </div>
      )}
    </div>
  );
}

export default PageHeader;
