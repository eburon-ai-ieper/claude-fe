import { create } from "zustand";

export const useChatSettings = create<{
  language: string;
  setLanguage: (lang: string) => void;
}>((set) => ({
  language: "en",
  setLanguage: (language) => set({ language }),
}));
