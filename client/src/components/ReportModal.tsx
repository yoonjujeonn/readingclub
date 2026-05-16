import { useState } from 'react';
import { reportsApi } from '../api/reports';

interface ReportModalProps {
  targetType: string;
  targetId: string;
  onClose: () => void;
}

function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await reportsApi.create(targetType, targetId, reason.trim());
      if (res.data?.deleted) {
        setResult('부적절한 콘텐츠로 판별되어 삭제되었습니다.');
      } else {
        setResult('신고가 접수되었습니다. AI가 검토 후 처리합니다.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || '신고에 실패했습니다.';
      setResult(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🚨 신고하기</div>

        {result ? (
          <>
            <div style={{ fontSize: 14, color: '#5C4A32', marginBottom: 16 }}>{result}</div>
            <button onClick={onClose} style={{ width: '100%', padding: '10px 0', backgroundColor: '#C8962E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
              확인
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#718096', marginBottom: 12 }}>
              신고 사유를 선택하거나 직접 입력해주세요.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {['욕설/비방', '주제와 무관한 내용', '스팸/광고', '기타'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{
                    padding: '6px 12px', fontSize: 12, borderRadius: 16, cursor: 'pointer',
                    border: reason === r ? '2px solid #C8962E' : '1px solid #E8DFD3',
                    backgroundColor: reason === r ? '#FFF8E7' : '#fff',
                    color: reason === r ? '#C8962E' : '#5C4A32',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="신고 사유를 입력해주세요"
              style={{ width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box', minHeight: 60, resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || !reason.trim()}
                style={{ flex: 1, padding: '10px 0', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting || !reason.trim() ? 0.6 : 1 }}
              >
                {submitting ? '처리 중...' : '신고하기'}
              </button>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '10px 0', backgroundColor: '#edf2f7', color: '#333', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
