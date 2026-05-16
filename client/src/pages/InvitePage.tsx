import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useAuthStore } from '../stores/authStore';
import type { ApiError } from '../types';
import { AxiosError } from 'axios';

function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [groupId, setGroupId] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (!code) { setStatus('error'); setMessage('유효하지 않은 초대 링크입니다'); return; }
    if (!accessToken) { navigate(`/login?redirect=/invite/${code}`); return; }
    if (called.current) return;
    called.current = true;

    dashboardApi.joinByInviteCode(code)
      .then(({ data }) => {
        setStatus('success');
        setMessage(`"${data.groupName}" 모임에 참여했습니다!`);
        setGroupId(data.groupId);
      })
      .catch((err) => {
        const axiosErr = err as AxiosError<ApiError>;
        const errorCode = axiosErr.response?.data?.error?.code;
        if (errorCode === 'ALREADY_JOINED') {
          setStatus('success');
          setMessage('이미 참여 중인 모임입니다');
        } else {
          setStatus('error');
          setMessage(axiosErr.response?.data?.error?.message || '참여에 실패했습니다');
        }
      });
  }, [code, accessToken]);

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
      {status === 'loading' && <p style={{ color: '#718096' }}>참여 처리 중...</p>}
      {status === 'success' && (
        <>
          <h2 style={{ color: '#48bb78', marginBottom: 12 }}>✅ {message}</h2>
          {groupId && (
            <button onClick={() => navigate(`/groups/${groupId}`)} style={{ padding: '10px 24px', backgroundColor: '#4E342E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
              모임으로 이동
            </button>
          )}
          {!groupId && (
            <button onClick={() => navigate('/')} style={{ padding: '10px 24px', backgroundColor: '#edf2f7', color: '#333', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
              홈으로 이동
            </button>
          )}
        </>
      )}
      {status === 'error' && (
        <>
          <h2 style={{ color: '#e53e3e', marginBottom: 12 }}>❌ {message}</h2>
          <button onClick={() => navigate('/')} style={{ padding: '10px 24px', backgroundColor: '#edf2f7', color: '#333', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
            홈으로 이동
          </button>
        </>
      )}
    </div>
  );
}

export default InvitePage;
