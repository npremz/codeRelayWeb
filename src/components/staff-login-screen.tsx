"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { FormEvent, useMemo, useState } from "react";
import { Settings, Star, Lock } from "lucide-react";

type Role = "admin" | "judge";

type StaffLoginScreenProps = {
  preferredRole: Role;
  nextPath: string;
};

export function StaffLoginScreen({ preferredRole, nextPath }: StaffLoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(preferredRole);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const roleConfig = useMemo(
    () =>
      selectedRole === "admin"
        ? {
            label: "Organisateur",
            hint: "Accès au tableau de pilotage complet du tournoi",
            icon: <Settings size={16} className="inline-block mr-1" />
          }
        : {
            label: "Jury",
            hint: "Accès au cockpit de notation des équipes",
            icon: <Star size={16} className="inline-block mr-1" />
          },
    [selectedRole]
  );

  const redirectPath =
    selectedRole === preferredRole
      ? nextPath
      : selectedRole === "admin"
        ? "/admin"
        : "/judge";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/staff/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: selectedRole,
          code,
          nextPath: redirectPath
        })
      });

      const payload = (await response.json()) as { redirectPath?: string; error?: string };

      if (!response.ok || !payload.redirectPath) {
        throw new Error(payload.error ?? "Connexion staff impossible.");
      }

      window.location.href = payload.redirectPath;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Connexion staff impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setMessage("");

    try {
      await fetch("/api/staff/session", { method: "DELETE" });
      setCode("");
      setMessage("Session staff fermée.");
    } catch {
      setMessage("Impossible de fermer la session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppFrame
      title="Accès Staff"
      subtitle="Connexion sécurisée pour organisateurs et jury"
    >
      <div className="mx-auto max-w-xl">
        <Panel>
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Lock size={28} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Connexion Staff</h2>
              <p className="mt-1 text-sm text-text-muted">Entrez votre code d'accès pour continuer</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {(["admin", "judge"] as const).map((role) => (
                <button
                  key={role}
                  className={`rounded-xl border px-4 py-5 text-center transition-all ${
                    selectedRole === role
                      ? "border-accent/40 bg-accent/10 text-accent-light"
                      : "border-border bg-elevated text-text-faint hover:border-border-hover hover:text-text-muted"
                  }`}
                  onClick={() => setSelectedRole(role)}
                  type="button"
                >
                  <span className="flex justify-center text-2xl mb-2">{role === "admin" ? <Settings size={24} /> : <Star size={24} />}</span>
                  <span className="block text-sm font-bold uppercase tracking-wide">
                    {role === "admin" ? "Admin" : "Jury"}
                  </span>
                </button>
              ))}
            </div>

            {/* Role description */}
            <div className="rounded-xl border border-accent/15 bg-accent/5 px-4 py-3 text-sm text-accent-light">
              {roleConfig.icon} {roleConfig.hint}
            </div>

            <div className="rounded-xl border border-border bg-elevated/30 px-4 py-3 text-sm text-text-muted">
              Redirection après connexion: <span className="font-semibold text-text">{redirectPath}</span>
            </div>

            {/* Code input */}
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-faint">
                Code d'accès
              </span>
              <input
                className="signal-input"
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Entrez le code..."
              />
            </label>

            {/* Feedback message */}
            {message && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                message.includes("impossible") || message.includes("invalide")
                  ? "border-hot/20 bg-hot/5 text-hot"
                  : "border-success/20 bg-success/5 text-success"
              }`}>
                {message}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button className="signal-button flex-1" type="submit" disabled={busy || code.trim().length === 0}>
                {busy ? "Connexion..." : "Se connecter"}
              </button>
              <button className="ghost-button" onClick={handleLogout} type="button" disabled={busy}>
                Déconnexion
              </button>
            </div>
          </form>

          {/* Info section */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-bold text-text-muted">Niveaux d'accès</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-accent-light">→</span>
                <span><strong className="text-text">Participants</strong> — sans login, code équipe public + token secret</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-accent-light">→</span>
                <span><strong className="text-text">Admin</strong> — contrôle total du tournoi et des manches</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-accent-light">→</span>
                <span><strong className="text-text">Jury</strong> — notation et cockpit de correction</span>
              </li>
            </ul>
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}
