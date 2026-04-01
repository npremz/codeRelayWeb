"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  getBrowserLocale,
  getMessages,
  getStoredLocale,
  Locale,
  Messages,
  persistLocale
} from "@/lib/locale";

type LocaleSource = "cookie" | "header" | "default";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  initialLocale: Locale;
  initialSource: LocaleSource;
  children: React.ReactNode;
};

export function LocaleProvider({ initialLocale, initialSource, children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedLocale = getStoredLocale();
    const browserLocale = getBrowserLocale();
    const preferredLocale =
      initialSource === "cookie"
        ? initialLocale
        : storedLocale ?? browserLocale ?? initialLocale;

    setLocale(preferredLocale);
    persistLocale(preferredLocale);
    setHydrated(true);
  }, [initialLocale, initialSource]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    persistLocale(locale);
  }, [hydrated, locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        messages: getMessages(locale),
        setLocale
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }

  return context;
}
