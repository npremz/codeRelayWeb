"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type BriefQrCardProps = {
  url: string;
};

export function BriefQrCard({ url }: BriefQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function generateQrCode() {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "M",
          margin: 1,
          scale: 8,
          color: {
            dark: "#0f172a",
            light: "#f8fafc"
          }
        });

        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setQrDataUrl("");
        }
      }
    }

    void generateQrCode();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-light">QR brief</p>
      {qrDataUrl ? (
        <div className="mt-4 flex items-start gap-4">
          <img
            alt="QR code vers le brief public"
            className="h-32 w-32 rounded-xl border border-border bg-white p-2"
            height={128}
            src={qrDataUrl}
            width={128}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">Scanner pour ouvrir le brief</p>
            <p className="mt-2 break-all text-sm leading-6 text-text-muted">{url}</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Impossible de générer le QR pour le moment. URL du brief: {url}
        </p>
      )}
    </div>
  );
}
