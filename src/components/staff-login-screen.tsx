"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { FormEvent, useMemo, useState } from "react";

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

  const hint = useMemo(
    () =>
      selectedRole === "admin"
        ? "Code orga requis pour le tableau de pilotage."
        : "Code correcteur requis pour le cockpit de notation.",
    [selectedRole]
  );

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
          nextPath
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
      setMessage("Session staff fermee.");
    } catch {
      setMessage("Impossible de fermer la session.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppFrame
      title="Staff Access"
      subtitle="Admin et juge passent par un code court partage. Les participants restent sans login et n'utilisent jamais cet ecran."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Access Control" title="Staff Login">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              {(["admin", "judge"] as const).map((role) => (
                <button
                  key={role}
                  className={`rounded-[1.4rem] border px-4 py-4 text-left uppercase tracking-[0.18em] transition ${
                    selectedRole === role
                      ? "border-signal/50 bg-signal/10 text-sand"
                      : "border-white/10 bg-white/5 text-fog"
                  }`}
                  onClick={() => setSelectedRole(role)}
                  type="button"
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="rounded-[1.4rem] border border-lime/20 bg-lime/10 p-4 text-sm text-lime">{hint}</div>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-fog">Access Code</span>
              <input
                className="signal-input"
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder={selectedRole === "admin" ? "admin-relay" : "judge-relay"}
              />
            </label>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("impossible") || message.includes("invalide") ? "text-signal" : "text-lime"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="signal-button" type="submit" disabled={busy || code.trim().length === 0}>
                {busy ? "Processing..." : "Open Staff Area"}
              </button>
              <button className="ghost-button" onClick={handleLogout} type="button" disabled={busy}>
                Logout
              </button>
            </div>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Rules" title="Auth Strategy">
            <ul className="space-y-3 text-sm text-fog">
              <li>Participants: aucun login, uniquement `teamCode` public et token secret de gestion.</li>
              <li>Staff: code partage court, transforme en cookie HttpOnly signe.</li>
              <li>Admin: acces exclusif au tableau d'organisation.</li>
              <li>Judge: acces au cockpit de correction et a l'API de scoring.</li>
            </ul>
          </Panel>

          <Panel eyebrow="Config" title="Environment">
            <ul className="space-y-3 text-sm text-fog">
              <li>`CODE_RELAY_ADMIN_CODE` pour l'acces organisateur.</li>
              <li>`CODE_RELAY_JUDGE_CODE` pour l'acces correcteur.</li>
              <li>`CODE_RELAY_SESSION_SECRET` pour signer les cookies staff.</li>
              <li>Sans variables, les valeurs locales par defaut restent `admin-relay` et `judge-relay`.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
