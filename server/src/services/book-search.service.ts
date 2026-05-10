import axios from 'axios';

export interface BookSearchResult {
  title: string;
  author: string;
  coverImageUrl: string;
  summary: string;
  isbn: string;
}

function parseKakaoResponse(data: any): BookSearchResult[] {
  if (!data?.documents || !Array.isArray(data.documents)) {
    return [];
  }
  return data.documents.map((doc: any) => ({
    title: doc.title ?? '',
    author: (doc.authors ?? []).join(', '),
    coverImageUrl: doc.thumbnail ?? '',
    summary: doc.contents ?? '',
    isbn: doc.isbn?.split(' ').pop() ?? '',
  }));
}

function parseNaverResponse(data: any): BookSearchResult[] {
  if (!data?.items || !Array.isArray(data.items)) {
    return [];
  }
  return data.items.map((item: any) => {
    const rawSummary = (item.description ?? '').replace(/<[^>]*>/g, '');
    // 마지막 완전한 문장(마침표/느낌표/물음표)까지만 사용
    const lastSentenceEnd = Math.max(
      rawSummary.lastIndexOf('.'),
      rawSummary.lastIndexOf('!'),
      rawSummary.lastIndexOf('?'),
      rawSummary.lastIndexOf('다.'),
    );
    const summary = lastSentenceEnd > 0 ? rawSummary.slice(0, lastSentenceEnd + 1) : rawSummary;

    return {
      title: (item.title ?? '').replace(/<[^>]*>/g, ''),
      author: (item.author ?? '').replace(/<[^>]*>/g, ''),
      coverImageUrl: item.image ?? '',
      summary,
      isbn: item.isbn ?? '',
    };
  });
}

export const bookSearchService = {
  async search(query: string): Promise<BookSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Read env vars at call time (after dotenv has loaded)
    const kakaoKey = process.env.KAKAO_API_KEY;
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    // Try Naver API first (줄거리가 더 완전함)
    if (naverClientId && naverClientSecret && !naverClientId.startsWith('your-')) {
      try {
        const response = await axios.get('https://openapi.naver.com/v1/search/book.json', {
          params: { query, display: 10 },
          headers: {
            'X-Naver-Client-Id': naverClientId,
            'X-Naver-Client-Secret': naverClientSecret,
          },
          timeout: 5000,
        });
        return parseNaverResponse(response.data);
      } catch {
        // Fall through to Kakao
      }
    }

    // Try Kakao API as fallback
    if (kakaoKey && !kakaoKey.startsWith('your-')) {
      try {
        const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
          params: { query, size: 10 },
          headers: { Authorization: `KakaoAK ${kakaoKey}` },
          timeout: 5000,
        });
        return parseKakaoResponse(response.data);
      } catch {
        // Fall through
      }
    }

    // No valid API keys configured — return empty so frontend falls back to manual input
    return [];
  },
};
