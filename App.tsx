import React from 'react';
import { useLiveApi } from './hooks/useLiveApi';
import CodeEditor from './components/CodeEditor';
import Terminal from './components/Terminal';
import AudioVisualizer from './components/AudioVisualizer';

const App: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    status, 
    messages, 
    isMuted, 
    toggleMute, 
    volumeLevel 
  } = useLiveApi();

  const handleToggleConnection = () => {
    if (status === 'connected' || status === 'connecting') {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* Activity Bar */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6">
        <div className="cursor-pointer hover:text-white text-white border-l-2 border-white pl-3 pr-4"><i className="fa-regular fa-file text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-magnifying-glass text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-code-branch text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-bug text-2xl"></i></div>
        <div className="mt-auto cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-gear text-2xl"></i></div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e]">
        <div className="px-4 py-2 text-xs font-bold text-[#bbbbbb] uppercase tracking-wider">Explorer</div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-[#cccccc] font-bold text-xs flex items-center gap-1 cursor-pointer bg-[#37373d]">
            <i className="fa-solid fa-chevron-down text-[10px]"></i>
            VS-CODE-VOICE-AGENT
          </div>
          <div className="pl-6 mt-1 flex flex-col gap-1 text-sm">
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 flex items-center gap-2 text-[#519aba]">
               <i className="fa-brands fa-react"></i> App.tsx
            </div>
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-brands fa-html5 text-[#e34c26]"></i> index.html
            </div>
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-brands fa-css3 text-[#563d7c]"></i> global.css
            </div>
             <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-solid fa-image text-yellow-400"></i> favicon.ico
            </div>
          </div>
        </div>
        
        {/* Connection Control Panel in Sidebar */}
        <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
            <h3 className="text-xs font-bold uppercase mb-3 text-[#007acc]">Gemini Live Agent</h3>
            
            <div className="flex flex-col gap-3">
                <button 
                    onClick={handleToggleConnection}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        status === 'connected' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : status === 'connecting'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-[#007acc] hover:bg-[#005c99] text-white'
                    }`}
                >
                    {status === 'connected' ? (
                        <><i className="fa-solid fa-stop"></i> End Session</>
                    ) : status === 'connecting' ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Connecting...</>
                    ) : (
                        <><i className="fa-solid fa-play"></i> Start Agent</>
                    )}
                </button>

                <div className="flex items-center gap-2">
                     <button 
                        onClick={toggleMute}
                        disabled={status !== 'connected'}
                        className={`flex-1 px-3 py-2 rounded text-sm border transition-colors ${
                            isMuted 
                            ? 'bg-red-900/30 border-red-800 text-red-400' 
                            : 'bg-[#333] border-[#444] text-[#ccc] hover:bg-[#444]'
                        } disabled:opacity-50`}
                    >
                        <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                     </button>
                     <div className="flex-1 h-9 bg-[#000] rounded border border-[#333] overflow-hidden relative">
                        <AudioVisualizer 
                            isActive={status === 'connected' && !isMuted} 
                            volume={volumeLevel} 
                        />
                     </div>
                </div>
                
                <div className="text-[10px] text-gray-500 text-center">
                    {status === 'connected' ? 'Listening...' : 'Ready to pair program'}
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Split View: Editor & Terminal */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Editor Section */}
            <div className="flex-1 h-1/2 lg:h-full lg:w-3/5 flex flex-col">
                <CodeEditor />
            </div>

            {/* Terminal/Chat Section */}
            <div className="h-1/2 lg:h-full lg:w-2/5 border-t lg:border-t-0 lg:border-l border-[#333] flex flex-col bg-[#1e1e1e]">
                <Terminal messages={messages} />
            </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-3 justify-between select-none">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><i className="fa-solid fa-code-branch"></i> main</span>
                <span className="flex items-center gap-1"><i className="fa-regular fa-circle-xmark"></i> 0</span>
                <span className="flex items-center gap-1"><i className="fa-solid fa-triangle-exclamation"></i> 0</span>
            </div>
            <div className="flex items-center gap-4">
                 <span>Ln 12, Col 34</span>
                 <span>UTF-8</span>
                 <span>TypeScript React</span>
                 <span className="flex items-center gap-2">
                    <i className={`fa-solid fa-circle text-[8px] ${status === 'connected' ? 'text-white animate-pulse' : 'text-white/50'}`}></i>
                    Gemini Live
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
