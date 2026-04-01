"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Locale, persistLocale } from "@/lib/locale";
import { useLocale } from "@/components/locale-provider";

type LanguageSwitchProps = {
  compact?: boolean;
};

const locales: Locale[] = ["fr", "en"];

export function LanguageSwitch({ compact = false }: LanguageSwitchProps) {
  const router = useRouter();
  const { locale, messages, setLocale } = useLocale();

  function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    persistLocale(nextLocale);
    setLocale(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center rounded-2xl border border-border bg-surface/70 p-1 shadow-sm ring-1 ring-border/40 backdrop-blur-xl ${
        compact ? "w-full justify-between" : ""
      }`}
      aria-label={messages.language.switchLabel}
      role="group"
    >
      {!compact && (
        <span className="px-2 text-[11px] font-bold uppercase tracking-[0.24em] text-text-faint">
          {messages.language.label}
        </span>
      )}
      <div className="flex items-center gap-1">
        {locales.map((entry) => {
          const active = locale === entry;

          return (
            <button
              key={entry}
              className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] transition-all ${
                active
                  ? "bg-elevated text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-border/60"
                  : "text-text-faint hover:text-text"
              }`}
              onClick={() => handleLocaleChange(entry)}
              type="button"
            >
              {messages.language[entry]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
