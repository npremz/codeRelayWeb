"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import { LiveNotification } from "@/lib/use-round-notifications";
import { X } from "lucide-react";

type LiveNotificationBannerProps = {
  notification: LiveNotification | null;
};

export function LiveNotificationBanner({ notification }: LiveNotificationBannerProps) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (notification && notification.id !== dismissedId) {
      gestureStartRef.current = null;
    }
  }, [dismissedId, notification]);

  if (!notification) {
    return null;
  }

  if (notification.id === dismissedId) {
    return null;
  }

  const currentNotification = notification;

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

  const tone = toneConfig[currentNotification.tone] ?? toneConfig.fog;

  function dismiss() {
    setDismissedId(currentNotification.id);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    gestureStartRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = gestureStartRef.current;
    gestureStartRef.current = null;

    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      dismiss();
    }
  }

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-50 animate-fade-in sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-md"
    >
      <div
        className={`pointer-events-auto rounded-2xl border ${tone.border} ${tone.bg} px-5 py-4 shadow-2xl backdrop-blur-sm`}
        onClick={dismiss}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot} animate-pulse-glow`} />
          <div className="min-w-0 flex-1">
            <p className={`font-display text-base font-bold tracking-tight ${tone.text}`}>
              {currentNotification.title}
            </p>
            <p className="mt-1 text-sm text-text-muted">{currentNotification.message}</p>
          </div>
          <button
            aria-label="Fermer la notification"
            className="touch-target -mr-2 -mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-black/5 hover:text-text"
            onClick={(event) => {
              event.stopPropagation();
              dismiss();
            }}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
