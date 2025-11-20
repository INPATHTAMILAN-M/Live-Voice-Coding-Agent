import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createAudioBlob, decodeAudioData } from '../utils/audio-utils';
import { Message, ConnectionStatus } from '../types';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000; // Gemini 2.5 Live default output
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const useLiveApi = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); 

  // Refs for audio context and processing
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
  
  // State buffer for transcriptions to handle partial updates
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  const connect = useCallback(async () => {
    if (status === 'connected' || status === 'connecting') return;

    try {
      setStatus('connecting');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      // Setup Output Analyser for Visualizer
      const outputCtx = outputAudioContextRef.current;
      outputAnalyserRef.current = outputCtx.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current.smoothingTimeConstant = 0.1;
      outputAnalyserRef.current.connect(outputCtx.destination);

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start Volume Monitoring Loop
      const updateVolume = () => {
        let outputVol = 0;
        if (outputAnalyserRef.current) {
           const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
           outputAnalyserRef.current.getByteFrequencyData(dataArray);
           // Calculate average volume from frequency data
           let sum = 0;
           for(let i=0; i < dataArray.length; i++) sum += dataArray[i];
           const avg = sum / dataArray.length;
           outputVol = avg / 255; 
        }
        
        const inputVol = currentInputVolumeRef.current;
        setVolumeLevel(Math.max(outputVol, inputVol));
        
        rafIdRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Connect to Gemini
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are an expert senior coding architect paired with a developer. You are helpful, concise, and focus on clean code principles. You are currently 'Live' in a VS Code-like environment. When asked, explain code concepts clearly. Act like a human pair programmer.",
          inputAudioTranscription: {}, // Enable User Transcription
          outputAudioTranscription: {}, // Enable Model Transcription
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setStatus('connected');
            setMessages([{
              id: 'system-1',
              role: 'system',
              text: 'Connected to Gemini Live Coding Agent.',
              timestamp: new Date()
            }]);

            // Start Audio Input Processing
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const ctx = inputAudioContextRef.current;
            const source = ctx.createMediaStreamSource(streamRef.current);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate input volume for visualizer
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              // Update ref for the animation loop
              currentInputVolumeRef.current = isMuted ? 0 : Math.min(1, rms * 3);

              if (isMuted) return; 

              const pcmBlob = createAudioBlob(inputData);
              
              // Send to Gemini
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
             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputAudioContextRef.current && outputAnalyserRef.current) {
               const ctx = outputAudioContextRef.current;
               const buffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE);
               
               const source = ctx.createBufferSource();
               source.buffer = buffer;
               
               // Connect source -> Analyser -> Destination
               source.connect(outputAnalyserRef.current);
               
               // Schedule gapless playback
               const now = ctx.currentTime;
               const startAt = Math.max(nextStartTimeRef.current, now);
               source.start(startAt);
               nextStartTimeRef.current = startAt + buffer.duration;
             }

             // Handle Transcriptions
             if (msg.serverContent?.inputTranscription) {
                currentInputRef.current += msg.serverContent.inputTranscription.text;
             }
             if (msg.serverContent?.outputTranscription) {
                currentOutputRef.current += msg.serverContent.outputTranscription.text;
             }

             // Turn Complete: Commit messages to state
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

                // Clear buffers
                currentInputRef.current = '';
                currentOutputRef.current = '';
             }
          },
          onclose: () => {
            console.log('Session Closed');
            setStatus('disconnected');
            setVolumeLevel(0);
            currentInputVolumeRef.current = 0;
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setStatus('error');
            setVolumeLevel(0);
            currentInputVolumeRef.current = 0;
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              text: 'Connection error occurred.',
              timestamp: new Date()
            }]);
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
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setVolumeLevel(0);
    currentInputVolumeRef.current = 0;

    if (sessionRef.current) {
      // Close the session
      sessionRef.current.then(session => {
         if(typeof session.close === 'function') session.close();
      });
      sessionRef.current = null;
    }

    // Stop Audio Contexts and Streams
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
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    
    setStatus('disconnected');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      text: 'Session ended.',
      timestamp: new Date()
    }]);
  }, []);

  // Clean up on unmount
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
    volumeLevel
  };
};