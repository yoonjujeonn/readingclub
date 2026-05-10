import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { booksApi } from '../api/books';
import { groupsApi } from '../api/groups';
import type { BookSearchResult, ApiError } from '../types';
import { AxiosError } from 'axios';

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '24px 16px',
  },
  backLink: {
    display: 'inline-block',
    marginBottom: 16,
    fontSize: 14,
    color: '#3182ce',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    color: '#2d3748',
  },
  searchRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    marginTop: 4,
  },
  searchBtn: {
    padding: '10px 16px',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  bookList: {
    maxHeight: 200,
    overflowY: 'auto' as const,
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  bookItem: {
    padding: '10px 12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    fontSize: 13,
  },
  bookItemHover: {
    backgroundColor: '#ebf8ff',
  },
  selectedBook: {
    backgroundColor: '#ebf8ff',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualToggle: {
    fontSize: 13,
    color: '#3182ce',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    textDecoration: 'underline',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box' as const,
    minHeight: 80,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  button: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  serverError: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '10px 12px',
    borderRadius: 4,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
};

interface FormErrors {
  bookTitle?: string;
  name?: string;
  maxMembers?: string;
  readingStartDate?: string;
  readingEndDate?: string;
  discussionDate?: string;
}

function CreateGroupPage() {
  const navigate = useNavigate();

  // Book search state
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookSearchResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [searching, setSearching] = useState(false);

  // Form state
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookSummary, setBookSummary] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [readingStartDate, setReadingStartDate] = useState('');
  const [readingEndDate, setReadingEndDate] = useState('');
  const [discussionDate, setDiscussionDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBookSearch = async () => {
    if (!bookQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await booksApi.search(bookQuery.trim());
      setBookResults(data);
      if (data.length === 0) {
        setManualMode(true);
      }
    } catch {
      setManualMode(true);
      setBookResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = (book: BookSearchResult) => {
    setSelectedBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookSummary(book.summary || '');
    setBookResults([]);
  };

  const handleClearBook = () => {
    setSelectedBook(null);
    setBookTitle('');
    setBookAuthor('');
    setBookSummary('');
  };

  const switchToManual = () => {
    setManualMode(true);
    setSelectedBook(null);
    setBookResults([]);
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!bookTitle.trim()) errs.bookTitle = '책 제목을 입력해주세요';
    if (!name.trim()) errs.name = '모임명을 입력해주세요';
    if (!maxMembers || parseInt(maxMembers) < 1) errs.maxMembers = '모집 인원은 1명 이상이어야 합니다';
    if (!readingStartDate) errs.readingStartDate = '독서 시작일을 선택해주세요';
    if (!readingEndDate) errs.readingEndDate = '독서 종료일을 선택해주세요';
    if (!discussionDate) errs.discussionDate = '토론 날짜를 선택해주세요';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const formErrors = validate();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setLoading(true);
    try {
      await groupsApi.create({
        bookTitle: bookTitle.trim(),
        bookAuthor: bookAuthor.trim() || undefined,
        bookCoverUrl: selectedBook?.coverImageUrl || undefined,
        bookSummary: bookSummary.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        maxMembers: parseInt(maxMembers),
        readingStartDate,
        readingEndDate,
        discussionDate,
        isPrivate,
        password: isPrivate ? password : undefined,
      });
      navigate('/');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setServerError(axiosErr.response?.data?.error?.message || '모임 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← 홈으로</Link>
      <h1 style={styles.title}>모임 만들기</h1>

      <form onSubmit={handleSubmit} noValidate>
        {serverError && <div style={styles.serverError}>{serverError}</div>}

        {/* Book Search Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📖 책 선택</div>

          {!manualMode && !selectedBook && (
            <>
              <div style={styles.searchRow}>
                <input
                  type="text"
                  style={{ ...styles.input, flex: 1 }}
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  placeholder="책 제목을 검색하세요"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleBookSearch())}
                />
                <button type="button" style={styles.searchBtn} onClick={handleBookSearch} disabled={searching}>
                  {searching ? '검색 중...' : '검색'}
                </button>
              </div>

              {bookResults.length > 0 && (
                <div style={styles.bookList}>
                  {bookResults.map((b, i) => (
                    <div
                      key={i}
                      style={{ ...styles.bookItem, display: 'flex', alignItems: 'center', gap: 10 }}
                      onClick={() => handleSelectBook(b)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectBook(b)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ebf8ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      {b.coverImageUrl && (
                        <img src={b.coverImageUrl} alt={b.title} style={{ width: 36, height: 52, objectFit: 'contain', borderRadius: 2, flexShrink: 0 }} />
                      )}
                      <div>
                        <div><strong>{b.title}</strong></div>
                        <div style={{ fontSize: 12, color: '#718096' }}>{b.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" style={styles.manualToggle} onClick={switchToManual}>
                직접 입력하기
              </button>
            </>
          )}

          {selectedBook && (
            <div style={styles.selectedBook}>
              <span>✅ {selectedBook.title} — {selectedBook.author}</span>
              <button type="button" style={styles.manualToggle} onClick={handleClearBook}>변경</button>
            </div>
          )}

          {manualMode && !selectedBook && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>책 제목 *</label>
                <input
                  type="text"
                  style={{ ...styles.input, ...(errors.bookTitle ? styles.inputError : {}) }}
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="책 제목"
                />
                {errors.bookTitle && <div style={styles.errorText}>{errors.bookTitle}</div>}
              </div>
              <div style={styles.field}>
                <label style={styles.label}>저자</label>
                <input
                  type="text"
                  style={styles.input}
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="저자"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>줄거리</label>
                <textarea
                  style={styles.textarea}
                  value={bookSummary}
                  onChange={(e) => setBookSummary(e.target.value)}
                  placeholder="줄거리"
                />
              </div>
              <button
                type="button"
                style={styles.manualToggle}
                onClick={() => { setManualMode(false); handleClearBook(); }}
              >
                다시 검색하기
              </button>
            </>
          )}
        </div>

        {/* Group Info Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📋 모임 정보</div>

          <div style={styles.field}>
            <label style={styles.label}>모임명 *</label>
            <input
              type="text"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="모임명"
            />
            {errors.name && <div style={styles.errorText}>{errors.name}</div>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>방 소개</label>
            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="모임을 소개해주세요"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>모집 인원 *</label>
            <input
              type="number"
              min="1"
              style={{ ...styles.input, ...(errors.maxMembers ? styles.inputError : {}) }}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="모집 인원"
            />
            {errors.maxMembers && <div style={styles.errorText}>{errors.maxMembers}</div>}
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>독서 시작일 *</label>
              <input
                type="date"
                style={{ ...styles.input, ...(errors.readingStartDate ? styles.inputError : {}) }}
                value={readingStartDate}
                onChange={(e) => setReadingStartDate(e.target.value)}
              />
              {errors.readingStartDate && <div style={styles.errorText}>{errors.readingStartDate}</div>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>독서 종료일 *</label>
              <input
                type="date"
                style={{ ...styles.input, ...(errors.readingEndDate ? styles.inputError : {}) }}
                value={readingEndDate}
                onChange={(e) => setReadingEndDate(e.target.value)}
              />
              {errors.readingEndDate && <div style={styles.errorText}>{errors.readingEndDate}</div>}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>토론 날짜 *</label>
            <input
              type="date"
              style={{ ...styles.input, ...(errors.discussionDate ? styles.inputError : {}) }}
              value={discussionDate}
              onChange={(e) => setDiscussionDate(e.target.value)}
            />
            {errors.discussionDate && <div style={styles.errorText}>{errors.discussionDate}</div>}
          </div>

          <div style={styles.field}>
            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              🔒 비공개 모임
            </label>
            {isPrivate && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="숫자 6자리"
                />
                <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                  비공개 모임은 숫자 6자리 비밀번호를 알아야 참여할 수 있습니다. 초대 링크로는 비밀번호 없이 참여 가능합니다.
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? '생성 중...' : '모임 만들기'}
        </button>
      </form>
    </div>
  );
}

export default CreateGroupPage;
