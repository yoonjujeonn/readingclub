import { useRef } from 'react';
import { toPng } from 'html-to-image';

interface InsightData {
  bookTitle: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  summary: string;
  keywords: string[];
  highlights: string[];
  takeaway: string;
  memoCount: number;
  discussionCount: number;
  commentCount: number;
  createdAt: string;
}

interface InsightCardProps {
  insight: InsightData;
}

export function InsightCard({ insight }: InsightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `insight-${insight.bookTitle}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('이미지 저장에 실패했습니다.');
    }
  };

  const handleCopyForKakao = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('클립보드에 복사되었습니다! 카카오톡에 붙여넣기(Ctrl+V)하세요.');
    } catch {
      alert('클립보드 복사에 실패했습니다. 이미지로 저장 후 공유해주세요.');
    }
  };

  const handleCopyForDiscord = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('클립보드에 복사되었습니다! 디스코드에 붙여넣기(Ctrl+V)하세요.');
    } catch {
      alert('클립보드 복사에 실패했습니다. 이미지로 저장 후 공유해주세요.');
    }
  };

  return (
    <div>
      {/* Card */}
      <div ref={cardRef} style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 20,
        padding: '32px 28px',
        color: '#fff',
        maxWidth: 420,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(102,126,234,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(118,75,162,0.1)' }} />

        {/* Header */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 2, opacity: 0.5, marginBottom: 8 }}>READING INSIGHT</div>
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{insight.bookTitle}</div>
          {insight.bookAuthor && <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>{insight.bookAuthor}</div>}
        </div>

        {/* Takeaway - 핵심 한 줄 */}
        {insight.takeaway && (
          <div style={{
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.6,
            marginBottom: 20,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            borderLeft: '3px solid #C8962E',
          }}>
            "{insight.takeaway}"
          </div>
        )}

        {/* Summary */}
        {insight.summary && (
          <div style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.85, marginBottom: 16 }}>
            {insight.summary}
          </div>
        )}

        {/* Highlights */}
        {insight.highlights && insight.highlights.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {insight.highlights.map((h, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 6, paddingLeft: 14, position: 'relative' as const, opacity: 0.9 }}>
                <span style={{ position: 'absolute', left: 0 }}>•</span>{h}
              </div>
            ))}
          </div>
        )}

        {/* Keywords */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 20 }}>
          {insight.keywords.slice(0, 5).map((kw, i) => (
            <span key={i} style={{
              padding: '4px 12px',
              background: 'rgba(102,126,234,0.25)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
            }}>#{kw}</span>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, opacity: 0.6, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span>📝 메모 {insight.memoCount}개</span>
          <span>💬 스레드 {insight.discussionCount}개</span>
          <span>🗨️ 의견 {insight.commentCount}개</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={handleExportImage} style={{ padding: '8px 16px', backgroundColor: '#3D2E1E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          📷 저장
        </button>
        <button onClick={handleCopyForKakao} style={{ padding: '8px 16px', backgroundColor: '#FEE500', color: '#3C1E1E', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          💬 카톡 공유
        </button>
        <button onClick={handleCopyForDiscord} style={{ padding: '8px 16px', backgroundColor: '#5865F2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          🎮 디스코드 공유
        </button>
      </div>
    </div>
  );
}
