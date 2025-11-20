export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LiveConfig {
  model: string;
  systemInstruction?: string;
  voiceName?: string;
}
