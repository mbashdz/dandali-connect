"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ha";

interface Translations {
  [key: string]: {
    en: string;
    ha: string;
  };
}

const translations: Translations = {
  // Navigation & Branding
  brandTagline: {
    en: "African Social Network",
    ha: "Zauren Sada Zumuntar Afirka",
  },
  home: { en: "Home", ha: "Gida" },
  explore: { en: "Explore", ha: "Bincike" },
  kasuwa: { en: "Marketplace", ha: "Kasuwa" },
  notifications: { en: "Notifications", ha: "Sanarwa" },
  profile: { en: "Profile", ha: "Bayanina" },
  settings: { en: "Settings", ha: "Saituna" },
  logout: { en: "Log Out", ha: "Fita" },
  login: { en: "Log In", ha: "Shiga" },
  signup: { en: "Join Zaure", ha: "Yi Rajista" },
  
  // Feed & Composer
  createPost: { en: "Share on Zaure", ha: "Me ke faruwa?" },
  postPlaceholder: {
    en: "What's happening in your community today?",
    ha: "Mene ne sabo a garinku yau?",
  },
  photoVideo: { en: "Photo", ha: "Hoto" },
  voiceNote: { en: "Voice Note", ha: "Muryar Magana" },
  postButton: { en: "Post", ha: "Buga" },
  posting: { en: "Posting...", ha: "Ana Buga..." },
  noPostsYet: { 
    en: "No posts yet. Be the first to share something with the community!", 
    ha: "Babu rubutu tukuna. Kasance na farko da zai raba labari!" 
  },

  // Stories / Moments
  storiesTitle: { en: "Zaure Moments", ha: "Kowane Lokaci" },
  addStory: { en: "Your Moment", ha: "Lokacinka" },

  // Cultural Reactions
  like: { en: "Love", ha: "Ƙauna" },
  cheer: { en: "Bravo", ha: "Madalla" },
  fire: { en: "Hot / Lit", ha: "Wuta" },
  laugh: { en: "Haha", ha: "Dariya" },
  bless: { en: "Blessing", ha: "Alheri" },
  comment: { en: "Comment", ha: "Sharhi" },
  share: { en: "Share", ha: "Raba" },
  writeComment: { en: "Write a comment...", ha: "Rubuta ra'ayinka..." },

  // Marketplace
  kasuwaTitle: { en: "Zaure Marketplace", ha: "Kasuwar Zaure" },
  kasuwaSubtitle: {
    en: "Buy, sell, and trade safely with local community members across Africa.",
    ha: "Saya, sayar, da ciniki cikin aminci da mutanen garinku a fadin Afirka.",
  },
  sellItem: { en: "List an Item", ha: "Sanya Kaya" },
  allCategories: { en: "All Categories", ha: "Dukkan Bangarori" },
  contactSeller: { en: "Message Seller", ha: "Tuntubi Mai Kaya" },

  // Data Saver
  dataSaver: { en: "Data Saver", ha: "Tattalin Data" },
  dataSaverOn: { en: "Data Saver ON", ha: "Tattalin Data na Aiki" },
  dataSaverOff: { en: "Data Saver OFF", ha: "Kashe Tattalin Data" },

  // Search
  searchPlaceholder: {
    en: "Search Zaure for people, posts, or marketplace items...",
    ha: "Nemo mutane, labarai, ko kayan kasuwa a Zaure...",
  },
};

interface AppSettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  toggleDataSaver: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [dataSaver, setDataSaverState] = useState<boolean>(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("dandali_lang") as Language;
    if (savedLang === "en" || savedLang === "ha") {
      setLanguageState(savedLang);
    }
    const savedDataSaver = localStorage.getItem("dandali_datasaver");
    if (savedDataSaver !== null) {
      setDataSaverState(savedDataSaver === "true");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("dandali_lang", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "ha" : "en";
    setLanguage(nextLang);
  };

  const setDataSaver = (enabled: boolean) => {
    setDataSaverState(enabled);
    localStorage.setItem("dandali_datasaver", String(enabled));
  };

  const toggleDataSaver = () => {
    setDataSaver(!dataSaver);
  };

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <AppSettingsContext.Provider
      value={{
        language,
        setLanguage,
        dataSaver,
        setDataSaver,
        toggleDataSaver,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
}
