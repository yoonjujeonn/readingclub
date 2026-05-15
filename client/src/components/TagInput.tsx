import { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxLength?: number;
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 4,
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 14px',
    backgroundColor: '#3182ce',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  disabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    color: '#4c51bf',
    padding: '4px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    maxWidth: '100%',
  },
  remove: {
    border: 'none',
    background: 'transparent',
    color: '#4c51bf',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
  },
  help: {
    fontSize: 12,
    color: '#718096',
    marginTop: 6,
  },
};

function TagInput({ tags, onChange, maxTags = 3, maxLength = 15 }: TagInputProps) {
  const [value, setValue] = useState('');
  const canAdd = tags.length < maxTags;

  const addTag = () => {
    const next = value.trim().replace(/^#+/, '').trim();
    if (!next || !canAdd) return;
    onChange([...tags, next.slice(0, maxLength)]);
    setValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={styles.row}>
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          disabled={!canAdd}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={canAdd ? '태그 입력' : '태그는 최대 3개까지 가능합니다'}
          style={{ ...styles.input, ...(!canAdd ? styles.disabled : {}) }}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!canAdd || !value.trim()}
          style={{ ...styles.button, ...(!canAdd || !value.trim() ? styles.disabled : {}) }}
        >
          추가
        </button>
      </div>
      {tags.length > 0 && (
        <div style={styles.tags}>
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} style={styles.chip}>
              #{tag}
              <button type="button" onClick={() => removeTag(index)} style={styles.remove} aria-label={`${tag} 태그 삭제`}>
                x
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={styles.help}>선택 사항, 최대 {maxTags}개, 태그당 {maxLength}자까지 입력할 수 있습니다.</div>
    </div>
  );
}

export default TagInput;
