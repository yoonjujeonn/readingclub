interface GroupTagsProps {
  tags?: string[];
  compact?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tag: {
    display: 'inline-block',
    backgroundColor: '#eef2ff',
    color: '#4c51bf',
    padding: '3px 9px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    wordBreak: 'break-word',
  },
  compactTag: {
    padding: '2px 8px',
    fontSize: 11,
  },
};

function GroupTags({ tags, compact = false }: GroupTagsProps) {
  const visibleTags = tags?.filter(Boolean) ?? [];
  if (visibleTags.length === 0) return null;

  return (
    <div style={styles.row}>
      {visibleTags.map((tag, index) => (
        <span key={`${tag}-${index}`} style={{ ...styles.tag, ...(compact ? styles.compactTag : {}) }}>
          #{tag}
        </span>
      ))}
    </div>
  );
}

export default GroupTags;
