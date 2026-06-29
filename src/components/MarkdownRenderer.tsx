"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !className;
    const code = String(children).replace(/\n$/, "");

    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 bg-gray-200/70 rounded text-sm font-mono text-pink-600" {...props}>
          {code}
        </code>
      );
    }

    return (
      <div className="relative group my-3">
        {match && (
          <div className="absolute top-0 right-0 px-3 py-1 text-xs text-gray-400 bg-gray-700 rounded-bl-lg rounded-tr-lg font-mono select-none">
            {match[1]}
          </div>
        )}
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 pt-3 overflow-x-auto text-sm leading-relaxed">
          <code className={className} {...props}>
            {code}
          </code>
        </pre>
      </div>
    );
  },
  p({ children }) {
    return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          {children}
        </table>
      </div>
    );
  },
  th({ children }) {
    return <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>;
  },
  td({ children }) {
    return <td className="border border-gray-300 px-3 py-2">{children}</td>;
  },
  hr() {
    return <hr className="my-4 border-gray-300" />;
  },
  strong({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
