import React from 'react';

const CodeEditor: React.FC = () => {
  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col font-mono text-sm border-r border-[#333]">
      {/* Tabs */}
      <div className="flex bg-[#252526] border-b border-[#333]">
        <div className="px-4 py-2 bg-[#1e1e1e] text-[#d4d4d4] border-t-2 border-t-[#007acc] cursor-pointer flex items-center gap-2">
          <i className="fa-brands fa-react text-[#007acc]"></i>
          App.tsx
          <i className="fa-solid fa-xmark ml-2 text-xs hover:bg-[#333] rounded p-0.5"></i>
        </div>
        <div className="px-4 py-2 text-[#969696] cursor-pointer hover:bg-[#2a2d2e] flex items-center gap-2">
          <i className="fa-brands fa-css3 text-blue-400"></i>
          globals.css
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-1 text-xs text-[#969696] flex items-center gap-2 border-b border-[#333]">
        <span>src</span>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <span>components</span>
        <i className="fa-solid fa-chevron-right text-[10px]"></i>
        <span>App.tsx</span>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] text-[#5c6370] text-right pr-4 pt-4 select-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        <div className="pl-10 leading-6 text-[#d4d4d4]">
          <p><span className="text-[#c678dd]">import</span> React, {'{'} useState {'}'} <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">'react'</span>;</p>
          <p>&nbsp;</p>
          <p><span className="text-[#c678dd]">const</span> <span className="text-[#e5c07b]">App</span>: <span className="text-[#e5c07b]">React.FC</span> = () ={'>'} {'{'}</p>
          <p className="pl-4"><span className="text-[#5c6370]">// This code is visualized here</span></p>
          <p className="pl-4"><span className="text-[#c678dd]">const</span> [count, setCount] = <span className="text-[#61afef]">useState</span>(<span className="text-[#d19a66]">0</span>);</p>
          <p>&nbsp;</p>
          <p className="pl-4"><span className="text-[#c678dd]">return</span> (</p>
          <p className="pl-8">&lt;<span className="text-[#e06c75]">div</span> className=<span className="text-[#98c379]">"app-container"</span>&gt;</p>
          <p className="pl-12">&lt;<span className="text-[#e06c75]">h1</span>&gt;Hello Gemini Live&lt;/<span className="text-[#e06c75]">h1</span>&gt;</p>
          <p className="pl-12">&lt;<span className="text-[#e06c75]">button</span> onClick={'{}'}&gt;Click Me&lt;/<span className="text-[#e06c75]">button</span>&gt;</p>
          <p className="pl-8">&lt;/<span className="text-[#e06c75]">div</span>&gt;</p>
          <p className="pl-4">);</p>
          <p>{'}'};</p>
          <p>&nbsp;</p>
          <p><span className="text-[#c678dd]">export default</span> App;</p>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
