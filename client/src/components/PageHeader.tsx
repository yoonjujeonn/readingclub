import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from './NotificationBell';

interface PageHeaderProps {
  hideMypage?: boolean;
  hideNotification?: boolean;
}

function PageHeader({ hideMypage, hideNotification }: PageHeaderProps) {
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
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#3D2E1E' }}><img src="/favicon.svg" alt="" style={{ width: 24, height: 24, verticalAlign: 'middle', marginRight: 6 }} />버지페이지</span>
      </Link>
      {isLoggedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!hideNotification && <NotificationBell />}
          {!hideMypage && (
            <Link to="/mypage" style={{
              padding: '7px 16px',
              backgroundColor: '#FDF8F0',
              color: '#5C4A32',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid #E8DFD3',
            }}>
              마이페이지
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
