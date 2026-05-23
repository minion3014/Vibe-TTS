export interface VoicePreset {
  id: string;
  name: string;
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
  voiceName: string;
  rate: number;
  pitch: number;
  customTitle?: string;
}

export interface PresetText {
  id: string;
  title: string;
  text: string;
  language: string;
  category: string;
}
