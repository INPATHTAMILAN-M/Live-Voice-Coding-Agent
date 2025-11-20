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
    volumeLevel,
    currentCode 
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
      <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 border-r border-[#1e1e1e] z-20 flex-none">
        <div className="cursor-pointer hover:text-white text-white border-l-2 border-white pl-3 pr-4"><i className="fa-regular fa-file text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-magnifying-glass text-2xl"></i></div>
        <div className="cursor-pointer hover:text-white text-[#858585]"><i className="fa-solid fa-code-branch text-2xl"></i></div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-[#252526] flex flex-col border-r border-[#1e1e1e] flex-none">
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
               <i className="fa-solid fa-file-code text-blue-300 text-sm"></i> useLiveApi.ts
            </div>
          </div>
        </div>
        
        {/* Voice Panel */}
        <div className="bg-[#181818] border-t border-[#333] flex flex-col shadow-xl">
            <div className="p-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase text-white/80 tracking-wider flex items-center gap-2">
                      <i className="fa-solid fa-wave-square text-blue-400"></i> Gemini Voice
                    </h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {status === 'connected' ? 'Listening' : 'Offline'}
                    </span>
                </div>

                {/* Visualizer Area */}
                <div className="h-24 w-full rounded-2xl bg-black/50 mb-6 relative overflow-hidden flex items-center justify-center">
                    <AudioVisualizer 
                        isActive={status === 'connected'} 
                        volume={volumeLevel} 
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                     <button 
                        onClick={toggleMute}
                        disabled={status !== 'connected'}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isMuted 
                            ? 'bg-white text-black' 
                            : 'bg-[#2b2d2e] text-white hover:bg-[#353839] border border-white/10'
                        } disabled:opacity-30`}
                    >
                        <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                     </button>

                    <button 
                        onClick={handleToggleConnection}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 ${
                            status === 'connected' 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : status === 'connecting'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-white text-black hover:bg-gray-200'
                        }`}
                    >
                        {status === 'connected' ? (
                            <i className="fa-solid fa-stop text-xl"></i>
                        ) : status === 'connecting' ? (
                            <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
                        ) : (
                            <i className="fa-solid fa-microphone text-xl"></i>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Editor */}
            <div className="flex-1 h-1/2 lg:h-full lg:w-3/5 flex flex-col min-w-0 border-r border-[#333]">
                <CodeEditor code={currentCode} />
            </div>

            {/* Terminal */}
            <div className="h-1/2 lg:h-full lg:w-2/5 flex flex-col bg-[#1e1e1e] min-w-0">
                <Terminal messages={messages} />
            </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-3 justify-between select-none z-20 flex-none">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><i className="fa-solid fa-code-branch"></i> main</span>
                <span><i className="fa-regular fa-circle-xmark"></i> 0</span>
            </div>
            <div className="flex items-center gap-4">
                 <span>Ln {currentCode.split('\n').length}, Col 1</span>
                 <span>TypeScript React</span>
                 <span className="flex items-center gap-2">
                    <i className={`fa-solid fa-circle text-[8px] ${status === 'connected' ? 'text-white animate-pulse' : 'text-white/50'}`}></i>
                    Voice Agent
                 </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;