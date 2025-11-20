import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Tool, FunctionDeclaration, Type } from '@google/genai';
import { createAudioBlob, decodeAudioData } from '../utils/audio-utils';
import { Message, ConnectionStatus } from '../types';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Initial code to populate the editor
const INITIAL_CODE = `import React, { useState } from 'react';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Hello Gemini Live</h1>
      <p className="mb-2">Count: {count}</p>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => setCount(c => c + 1)}
      >
        Increment
      </button>
    </div>
  );
};

export default App;`;

// Define the tool for updating code
const updateCodeDeclaration: FunctionDeclaration = {
  name: 'updateCode',
  description: 'Replaces the entire content of the code editor with the provided code string. Use this to write, refactor, or fix code for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: 'The full source code to put in the editor.',
      },
    },
    required: ['code'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [updateCodeDeclaration] }];

export const useLiveApi = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [currentCode, setCurrentCode] = useState<string>(INITIAL_CODE);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<any> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const currentInputVolumeRef = useRef<number>(0);
  const isConnectedRef = useRef<boolean>(false);
  
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  const connect = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') return;

    try {
      setStatus('connecting');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      const outputCtx = outputAudioContextRef.current;
      outputAnalyserRef.current = outputCtx.createAnalyser();
      outputAnalyserRef.current.fftSize = 64; // Lower FFT size for "bar" visualization
      outputAnalyserRef.current.smoothingTimeConstant = 0.1;
      outputAnalyserRef.current.connect(outputCtx.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isConnectedRef.current = true;

      const updateVolume = () => {
        if (!isConnectedRef.current) return;

        let outputVol = 0;
        if (outputAnalyserRef.current) {
           const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
           outputAnalyserRef.current.getByteFrequencyData(dataArray);
           let sum = 0;
           // Focus on lower frequencies for voice
           const length = Math.floor(dataArray.length * 0.5);
           for(let i=0; i < length; i++) sum += dataArray[i];
           const avg = sum / length;
           outputVol = avg / 255; 
        }
        
        const inputVol = currentInputVolumeRef.current;
        setVolumeLevel(Math.max(outputVol, inputVol));
        
        rafIdRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          // Updated system instruction to enforce tool use
          systemInstruction: "You are a voice-controlled coding assistant integrated into a code editor. The user will speak to you. If the user asks to write, change, or fix code, you MUST call the 'updateCode' tool with the full new code. Do not just recite the code. Speak briefly to confirm ('Sure, updating the code now...') and then execute the tool. Always maintain the previous code context if you are just making small edits.",
          tools: tools,
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setStatus('connected');
            setMessages([{
              id: 'system-1',
              role: 'system',
              text: 'Voice Assistant Connected. Ready to edit code.',
              timestamp: new Date()
            }]);

            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const ctx = inputAudioContextRef.current;
            const source = ctx.createMediaStreamSource(streamRef.current);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              currentInputVolumeRef.current = isMuted ? 0 : Math.min(1, rms * 5);

              if (isMuted) return; 

              const pcmBlob = createAudioBlob(inputData);
              
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
            
            sourceRef.current = source;
            processorRef.current = scriptProcessor;
          },
          onmessage: async (msg: LiveServerMessage) => {
             // 1. Handle Tool Calls (Code Updates)
             if (msg.toolCall) {
               console.log("Tool Call received:", msg.toolCall);
               for (const fc of msg.toolCall.functionCalls) {
                 if (fc.name === 'updateCode') {
                   const newCode = (fc.args as any).code;
                   if (newCode) {
                     setCurrentCode(newCode);
                     setMessages(prev => [...prev, {
                       id: Date.now().toString() + '-tool',
                       role: 'system',
                       text: 'Code updated by Voice Agent',
                       timestamp: new Date()
                     }]);
                   }
                   
                   // Send tool response back
                   sessionPromise.then((session) => {
                     session.sendToolResponse({
                       functionResponses: [{
                         id: fc.id,
                         name: fc.name,
                         response: { result: 'Code updated successfully' }
                       }]
                     });
                   });
                 }
               }
             }

             // 2. Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputAudioContextRef.current && outputAnalyserRef.current) {
               const ctx = outputAudioContextRef.current;
               const buffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE);
               
               const source = ctx.createBufferSource();
               source.buffer = buffer;
               source.connect(outputAnalyserRef.current);
               
               const now = ctx.currentTime;
               const startAt = Math.max(nextStartTimeRef.current, now);
               source.start(startAt);
               nextStartTimeRef.current = startAt + buffer.duration;
             }

             // 3. Handle Transcriptions
             if (msg.serverContent?.inputTranscription) {
                currentInputRef.current += msg.serverContent.inputTranscription.text;
             }
             if (msg.serverContent?.outputTranscription) {
                currentOutputRef.current += msg.serverContent.outputTranscription.text;
             }

             if (msg.serverContent?.turnComplete) {
                const userText = currentInputRef.current.trim();
                const modelText = currentOutputRef.current.trim();

                if (userText) {
                  setMessages(prev => [...prev, {
                    id: Date.now().toString() + '-user',
                    role: 'user',
                    text: userText,
                    timestamp: new Date()
                  }]);
                }
                if (modelText) {
                   setMessages(prev => [...prev, {
                    id: Date.now().toString() + '-model',
                    role: 'model',
                    text: modelText,
                    timestamp: new Date()
                  }]);
                }

                currentInputRef.current = '';
                currentOutputRef.current = '';
             }
          },
          onclose: () => {
            setStatus('disconnected');
            setVolumeLevel(0);
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setStatus('error');
            setVolumeLevel(0);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to connect", error);
      setStatus('error');
    }
  }, [isMuted, status]);

  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setVolumeLevel(0);
    currentInputVolumeRef.current = 0;

    if (sessionRef.current) {
      sessionRef.current.then(session => {
         if(typeof session.close === 'function') session.close();
      });
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    outputAnalyserRef.current = null;

    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    }
  }, [disconnect]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    connect,
    disconnect,
    status,
    messages,
    isMuted,
    toggleMute,
    volumeLevel,
    currentCode,
  };
};