import { marked } from 'marked';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  const html = marked.parse(content, { async: false }) as string;
  return (
    <div
      className="markdown-content"
      style={{ fontSize: 14, color: '#5C4A32', lineHeight: 1.8 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
