import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TerminalProps {
  messages: Message[];
}

const Terminal: React.FC<TerminalProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full bg-[#1e1e1e] font-mono text-sm flex flex-col overflow-hidden">
      <div className="bg-[#252526] px-4 py-2 text-[#cccccc] text-xs uppercase tracking-wide border-b border-[#333]">
        Output / Terminal
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 italic">No active session. Start a session to begin coding...</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded p-2 ${
              msg.role === 'user' 
                ? 'bg-[#2d333b] text-[#adbac7] border border-[#444c56]' 
                : msg.role === 'system'
                ? 'bg-transparent text-yellow-500 italic'
                : 'bg-[#1e1e1e] text-[#d4d4d4]'
            }`}>
              <div className="text-[10px] opacity-50 mb-1 uppercase font-bold">
                {msg.role} <span className="mx-1">•</span> {msg.timestamp.toLocaleTimeString()}
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;
