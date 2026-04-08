import { create } from 'zustand';
import type { ChatMessage } from '../types.ts';

const genId = (): string =>
  (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
  (Date.now().toString(36) + Math.random().toString(36).slice(2));

interface AvaChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isSpeaking: boolean;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  clearMessages: () => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useAvaChatStore = create<AvaChatState>()((set) => ({
  messages: [],
  isLoading: false,
  isSpeaking: false,

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: genId(), timestamp: Date.now() }],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSpeaking: (isSpeaking) => set({ isSpeaking }),
  clearMessages: () => set({ messages: [] }),
  setMessages: (messages) => set({ messages }),
}));
