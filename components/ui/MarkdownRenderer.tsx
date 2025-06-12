// components/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown
import rehypeHighlight from 'rehype-highlight'; // syntax highlighting
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'highlight.js/styles/github.css'; // highlight.js theme

interface Props {
  content: string;
}

export const MarkdownRenderer = ({ content }: Props) => (
  <div className="prose dark:prose-invert max-w-none">
    <ReactMarkdown
      children={content}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeHighlight, rehypeKatex]}
    />
  </div>
);
