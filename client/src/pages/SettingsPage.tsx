import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { mypageApi } from '../api/mypage';
import type { User } from '../types';

function SettingsPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    mypageApi.getProfile().then((res) => setProfile(res.data)).catch(() => {});
  }, [accessToken]);

  return (
    <div style={s.container}>
      <Link to="/mypage" style={s.backLink}>← 마이페이지</Link>
      <h1 style={s.title}>⚙️ 설정</h1>

      <div style={s.section}>
        <div style={s.groupTitle}>계정</div>
        <div style={s.item}>
          <span>이메일</span>
          <span style={{ color: '#718096' }}>{profile?.email || '—'}</span>
        </div>
        <div style={s.item}>
          <span>닉네임</span>
          <span style={{ color: '#718096' }}>{profile?.nickname || '—'}</span>
        </div>
        <div style={{ ...s.item, cursor: 'pointer', color: '#667eea' }}>
          비밀번호 변경
        </div>
      </div>

      <div style={s.section}>
        <div style={s.groupTitle}>개인정보</div>
        <div style={{ ...s.item, cursor: 'pointer', color: '#e53e3e', borderBottom: 'none' }}>
          회원 탈퇴
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#667eea', fontWeight: 500, textDecoration: 'none' },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 24, color: '#1a202c', letterSpacing: '-0.3px' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f5', marginBottom: 16 },
  groupTitle: { fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 12 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f7f8fc', fontSize: 14, color: '#2d3748' },
};

export default SettingsPage;
