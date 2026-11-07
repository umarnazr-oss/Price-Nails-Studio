import { createContext } from 'react';

export type Language = 'fr' | 'en' | 'ru';

export type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

export const LanguageContext = createContext<LanguageContextValue | null>(null);
