// 금칙어 리스트 (기본 욕설 + 변형)
const PROFANITY_LIST = [
  '시발', '씨발', '씨팔', '시팔', '씨바', '시바',
  '개새끼', '개세끼', '개쉐끼', '개색끼',
  '병신', '븅신', '빙신', '지랄', 
  '미친놈', '미친년', '미친새끼',
  '꺼져', '닥쳐', '뒤져', '뒈져',
  '존나', '졸라', 'ㅈㄴ',
  'ㅅㅂ', 'ㅆㅂ', 'ㅂㅅ', 'ㅄ', 'ㅗ',
  '새끼', '쉐끼', '색끼',
  '개같', '개년', '개놈',
  '엿먹', '좆', 'ㅈ같',
  '느금마', '니미', '니엄마',
  '한남', '한녀',
  // 영어
  'fuck', 'shit', 'damn', 'bitch', 'asshole',
  'bastard', 'dick', 'pussy', 'cunt', 'wtf',
  'stfu', 'idiot', 'retard',
  'nigger', 'nigga', 'fag', 'faggot',
];

// 특수문자/공백 제거 정규식
function normalize(text: string): string {
  return text
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]/g, '') // 특수문자, 공백 제거
    .toLowerCase();
}

// 초성 분리 (ㅅㅂ 같은 초성 욕설 감지용)
function extractChosung(text: string): string {
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
      result += CHO[Math.floor(code / 588)];
    } else {
      result += char;
    }
  }
  return result;
}

export interface ProfanityResult {
  isClean: boolean;
  matched: string[];
}

export const profanityService = {
  check(text: string): ProfanityResult {
    const normalized = normalize(text);
    const chosung = extractChosung(normalized);
    const matched: string[] = [];

    for (const word of PROFANITY_LIST) {
      const normalizedWord = normalize(word);
      // 원문에서 매칭
      if (normalized.includes(normalizedWord)) {
        matched.push(word);
        continue;
      }
      // 초성에서 매칭 — 원문에 초성 문자(ㄱ-ㅎ)가 직접 있는 경우에만
      if (word.length <= 3 && /^[ㄱ-ㅎ]+$/.test(word)) {
        // 원문에서 초성 문자만 추출
        const originalChosung = text.replace(/[^ㄱ-ㅎ]/g, '');
        if (originalChosung.includes(word)) {
          matched.push(word);
        }
      }
    }

    return {
      isClean: matched.length === 0,
      matched: [...new Set(matched)],
    };
  },
};
