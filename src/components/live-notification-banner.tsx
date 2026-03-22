"use client";

import { LiveNotification } from "@/lib/use-round-notifications";

type LiveNotificationBannerProps = {
  notification: LiveNotification | null;
};

export function LiveNotificationBanner({ notification }: LiveNotificationBannerProps) {
  if (!notification) {
    return null;
  }

  const toneConfig = {
    lime: {
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-success",
      dot: "bg-success"
    },
    fog: {
      bg: "bg-elevated",
      border: "border-border",
      text: "text-text",
      dot: "bg-text-muted"
    },
    signal: {
      bg: "bg-hot/10",
      border: "border-hot/30",
      text: "text-hot",
      dot: "bg-hot"
    }
  };

  const tone = toneConfig[notification.tone] ?? toneConfig.fog;

  return (
    <aside className="pointer-events-none fixed right-5 top-5 z-50 max-w-md animate-fade-in">
      <div className={`rounded-2xl border ${tone.border} ${tone.bg} px-5 py-4 shadow-2xl backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <span className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot} animate-pulse-glow`} />
          <div>
            <p className={`font-display text-base font-bold tracking-tight ${tone.text}`}>
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-text-muted">{notification.message}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
