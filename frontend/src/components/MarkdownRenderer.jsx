import React from 'react';

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // State machine to parse markdown lines
  const lines = content.split('\n');
  const elements = [];
  let codeLines = [];
  let codeLanguage = '';
  let inCodeBlock = false;
  let listItems = [];
  let listType = null; // 'ul' or 'ol'

  // Parse inline styles (bold, code, links)
  const parseInline = (text) => {
    if (typeof text !== 'string') return text;
    
    // Regex pattern to capture bold, code backticks, and links
    const pattern = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    const parts = text.split(pattern);

    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return (
          <span
            key={index}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer transition-colors duration-150"
            onClick={() => {
              if (!linkMatch[2].startsWith('http')) {
                console.log("Internal file link clicked:", linkMatch[2]);
              } else {
                window.open(linkMatch[2], '_blank', 'noopener,noreferrer');
              }
            }}
          >
            {linkMatch[1]}
          </span>
        );
      }
      return part;
    });
  };

  const flushList = (key) => {
    if (listItems.length === 0) return null;
    const items = [...listItems];
    const type = listType;
    listItems = [];
    listType = null;

    if (type === 'ul') {
      return (
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-2 my-3 text-gray-300 font-normal">
          {items.map((item, idx) => (
            <li 
              key={idx} 
              style={{ marginLeft: `${(item.indent || 0) * 8}px` }} 
              className={`leading-relaxed text-sm font-normal text-gray-300 ${item.indent > 0 ? 'list-circle opacity-90' : ''}`}
            >
              {parseInline(item.text)}
            </li>
          ))}
        </ul>
      );
    } else {
      return (
        <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-2 my-3 text-gray-300 font-normal">
          {items.map((item, idx) => (
            <li 
              key={idx} 
              style={{ marginLeft: `${(item.indent || 0) * 8}px` }} 
              className="leading-relaxed text-sm font-normal text-gray-300"
            >
              {parseInline(item.text)}
            </li>
          ))}
        </ol>
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block handling
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        inCodeBlock = false;
        const codeText = codeLines.join('\n');
        const lang = codeLanguage || 'code';
        codeLines = [];
        codeLanguage = '';

        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 font-mono text-xs shadow-inner">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center text-[10px] uppercase text-gray-500 font-bold tracking-wider">
              <span>{lang}</span>
              <button
                onClick={() => navigator.clipboard.writeText(codeText)}
                className="hover:text-indigo-400 text-gray-500 transition-colors duration-150 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-indigo-200">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      } else {
        // Start of code block
        const listVal = flushList(i);
        if (listVal) elements.push(listVal);

        inCodeBlock = true;
        codeLanguage = trimmed.substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 2. Headings
    if (trimmed.startsWith('# ')) {
      const listVal = flushList(i);
      if (listVal) elements.push(listVal);

      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-white mt-5 mb-3 font-sans tracking-tight border-b border-gray-850 pb-2">
          {parseInline(trimmed.substring(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const listVal = flushList(i);
      if (listVal) elements.push(listVal);

      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-white mt-4 mb-2.5 font-sans tracking-tight">
          {parseInline(trimmed.substring(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const listVal = flushList(i);
      if (listVal) elements.push(listVal);

      elements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-indigo-300 mt-3.5 mb-2 font-sans">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
      continue;
    }

    // 3. Blockquotes
    if (trimmed.startsWith('> ')) {
      const listVal = flushList(i);
      if (listVal) elements.push(listVal);

      elements.push(
        <blockquote key={`bq-${i}`} className="border-l-4 border-indigo-500 pl-4 py-1 italic bg-indigo-500/5 text-gray-400 rounded-r-lg my-3 font-normal text-sm">
          {parseInline(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    // 4. Sub-list items starting with indentation
    const subListMatch = line.match(/^(\s+)[*-]\s+(.*)/);
    if (subListMatch) {
      if (listType && listType !== 'ul') {
        const listVal = flushList(i);
        if (listVal) elements.push(listVal);
      }
      listType = 'ul';
      listItems.push({ text: subListMatch[2], indent: subListMatch[1].length });
      continue;
    }

    // 5. Unordered List items (top level)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (listType && listType !== 'ul') {
        const listVal = flushList(i);
        if (listVal) elements.push(listVal);
      }
      listType = 'ul';
      listItems.push({ text: trimmed.substring(2), indent: 0 });
      continue;
    }

    // 6. Ordered List items
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      if (listType && listType !== 'ol') {
        const listVal = flushList(i);
        if (listVal) elements.push(listVal);
      }
      listType = 'ol';
      listItems.push({ text: orderedMatch[2], indent: 0 });
      continue;
    }

    // 7. Empty lines
    if (trimmed === '') {
      const listVal = flushList(i);
      if (listVal) elements.push(listVal);
      continue;
    }

    // 8. Standard paragraph lines
    const listVal = flushList(i);
    if (listVal) elements.push(listVal);

    elements.push(
      <p key={`p-${i}`} className="text-gray-300 mb-2.5 leading-relaxed font-normal text-sm font-sans">
        {parseInline(trimmed)}
      </p>
    );
  }

  const finalList = flushList(lines.length);
  if (finalList) elements.push(finalList);

  return (
    <div className="space-y-3 text-gray-300 leading-relaxed text-sm font-normal font-sans">
      {elements}
    </div>
  );
};

export default MarkdownRenderer;
