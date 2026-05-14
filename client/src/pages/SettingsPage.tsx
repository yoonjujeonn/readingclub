import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { mypageApi } from '../api/mypage';
import { showToast } from '../api/client';
import type { User } from '../types';

const MAX_PROFILE_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PROFILE_IMAGE_HELP_TEXT = '제한 용량: 1MB 지원 형식: JPG, PNG, GIF, WEBP';

function SettingsPage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<User | null>(null);

  // 프로필 이미지
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSaving, setImageSaving] = useState(false);

  // 닉네임
  const [editingNickname, setEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameError, setNicknameError] = useState('');

  // 비밀번호
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    if (!accessToken) { navigate('/login'); return; }
    mypageApi.getProfile().then((res) => {
      setProfile(res.data);
      setImagePreview((res.data as any).profileImageUrl || '');
    }).catch(() => {});
  }, [accessToken]);

  // 프로필 이미지 저장
  const handleSaveImage = async () => {
    if (!imageFile) return;
    setImageSaving(true);
    try {
      const res = await mypageApi.updateProfileImage(imageFile);
      setProfile(res.data);
      setImagePreview((res.data as any).profileImageUrl || '');
      setImageFile(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '프로필 이미지 변경에 실패했습니다');
    }
    finally { setImageSaving(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) {
        showToast('JPG, PNG, GIF, WEBP 형식의 이미지만 사용할 수 있습니다');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        showToast('프로필 이미지는 1MB 이하의 파일만 사용할 수 있습니다');
        e.target.value = '';
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 닉네임 중복확인
  const handleCheckNickname = async () => {
    if (!newNickname.trim()) { setNicknameError('닉네임을 입력해주세요'); return; }
    setNicknameError('');
    try {
      const res = await mypageApi.checkNickname(newNickname);
      setNicknameAvailable(res.data.available);
      if (!res.data.available) setNicknameError('이미 사용 중인 닉네임입니다');
    } catch { setNicknameError('확인 중 오류 발생'); }
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (!nicknameAvailable) return;
    try {
      const res = await mypageApi.updateNickname(newNickname);
      setProfile(res.data);
      setEditingNickname(false);
      setNicknameAvailable(null);
    } catch { setNicknameError('변경 실패'); }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess('');
    if (!currentPw || !newPw) { setPwError('모든 필드를 입력해주세요'); return; }
    if (newPw.length < 8) { setPwError('새 비밀번호는 8자 이상이어야 합니다'); return; }
    try {
      await mypageApi.changePassword(currentPw, newPw);
      setPwSuccess('비밀번호가 변경되었습니다');
      setCurrentPw(''); setNewPw('');
      setTimeout(() => setShowPwForm(false), 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.error?.message || '변경 실패');
    }
  };

  // 회원탈퇴
  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('탈퇴하면 모든 활동 기록이 비활성화됩니다. 계속하시겠습니까?')) return;
    try {
      await mypageApi.deleteAccount();
      logout();
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || '탈퇴 실패');
    }
  };

  return (
    <div style={st.container}>
      <Link to="/mypage" style={st.backLink}>← 마이페이지</Link>
      <h1 style={st.title}>⚙️ 설정</h1>

      {/* 프로필 이미지 */}
      <div style={st.section}>
        <div style={st.groupTitle}>프로필 이미지</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16, padding: '12px 0' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #e2e8f0' }}>
            {imagePreview ? (
              <img src={imagePreview} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 36, color: '#a0aec0', fontWeight: 700 }}>{profile?.nickname?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#667eea', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, cursor: 'pointer' }}>
              {imageFile ? '다른 파일 선택' : '이미지 변경'}
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            {imagePreview && !imageFile && (
              <button
                onClick={async () => {
                  if (!confirm('프로필 이미지를 삭제하시겠습니까?')) return;
                  setImageSaving(true);
                  try {
                    const apiClient = (await import('../api/client')).default;
                    const res = await apiClient.patch('/me/profile-image-reset');
                    setProfile(res.data);
                    setImagePreview('');
                  } catch (err: any) {
                    alert(err.response?.data?.error?.message || '프로필 이미지 변경에 실패했습니다');
                  }
                  finally { setImageSaving(false); }
                }}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, cursor: 'pointer' }}
              >
                삭제
              </button>
            )}
          </div>
          <div style={st.helpText}>{PROFILE_IMAGE_HELP_TEXT}</div>
          {imageFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#718096' }}>{imageFile.name}</span>
              <button onClick={handleSaveImage} disabled={imageSaving} style={{ ...st.saveBtn, padding: '6px 14px', fontSize: 12 }}>
                {imageSaving ? '업로드 중...' : '저장'}
              </button>
              <button onClick={() => { setImageFile(null); setImagePreview((profile as any)?.profileImageUrl || ''); }} style={{ padding: '6px 14px', fontSize: 12, color: '#718096', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}>
                취소
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 계정 */}
      <div style={st.section}>
        <div style={st.groupTitle}>계정</div>
        <div style={st.item}>
          <span>이메일</span>
          <span style={{ color: '#718096' }}>{profile?.email || '—'}</span>
        </div>
        <div style={st.item}>
          <span>닉네임</span>
          {!editingNickname ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#718096' }}>{profile?.nickname || '—'}</span>
              <button onClick={() => { setEditingNickname(true); setNewNickname(profile?.nickname || ''); }} style={st.editBtn}>수정</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="text" value={newNickname} onChange={(e) => { setNewNickname(e.target.value); setNicknameAvailable(null); setNicknameError(''); }} style={{ ...st.input, width: 120 }} />
              {!nicknameAvailable ? (
                <button onClick={handleCheckNickname} style={st.editBtn}>중복확인</button>
              ) : (
                <button onClick={handleSaveNickname} style={{ ...st.editBtn, color: '#38a169', borderColor: '#c6f6d5' }}>저장</button>
              )}
              <button onClick={() => setEditingNickname(false)} style={{ ...st.editBtn, color: '#718096' }}>취소</button>
            </div>
          )}
        </div>
        {nicknameError && <div style={{ fontSize: 12, color: '#e53e3e', paddingLeft: 4 }}>{nicknameError}</div>}
        {nicknameAvailable && <div style={{ fontSize: 12, color: '#38a169', paddingLeft: 4 }}>사용 가능</div>}

        {/* 비밀번호 - 소셜 로그인이 아닌 경우만 */}
        {(profile as any)?.provider === 'local' && (
        <div style={{ ...st.item, flexDirection: 'column' as const, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span>비밀번호</span>
            <button onClick={() => setShowPwForm(!showPwForm)} style={st.editBtn}>{showPwForm ? '취소' : '변경'}</button>
          </div>
          {showPwForm && (
            <div style={{ marginTop: 12, width: '100%' }}>
              <input type="password" placeholder="현재 비밀번호" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={{ ...st.input, marginBottom: 8 }} />
              <input type="password" placeholder="새 비밀번호 (8자 이상)" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={{ ...st.input, marginBottom: 8 }} />
              {pwError && <div style={{ fontSize: 12, color: '#e53e3e', marginBottom: 8 }}>{pwError}</div>}
              {pwSuccess && <div style={{ fontSize: 12, color: '#38a169', marginBottom: 8 }}>{pwSuccess}</div>}
              <button onClick={handleChangePassword} style={st.saveBtn}>비밀번호 변경</button>
            </div>
          )}
        </div>
        )}
      </div>

      {/* 개인정보 */}
      <div style={st.section}>
        <div style={st.groupTitle}>개인정보</div>
        <div style={{ ...st.item, cursor: 'pointer', color: '#e53e3e', borderBottom: 'none' }} onClick={handleDeleteAccount}>
          회원 탈퇴
        </div>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  backLink: { display: 'inline-block', marginBottom: 16, fontSize: 14, color: '#667eea', fontWeight: 500, textDecoration: 'none' },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 24, color: '#1a202c', letterSpacing: '-0.3px' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f5', marginBottom: 16 },
  groupTitle: { fontSize: 13, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 12 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f7f8fc', fontSize: 14, color: '#2d3748' },
  input: { padding: '8px 12px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  saveBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const },
  editBtn: { padding: '4px 10px', fontSize: 12, color: '#667eea', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontWeight: 500 },
  helpText: { fontSize: 12, color: '#718096', textAlign: 'center' as const },
};

export default SettingsPage;
