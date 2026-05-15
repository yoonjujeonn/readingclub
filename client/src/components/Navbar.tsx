import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function Navbar() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();
  const isLoggedIn = !!accessToken;

  // 로그인/회원가입 페이지에서는 네비바 숨김
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#fff',
      borderBottom: '1px solid #f0f0f5',
      padding: '10px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 960,
      margin: '0 auto',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>📚</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#1a202c', letterSpacing: '-0.3px' }}>독서 토론</span>
      </Link>

      {isLoggedIn && (
        <Link to="/mypage" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#4a5568', fontSize: 14, fontWeight: 500 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          마이페이지
        </Link>
      )}
    </nav>
  );
}

export default Navbar;
