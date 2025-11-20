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
      <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 border-r border-[#1e1e1e] z-20">
        <div className="cursor-pointer hover:text-white text-white border-l-2 border-white pl-3 pr-4"><i className="fa-regular fa-file text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-magnifying-glass text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-code-branch text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-bug text-2xl"></i></div>
        <div className="mt-auto cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-gear text-2xl"></i></div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-[#252526] flex flex-col border-r border-[#1e1e1e]">
        <div className="px-4 py-3 text-xs font-bold text-[#bbbbbb] uppercase tracking-wider flex justify-between items-center">
            <span>Explorer</span>
            <i className="fa-solid fa-ellipsis text-[#cccccc]"></i>
        </div>
        
        {/* File Tree */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-[#cccccc] font-bold text-xs flex items-center gap-1 cursor-pointer bg-[#37373d]">
            <i className="fa-solid fa-chevron-down text-[10px]"></i>
            VS-CODE-VOICE-AGENT
          </div>
          <div className="pl-6 mt-1 flex flex-col gap-1 text-sm font-light">
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 py-0.5 flex items-center gap-2 text-[#519aba]">
               <i className="fa-brands fa-react text-sm"></i> App.tsx
            </div>
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 py-0.5 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-brands fa-html5 text-[#e34c26] text-sm"></i> index.html
            </div>
            <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 py-0.5 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-brands fa-css3 text-[#563d7c] text-sm"></i> global.css
            </div>
             <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 py-0.5 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-solid fa-image text-yellow-400 text-sm"></i> favicon.ico
            </div>
             <div className="hover:bg-[#2a2d2e] cursor-pointer px-1 py-0.5 flex items-center gap-2 text-[#d4d4d4]">
               <i className="fa-solid fa-file-code text-blue-300 text-sm"></i> useLiveApi.ts
            </div>
          </div>
        </div>
        
        {/* Modern Voice Control Panel */}
        <div className="bg-[#181818] border-t border-[#333] flex flex-col">
            <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase text-[#007acc] tracking-wider">Gemini Voice</h3>
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500/50'}`}></div>
                </div>

                {/* Visualizer Area */}
                <div className="h-32 w-full bg-black/40 rounded-xl border border-white/5 mb-4 overflow-hidden shadow-inner relative">
                    <AudioVisualizer 
                        isActive={status === 'connected'} 
                        volume={volumeLevel} 
                    />
                    {/* Status Overlay */}
                    <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                            status === 'connected' 
                            ? 'text-green-400 bg-green-400/10' 
                            : status === 'connecting' 
                            ? 'text-yellow-400 bg-yellow-400/10'
                            : 'text-gray-500'
                        }`}>
                            {status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-2">
                     <button 
                        onClick={toggleMute}
                        disabled={status !== 'connected'}
                        title={isMuted ? "Unmute" : "Mute"}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isMuted 
                            ? 'bg-white text-red-500 shadow-lg' 
                            : 'bg-[#2b2d2e] text-gray-300 hover:bg-[#353839] hover:text-white border border-[#3e3e3e]'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        <i className={`fa-solid ${isMuted ? 'fa-microphone-slash text-xl' : 'fa-microphone text-lg'}`}></i>
                     </button>

                    <button 
                        onClick={handleToggleConnection}
                        title={status === 'connected' ? "Disconnect" : "Connect"}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform active:scale-95 ${
                            status === 'connected' 
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                            : status === 'connecting'
                            ? 'bg-yellow-600 text-white animate-pulse'
                            : 'bg-white hover:bg-gray-100 text-black'
                        }`}
                    >
                        {status === 'connected' ? (
                            <i className="fa-solid fa-phone-slash text-2xl"></i>
                        ) : status === 'connecting' ? (
                            <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                        ) : (
                            <i className="fa-solid fa-microphone-lines text-2xl"></i>
                        )}
                    </button>
                    
                    <button 
                        disabled={true}
                        className="w-12 h-12 rounded-full bg-[#2b2d2e] text-gray-500 border border-[#3e3e3e] flex items-center justify-center opacity-50 cursor-not-allowed"
                    >
                         <i className="fa-solid fa-video text-lg"></i>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Split View: Editor & Terminal */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Editor Section */}
            <div className="flex-1 h-1/2 lg:h-full lg:w-3/5 flex flex-col min-w-0 border-r border-[#333]">
                <CodeEditor />
            </div>

            {/* Terminal/Chat Section */}
            <div className="h-1/2 lg:h-full lg:w-2/5 flex flex-col bg-[#1e1e1e] min-w-0">
                <Terminal messages={messages} />
            </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-3 justify-between select-none z-20">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer"><i className="fa-solid fa-code-branch"></i> main</span>
                <span className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer"><i className="fa-regular fa-circle-xmark"></i> 0</span>
                <span className="flex items-center gap-1 hover:bg-white/10 px-1 rounded cursor-pointer"><i className="fa-solid fa-triangle-exclamation"></i> 0</span>
            </div>
            <div className="flex items-center gap-4">
                 <span className="hidden sm:inline">Ln 12, Col 34</span>
                 <span className="hidden sm:inline">UTF-8</span>
                 <span className="hidden sm:inline">TypeScript React</span>
                 <span className="flex items-center gap-2 hover:bg-white/10 px-1 rounded cursor-pointer">
                    <i className={`fa-solid fa-rss text-[10px] ${status === 'connected' ? 'text-white' : 'text-white/50'}`}></i>
                    Port: 3000
                 </span>
                 <span className="flex items-center gap-2 hover:bg-white/10 px-1 rounded cursor-pointer">
                    <i className={`fa-solid fa-circle text-[8px] ${status === 'connected' ? 'text-green-300 animate-pulse' : 'text-white/50'}`}></i>
                    Gemini Live
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;