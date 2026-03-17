"use client";

import { LiveNotification } from "@/lib/use-round-notifications";

type LiveNotificationBannerProps = {
  notification: LiveNotification | null;
};

export function LiveNotificationBanner({ notification }: LiveNotificationBannerProps) {
  if (!notification) {
    return null;
  }

  const toneClassName =
    notification.tone === "lime"
      ? "border-lime/35 bg-lime/15 text-lime"
      : notification.tone === "fog"
        ? "border-white/15 bg-white/10 text-sand"
        : "border-signal/35 bg-signal/15 text-signal";

  return (
    <aside className="pointer-events-none fixed right-6 top-6 z-50 max-w-md animate-[fade-in_180ms_ease-out]">
      <div className={`rounded-[1.7rem] border px-5 py-4 shadow-glow backdrop-blur ${toneClassName}`}>
        <p className="text-xs uppercase tracking-[0.24em]">Live Notification</p>
        <h2 className="mt-2 font-display text-4xl uppercase leading-none">{notification.title}</h2>
        <p className="mt-3 text-sm text-current/90">{notification.message}</p>
      </div>
    </aside>
  );
}
