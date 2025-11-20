import React from 'react';

interface CodeEditorProps {
  code: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  
  const highlightCode = (source: string) => {
    return source.split('\n').map((line, i) => {
        // 1. Escape HTML special characters first to prevent rendering issues
        let formatted = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // 2. Highlight Keywords
        formatted = formatted.replace(/\b(import|const|return|export|default|function|interface|type|from|let|var|if|else|useState|useEffect|useRef)\b/g, '<span class="text-[#c678dd]">$1</span>');
        
        // 3. Highlight Types (Capitalized words)
        formatted = formatted.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="text-[#e5c07b]">$1</span>');
        
        // 4. Highlight JSX Tags (heuristic: &lt; followed by Capital)
        formatted = formatted.replace(/(&lt;[A-Z][a-zA-Z0-9]*)/g, '<span class="text-[#e06c75]">$1</span>');

        return (
             <div key={i} className="leading-6 whitespace-pre" dangerouslySetInnerHTML={{ __html: formatted || ' ' }} />
        );
    });
  };

  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col font-mono text-sm border-r border-[#333] overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-[#252526] border-b border-[#333] flex-none">
        <div className="px-4 py-2 bg-[#1e1e1e] text-[#d4d4d4] border-t-2 border-t-[#007acc] cursor-pointer flex items-center gap-2">
          <i className="fa-brands fa-react text-[#007acc]"></i>
          App.tsx
          <i className="fa-solid fa-xmark ml-2 text-xs hover:bg-[#333] rounded p-0.5"></i>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="flex-1 p-4 overflow-y-auto relative custom-scrollbar">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] text-[#5c6370] text-right pr-4 pt-4 select-none">
          {code.split('\n').map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        <div className="pl-10 text-[#d4d4d4]">
            {highlightCode(code)}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;