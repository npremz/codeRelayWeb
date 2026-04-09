"use client";

import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { Panel } from "@/components/panel";
import { PhaseTimer } from "@/components/phase-timer";
import { StaffStatusHeader } from "@/components/staff-status-header";
import {
  AdminRoundAction,
  LiveTeam,
  RoundSubject
} from "@/lib/game-types";
import {
  buildLiveTeams,
  canAdminMarkSubmission,
  canRunAdminRoundAction,
  getRelayState,
  getRoundActionLabel,
  getStatusLabel
} from "@/lib/demo-game";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FileEdit,
  FileText,
  Flag,
  Layers3,
  Lock,
  MessageCircle,
  Pause,
  Play,
  QrCode,
  Search,
  Trophy,
  Tv,
  Users,
  Wrench,
  Zap
} from "lucide-react";

type AdminScreenProps = {
  staffRole: "admin" | "judge";
};

type AdminTab = "live" | "teams" | "setup" | "tv";
type TeamFilter = "all" | "to_submit" | "to_review" | "active" | "locked" | "scored";
type FeedbackState = {
  area: AdminTab;
  tone: "success" | "error";
  text: string;
} | null;
type DialogState =
  | null
  | { kind: "roundAction"; action: AdminRoundAction }
  | { kind: "switchRound"; roundId: string; roundName: string }
  | { kind: "reset" };

const difficultyConfig = {
  easy: {
    label: "Facile",
    className: "border-success/20 bg-success/10 text-success"
  },
  medium: {
    label: "Moyen",
    className: "border-warn/20 bg-warn/10 text-warn"
  },
  hard: {
    label: "Difficile",
    className: "border-hot/20 bg-hot/10 text-hot"
  }
} satisfies Record<NonNullable<RoundSubject["difficulty"]>, { label: string; className: string }>;

const actionConfig: Record<
  AdminRoundAction,
  {
    label: string;
    icon: ReactNode;
    color: string;
    desc: string;
    confirmTitle?: string;
    confirmDescription?: string;
  }
> = {
  open_registration: {
    label: "Ouvrir les inscriptions",
    icon: <FileEdit size={18} />,
    color: "text-success",
    desc: "Autoriser de nouvelles équipes à entrer dans la manche."
  },
  close_registration: {
    label: "Fermer les inscriptions",
    icon: <Lock size={18} />,
    color: "text-warn",
    desc: "Figer les nouvelles inscriptions avant le lancement.",
    confirmTitle: "Fermer les inscriptions ?",
    confirmDescription: "Les nouvelles équipes ne pourront plus rejoindre la manche courante."
  },
  start_reflection: {
    label: "Lancer la réflexion",
    icon: <MessageCircle size={18} />,
    color: "text-cyan",
    desc: "Démarrer le temps d’échange collectif avant le relais.",
    confirmTitle: "Lancer la réflexion ?",
    confirmDescription: "Les équipes passent en phase de préparation et les compositions deviennent verrouillées."
  },
  start_relay: {
    label: "Lancer le relais",
    icon: <Zap size={18} />,
    color: "text-hot",
    desc: "Démarrer les tours de clavier et le chrono principal.",
    confirmTitle: "Lancer le relais ?",
    confirmDescription: "Le codage commence immédiatement pour toutes les équipes."
  },
  pause_round: {
    label: "Pause",
    icon: <Pause size={18} />,
    color: "text-warn",
    desc: "Geler le chrono sans quitter la phase courante."
  },
  resume_round: {
    label: "Reprendre",
    icon: <Play size={18} />,
    color: "text-success",
    desc: "Relancer la manche exactement où elle s’était arrêtée."
  },
  close_round: {
    label: "Clôturer la manche",
    icon: <Flag size={18} />,
    color: "text-accent-light",
    desc: "Passer la manche en état terminé pour finaliser les scores.",
    confirmTitle: "Clôturer la manche ?",
    confirmDescription: "Le chrono s’arrête et le back-office bascule en phase de finalisation."
  },
  show_brief_tv: {
    label: "Afficher le brief",
    icon: <FileText size={18} />,
    color: "text-cyan",
    desc: "Basculer l’écran TV sur le brief de la manche."
  },
  show_leaderboard_tv: {
    label: "Afficher le classement",
    icon: <Trophy size={18} />,
    color: "text-warn",
    desc: "Montrer le podium et le classement live."
  },
  show_live_tv: {
    label: "Afficher le classement",
    icon: <Tv size={18} />,
    color: "text-accent-light",
    desc: "Alias historique vers la vue classement."
  },
  show_registration_qr: {
    label: "Afficher le QR d’inscription",
    icon: <QrCode size={18} />,
    color: "text-cyan",
    desc: "Diffuser le QR de création d’équipe sur la TV."
  }
};

const mobileTabs: Array<{ id: AdminTab; label: string; icon: ReactNode }> = [
  { id: "live", label: "Live", icon: <Zap size={16} /> },
  { id: "teams", label: "Équipes", icon: <Users size={16} /> },
  { id: "setup", label: "Setup", icon: <Wrench size={16} /> },
  { id: "tv", label: "TV", icon: <Tv size={16} /> }
];

const teamFilters: Array<{ id: TeamFilter; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "to_submit", label: "À soumettre" },
  { id: "to_review", label: "À corriger" },
  { id: "active", label: "Actives" },
  { id: "locked", label: "Verrouillées" },
  { id: "scored", label: "Corrigées" }
];

async function readApiJson<T>(response: Response): Promise<T> {
  const raw = await response.text();

  if (!raw) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return JSON.parse(raw) as T;
  }

  const message = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  throw new Error(
    message
      ? `Le serveur a renvoyé une réponse invalide (${response.status}) : ${message}`
      : `Le serveur a renvoyé une réponse invalide (${response.status}).`
  );
}

function getStationOrder(station: string) {
  const match = station.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function summarizeText(value: string, maxLength = 170) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}…`;
}

function getOperationalPriority(team: LiveTeam) {
  if (team.status === "coding") {
    return 0;
  }

  if (team.status === "submitted") {
    return 1;
  }

  if (team.status === "ready") {
    return 2;
  }

  if (team.status === "registered") {
    return 3;
  }

  return 4;
}

function matchesTeamFilter(team: LiveTeam, filter: TeamFilter, canMarkSubmission: boolean) {
  switch (filter) {
    case "to_submit":
      return canMarkSubmission && team.submissionOrder === null && team.status !== "scored";
    case "to_review":
      return team.status === "submitted";
    case "active":
      return team.status === "coding";
    case "locked":
      return team.locked;
    case "scored":
      return team.status === "scored";
    case "all":
    default:
      return true;
  }
}

function InlineFeedback({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        feedback.tone === "error"
          ? "border-hot/20 bg-hot/5 text-hot"
          : "border-success/20 bg-success/5 text-success"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
            feedback.tone === "error" ? "bg-hot" : "bg-success"
          }`}
        />
        <p className="m-0">{feedback.text}</p>
      </div>
    </div>
  );
}

export function AdminScreen({ staffRole }: AdminScreenProps) {
  const [now, setNow] = useState(0);
  const [activeTab, setActiveTab] = useState<AdminTab>("live");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const { teams: storedTeams, round, currentRound, rounds, refresh, connected } = useLiveTeams();

  const [showCreateRound, setShowCreateRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState("");
  const [cloneTeams, setCloneTeams] = useState(false);
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [subjects, setSubjects] = useState<RoundSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newRoundSubjectId, setNewRoundSubjectId] = useState("");
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [creatingRound, setCreatingRound] = useState(false);
  const [resettingEvent, setResettingEvent] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSubjects() {
      try {
        const response = await fetch("/api/admin/subjects", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Impossible de charger les sujets.");
        }

        const payload = await readApiJson<{ subjects?: RoundSubject[] }>(response);

        if (!cancelled) {
          setSubjects(payload.subjects ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            area: "setup",
            tone: "error",
            text: error instanceof Error ? error.message : "Impossible de charger les sujets."
          });
        }
      } finally {
        if (!cancelled) {
          setSubjectsLoading(false);
        }
      }
    }

    void loadSubjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedSubjectId(currentRound?.subject?.id ?? "");
  }, [currentRound?.id, currentRound?.subject?.id]);

  const relayState = useMemo(() => getRelayState(round, now), [round, now]);
  const notification = useRoundNotifications(relayState);
  const teams = useMemo(() => buildLiveTeams(storedTeams, relayState), [storedTeams, relayState]);
  const canMarkSubmission = canAdminMarkSubmission(round);
  const operationalTeams = useMemo(
    () =>
      [...teams].sort((left, right) => {
        const priorityDiff = getOperationalPriority(left) - getOperationalPriority(right);

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        const stationDiff = getStationOrder(left.station) - getStationOrder(right.station);

        if (stationDiff !== 0) {
          return stationDiff;
        }

        return left.name.localeCompare(right.name, "fr");
      }),
    [teams]
  );
  const visibleTeams = useMemo(() => {
    const search = teamSearch.trim().toLowerCase();

    return operationalTeams.filter((team) => {
      if (!matchesTeamFilter(team, teamFilter, canMarkSubmission)) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [team.name, team.teamCode ?? "", team.station, ...team.members.map((member) => member.name)]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [canMarkSubmission, operationalTeams, teamFilter, teamSearch]);

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? null;
  const newRoundSubject = subjects.find((subject) => subject.id === newRoundSubjectId) ?? null;
  const subjectEditingLocked = round.phase !== "draft";
  const subjectSelectionChanged = selectedSubjectId !== (currentRound?.subject?.id ?? "");
  const adminBusy = busyAction !== null || creatingRound || assigningSubject || resettingEvent;

  function setAreaFeedback(area: AdminTab, text: string, tone: "success" | "error") {
    setFeedback({ area, text, tone });
  }

  function clearAreaFeedback(area: AdminTab) {
    setFeedback((current) => (current?.area === area ? null : current));
  }

  function renderAreaFeedback(area: AdminTab) {
    return feedback?.area === area ? <InlineFeedback feedback={feedback} /> : null;
  }

  function getTvModeLabel(mode: typeof round.tvDisplayMode) {
    switch (mode) {
      case "registration_qr":
        return "QR inscription";
      case "brief":
        return "Brief";
      case "leaderboard":
      default:
        return "Classement";
    }
  }

  function getTvModeTextClass(mode: typeof round.tvDisplayMode) {
    switch (mode) {
      case "registration_qr":
        return "text-cyan";
      case "brief":
        return "text-accent-light";
      case "leaderboard":
      default:
        return "text-warn";
    }
  }

  function resolveSubjectDifficulty(subject: RoundSubject | null | undefined) {
    return subject?.difficulty ?? subjects.find((candidate) => candidate.id === subject?.id)?.difficulty;
  }

  function resolveSubjectPrototype(subject: RoundSubject | null | undefined) {
    return subject?.prototype ?? subjects.find((candidate) => candidate.id === subject?.id)?.prototype;
  }

  function renderDifficultyBadge(subject: RoundSubject | null | undefined) {
    const difficulty = resolveSubjectDifficulty(subject);

    if (!difficulty) {
      return null;
    }

    const config = difficultyConfig[difficulty];

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${config.className}`}
      >
        {config.label}
      </span>
    );
  }

  function canUnlockTeam(team: LiveTeam) {
    return !(team.status === "submitted" || team.status === "scored");
  }

  function openRoundActionDialog(action: AdminRoundAction) {
    const config = actionConfig[action];

    if (config.confirmTitle) {
      clearAreaFeedback("live");
      setDialogState({ kind: "roundAction", action });
      return;
    }

    void runRoundAction(action);
  }

  async function runRoundAction(action: AdminRoundAction) {
    setBusyAction(action);
    clearAreaFeedback(action.startsWith("show_") ? "tv" : "live");

    try {
      const response = await fetch("/api/admin/round", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Action admin impossible.");
      }

      await refresh();
      setAreaFeedback(action.startsWith("show_") ? "tv" : "live", "État mis à jour.", "success");
    } catch (error) {
      setAreaFeedback(
        action.startsWith("show_") ? "tv" : "live",
        error instanceof Error ? error.message : "Action admin impossible.",
        "error"
      );
    } finally {
      setBusyAction(null);
      setDialogState(null);
    }
  }

  async function setTeamSubmission(teamCode: string, submitted: boolean) {
    const actionKey = `${submitted ? "submit" : "undo-submit"}-${teamCode}`;
    setBusyAction(actionKey);
    clearAreaFeedback("teams");

    try {
      const response = await fetch(`/api/admin/submissions/${teamCode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ submitted })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de mettre à jour la soumission.");
      }

      await refresh();
      setAreaFeedback("teams", submitted ? "Soumission enregistrée." : "Soumission annulée.", "success");
    } catch (error) {
      setAreaFeedback(
        "teams",
        error instanceof Error ? error.message : "Impossible de mettre à jour la soumission.",
        "error"
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function setTeamLock(teamCode: string, locked: boolean) {
    const actionKey = `${locked ? "lock" : "unlock"}-${teamCode}`;
    setBusyAction(actionKey);
    clearAreaFeedback("teams");

    try {
      const response = await fetch(`/api/admin/teams/${teamCode}/lock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ locked })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de modifier le verrouillage.");
      }

      await refresh();
      setAreaFeedback("teams", locked ? "Équipe verrouillée." : "Équipe déverrouillée.", "success");
    } catch (error) {
      setAreaFeedback(
        "teams",
        error instanceof Error ? error.message : "Impossible de modifier le verrouillage.",
        "error"
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateRound() {
    setCreatingRound(true);
    clearAreaFeedback("setup");

    try {
      const response = await fetch("/api/admin/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoundName.trim() || undefined,
          cloneTeams,
          makeCurrent,
          subjectId: newRoundSubjectId || undefined
        })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de créer la manche.");
      }

      await refresh();
      setAreaFeedback("setup", "Nouvelle manche créée.", "success");
      setShowCreateRound(false);
      setNewRoundName("");
      setCloneTeams(false);
      setMakeCurrent(true);
      setNewRoundSubjectId("");
    } catch (error) {
      setAreaFeedback("setup", error instanceof Error ? error.message : "Impossible de créer la manche.", "error");
    } finally {
      setCreatingRound(false);
    }
  }

  async function handleAssignSubject() {
    if (!currentRound) {
      return;
    }

    setAssigningSubject(true);
    clearAreaFeedback("setup");

    try {
      const response = await fetch("/api/admin/round/subject", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roundId: currentRound.id,
          subjectId: selectedSubjectId || null
        })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible d’assigner le sujet.");
      }

      await refresh();
      setAreaFeedback(
        "setup",
        selectedSubjectId ? "Sujet assigné à la manche." : "Sujet retiré de la manche.",
        "success"
      );
    } catch (error) {
      setAreaFeedback(
        "setup",
        error instanceof Error ? error.message : "Impossible d’assigner le sujet.",
        "error"
      );
    } finally {
      setAssigningSubject(false);
    }
  }

  async function handleSwitchRound(roundId: string) {
    setBusyAction(`switch-${roundId}`);
    clearAreaFeedback("setup");

    try {
      const response = await fetch("/api/admin/rounds/current", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId
        })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de changer de manche.");
      }

      await refresh();
      setAreaFeedback("setup", "Manche active changée.", "success");
    } catch (error) {
      setAreaFeedback("setup", error instanceof Error ? error.message : "Impossible de changer de manche.", "error");
    } finally {
      setBusyAction(null);
      setDialogState(null);
    }
  }

  async function handleResetEventData() {
    setResettingEvent(true);
    clearAreaFeedback("setup");

    try {
      const response = await fetch("/api/admin/event-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirmationText: resetConfirmationText })
      });

      const payload = await readApiJson<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de réinitialiser l’édition.");
      }

      await refresh();
      setShowCreateRound(false);
      setNewRoundName("");
      setCloneTeams(false);
      setMakeCurrent(true);
      setNewRoundSubjectId("");
      setResetConfirmationText("");
      setAreaFeedback("setup", "Nouvelle édition prête.", "success");
      setDialogState(null);
    } catch (error) {
      setAreaFeedback(
        "setup",
        error instanceof Error ? error.message : "Impossible de réinitialiser l’édition.",
        "error"
      );
    } finally {
      setResettingEvent(false);
    }
  }

  function getFilterCount(filter: TeamFilter) {
    return operationalTeams.filter((team) => matchesTeamFilter(team, filter, canMarkSubmission)).length;
  }

  function renderActionCard(action: AdminRoundAction) {
    const config = actionConfig[action];
    const isAllowed = canRunAdminRoundAction(round, action);

    return (
      <button
        key={action}
        className="group flex min-h-[76px] items-start gap-3 rounded-2xl border border-border bg-elevated/40 px-4 py-4 text-left transition-all hover:border-border-hover hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
        disabled={adminBusy || !isAllowed}
        onClick={() => openRoundActionDialog(action)}
        type="button"
      >
        <span className="mt-0.5 text-xl">{config.icon}</span>
        <div>
          <p className={`text-sm font-bold ${config.color}`}>
            {busyAction === action ? "..." : config.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-faint">{config.desc}</p>
        </div>
      </button>
    );
  }

  function renderLiveSection() {
    return (
      <div className="space-y-6">
        <PhaseTimer state={relayState} />

        <Panel accent="hot" eyebrow="Commandes" title="Actions opérateur">
          <div className="space-y-4">
            {renderAreaFeedback("live")}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "open_registration",
                "close_registration",
                "start_reflection",
                "start_relay",
                "pause_round",
                "resume_round",
                "close_round"
              ].map((action) => renderActionCard(action as AdminRoundAction))}
            </div>
          </div>
        </Panel>

        <Panel accent="warn" eyebrow="Terrain" title="Rappels d’arbitrage">
          <details className="group" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-text">
              Garder les règles sous la main
              <span className="text-text-faint transition-transform group-open:rotate-180">⌃</span>
            </summary>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Vérifier le silence total autour du joueur au clavier pendant son tour.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                La rotation ne peut jamais être sautée, même si un joueur pense aller plus vite.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Les notes papier préparées pendant les 5 minutes sont autorisées, rien d’autre.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-warn font-bold">!</span>
                Le bonus vitesse suit l’ordre réel de soumission, pas l’ordre théorique.
              </li>
            </ul>
          </details>
        </Panel>
      </div>
    );
  }

  function renderTeamsSection() {
    return (
      <Panel accent="accent" eyebrow="Supervision" title="Équipes">
        <div className="space-y-4">
          {renderAreaFeedback("teams")}

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
              <input
                className="signal-input pl-11"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
                placeholder="Rechercher par nom, code, station ou membre"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {teamFilters.map((filter) => (
                <button
                  key={filter.id}
                  className="segment-button"
                  data-active={teamFilter === filter.id}
                  onClick={() => setTeamFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-text-faint ring-1 ring-border/70">
                    {getFilterCount(filter.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-elevated/30 px-4 py-3 text-sm text-text-muted">
            {visibleTeams.length} équipe(s) visibles · ordre priorisé par action terrain puis station
          </div>

          {visibleTeams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-elevated/20 px-5 py-10 text-center text-sm text-text-muted">
              Aucun résultat pour ce filtre.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleTeams.map((team) => {
                const statusLabel = getStatusLabel(team.status);
                const submissionButtonBusy = busyAction === `submit-${team.teamCode}` || busyAction === `undo-submit-${team.teamCode}`;
                const lockButtonBusy = busyAction === `lock-${team.teamCode}` || busyAction === `unlock-${team.teamCode}`;
                const canMarkTeamSubmitted = canMarkSubmission && team.submissionOrder === null && team.status !== "scored";

                return (
                  <article
                    key={team.id}
                    className="rounded-[1.6rem] border border-border bg-surface px-5 py-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="surface-chip text-accent-light">{team.station}</span>
                          <span className="surface-chip text-text-faint">{team.teamCode ?? "NO-CODE"}</span>
                          <span className={`surface-chip ${team.locked ? "text-hot" : "text-success"}`}>
                            {team.locked ? "Verrouillée" : "Déverrouillée"}
                          </span>
                        </div>
                        <h3 className="mt-3 break-safe font-display text-2xl font-bold tracking-tight text-text">
                          {team.name}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                              statusLabel === "En codage"
                                ? "border-hot/20 bg-hot/10 text-hot"
                                : statusLabel === "Soumise"
                                  ? "border-accent/20 bg-accent/10 text-accent-light"
                                  : statusLabel === "Corrigée"
                                    ? "border-success/20 bg-success/10 text-success"
                                    : statusLabel === "Prête"
                                      ? "border-cyan/20 bg-cyan/10 text-cyan"
                                      : "border-border bg-elevated text-text-faint"
                            }`}
                          >
                            {statusLabel}
                          </span>

                          {team.activeMember ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-hot/20 bg-hot/10 px-3 py-1 text-xs font-bold text-hot">
                              <span className="inline-block h-2 w-2 rounded-full bg-hot animate-pulse-glow" />
                              {team.activeMember.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border bg-elevated px-3 py-1 text-xs text-text-faint">
                              Aucun joueur actif
                            </span>
                          )}

                          {team.submissionOrder !== null && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                              <CheckCircle2 size={14} />
                              Soumise #{team.submissionOrder}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
                        <button
                          className="signal-button w-full"
                          disabled={!canMarkTeamSubmitted || submissionButtonBusy}
                          onClick={() => void setTeamSubmission(team.teamCode ?? "", true)}
                          type="button"
                        >
                          {submissionButtonBusy && busyAction === `submit-${team.teamCode}` ? "..." : "Marquer soumise"}
                        </button>
                        <button
                          className="ghost-button w-full"
                          disabled={team.submissionOrder === null || team.status === "scored" || submissionButtonBusy}
                          onClick={() => void setTeamSubmission(team.teamCode ?? "", false)}
                          type="button"
                        >
                          {submissionButtonBusy && busyAction === `undo-submit-${team.teamCode}` ? "..." : "Annuler soumission"}
                        </button>
                        <button
                          className="ghost-button w-full"
                          disabled={lockButtonBusy || (team.locked && !canUnlockTeam(team))}
                          onClick={() => void setTeamLock(team.teamCode ?? "", !team.locked)}
                          type="button"
                        >
                          {lockButtonBusy
                            ? "..."
                            : team.locked
                              ? canUnlockTeam(team)
                                ? "Déverrouiller"
                                : "Verrouillée"
                              : "Verrouiller"}
                        </button>
                        <Link
                          className="ghost-button w-full"
                          href={`/judge?team=${encodeURIComponent(team.teamCode ?? "")}`}
                        >
                          Ouvrir au jury
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {team.members.map((member) => {
                        const isActive = team.activeMember?.id === member.id;

                        return (
                          <div
                            key={member.id}
                            className={`rounded-2xl border px-4 py-4 ${
                              isActive ? "border-hot/30 bg-hot/10" : "border-border bg-elevated/20"
                            }`}
                          >
                            <p className={`text-[11px] font-bold uppercase tracking-[0.18em] ${isActive ? "text-hot" : "text-text-faint"}`}>
                              Relais {member.relayOrder}
                            </p>
                            <p className={`mt-2 text-sm ${isActive ? "font-bold text-hot" : "text-text"}`}>
                              {member.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Panel>
    );
  }

  function renderSetupSection() {
    return (
      <div className="space-y-6">
        <Panel accent="accent" eyebrow="Manches" title="Pilotage de la manche">
          <div className="space-y-4">
            {renderAreaFeedback("setup")}

            {currentRound && (
              <div className="rounded-[1.6rem] border border-accent/20 bg-accent/5 px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">Manche active</p>
                    <h3 className="mt-2 break-safe font-display text-2xl font-bold tracking-tight text-text">
                      {currentRound.name || `Manche ${currentRound.sequence}`}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted">
                      {getRoundActionLabel(currentRound.phase)} · {currentRound.teamCount} équipes
                    </p>
                    {currentRound.subject ? (
                      <div className="mt-3 space-y-2 text-sm text-text-muted">
                        <p className="break-safe font-semibold text-text">{currentRound.subject.title}</p>
                        <p className="code-break-safe text-xs">{currentRound.subject.fileName}</p>
                        {renderDifficultyBadge(currentRound.subject)}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-text-muted">Aucun sujet assigné pour le moment.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:w-[220px]">
                    <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">Équipes</p>
                      <p className="mt-2 font-display text-3xl font-bold text-text">{currentRound.teamCount}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface px-4 py-4 text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">Phase</p>
                      <p className="mt-2 text-sm font-bold text-text">{getRoundActionLabel(round.phase)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">Toutes les manches</p>
              {rounds.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    entry.isCurrent ? "border-accent/25 bg-accent/8" : "border-border bg-elevated/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`break-safe text-base font-bold ${entry.isCurrent ? "text-accent-light" : "text-text"}`}>
                          {entry.name || `Manche ${entry.sequence}`}
                        </p>
                        {entry.isCurrent && <span className="surface-chip text-accent-light">Active</span>}
                      </div>
                      <p className="mt-1 text-sm text-text-faint">
                        {getRoundActionLabel(entry.phase)} · {entry.teamCount} équipes
                      </p>
                      {entry.subject && (
                        <p className="mt-2 break-safe text-sm text-text-muted">
                          {entry.subject.title}
                        </p>
                      )}
                    </div>

                    {!entry.isCurrent && (
                      <button
                        className="ghost-button w-full lg:w-auto"
                        disabled={adminBusy}
                        onClick={() => setDialogState({ kind: "switchRound", roundId: entry.id, roundName: entry.name || `Manche ${entry.sequence}` })}
                        type="button"
                      >
                        {busyAction === `switch-${entry.id}` ? "..." : "Activer"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!showCreateRound ? (
              <button
                className="ghost-button w-full"
                onClick={() => setShowCreateRound(true)}
                disabled={resettingEvent}
                type="button"
              >
                + Créer une nouvelle manche
              </button>
            ) : (
              <div className="space-y-4 rounded-[1.6rem] border border-border bg-elevated/30 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-surface p-3 text-accent-light ring-1 ring-border">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-light">Nouvelle manche</p>
                    <p className="text-sm text-text-muted">Créer puis éventuellement basculer dessus.</p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">
                    Nom
                  </span>
                  <input
                    className="signal-input"
                    value={newRoundName}
                    onChange={(event) => setNewRoundName(event.target.value)}
                    placeholder="Ex: Demi-finale"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">
                    Sujet initial
                  </span>
                  <select
                    className="signal-input"
                    value={newRoundSubjectId}
                    onChange={(event) => setNewRoundSubjectId(event.target.value)}
                    disabled={subjectsLoading}
                  >
                    <option value="">Aucun sujet pour l’instant</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {`${difficultyConfig[subject.difficulty ?? "medium"].label} · ${subject.title}`}
                      </option>
                    ))}
                  </select>
                </label>

                {newRoundSubject && (
                  <div className="rounded-2xl border border-cyan/20 bg-cyan/5 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-safe text-sm font-bold text-cyan">{newRoundSubject.title}</p>
                      {renderDifficultyBadge(newRoundSubject)}
                    </div>
                    <p className="mt-2 text-sm text-text">{newRoundSubject.fileName}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {summarizeText(newRoundSubject.brief)}
                    </p>
                  </div>
                )}

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={cloneTeams}
                    onChange={(event) => setCloneTeams(event.target.checked)}
                    className="h-5 w-5 rounded border-border bg-elevated accent-accent"
                  />
                  Cloner les équipes de la manche actuelle
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={makeCurrent}
                    onChange={(event) => setMakeCurrent(event.target.checked)}
                    className="h-5 w-5 rounded border-border bg-elevated accent-accent"
                  />
                  Rendre active immédiatement
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="signal-button flex-1"
                    onClick={handleCreateRound}
                    disabled={creatingRound || resettingEvent}
                    type="button"
                  >
                    {creatingRound ? "Création..." : "Créer la manche"}
                  </button>
                  <button
                    className="ghost-button flex-1"
                    onClick={() => setShowCreateRound(false)}
                    disabled={creatingRound || resettingEvent}
                    type="button"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel accent="cyan" eyebrow="Sujet" title="Sujet de la manche">
          <div className="space-y-4">
            <div className="rounded-[1.6rem] border border-cyan/20 bg-cyan/5 px-5 py-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan">Sujet actuel</p>
              {currentRound?.subject ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h3 className="break-safe font-display text-2xl font-bold tracking-tight text-text">
                      {currentRound.subject.title}
                    </h3>
                    {renderDifficultyBadge(currentRound.subject)}
                  </div>
                  <p className="mt-2 text-sm text-text">{currentRound.subject.fileName}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {summarizeText(currentRound.subject.brief)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-text-muted">Aucun sujet n’est encore assigné à cette manche.</p>
              )}
            </div>

            {subjectsLoading ? (
              <p className="text-sm text-text-muted">Chargement du catalogue des sujets…</p>
            ) : (
              <>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">
                    Choisir un sujet
                  </span>
                  <select
                    className="signal-input"
                    value={selectedSubjectId}
                    onChange={(event) => setSelectedSubjectId(event.target.value)}
                    disabled={!currentRound || assigningSubject}
                  >
                    <option value="">Aucun sujet</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.title} · {subject.fileName}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedSubject && (
                  <div className="rounded-2xl border border-border bg-elevated/20 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-safe text-sm font-bold text-text">{selectedSubject.title}</p>
                      {renderDifficultyBadge(selectedSubject)}
                    </div>
                    <p className="mt-2 text-sm text-text-muted">{selectedSubject.fileName}</p>
                    {resolveSubjectPrototype(selectedSubject) && (
                      <code className="code-break-safe mt-3 block rounded-2xl border border-border/70 bg-surface px-3 py-3 text-sm text-text">
                        {resolveSubjectPrototype(selectedSubject)}
                      </code>
                    )}
                    <p className="mt-3 text-sm leading-6 text-text-muted">
                      {summarizeText(selectedSubject.brief)}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="signal-button flex-1"
                    onClick={handleAssignSubject}
                    disabled={!currentRound || assigningSubject || resettingEvent || !subjectSelectionChanged || subjectEditingLocked}
                    type="button"
                  >
                    {assigningSubject ? "Mise à jour..." : selectedSubjectId ? "Appliquer le sujet" : "Retirer le sujet"}
                  </button>
                  <Link className="ghost-button flex-1" href="/brief" target="_blank" rel="noreferrer">
                    Ouvrir le brief public
                  </Link>
                </div>

                <p className={`text-sm ${subjectEditingLocked ? "text-warn" : "text-text-faint"}`}>
                  {subjectEditingLocked
                    ? "Le sujet est verrouillé dès que la manche quitte l’état de préparation."
                    : "Le sujet reste modifiable tant que la réflexion n’a pas commencé."}
                </p>
              </>
            )}
          </div>
        </Panel>

        <Panel accent="hot" eyebrow="Édition" title="Nouvelle édition">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-text-muted">
              Cette action supprime toutes les manches, inscriptions, soumissions et scores, puis recrée une manche initiale vide.
            </p>
            <button
              className="signal-button bg-hot text-white hover:bg-hot/90"
              disabled={adminBusy}
              onClick={() => {
                clearAreaFeedback("setup");
                setResetConfirmationText("");
                setDialogState({ kind: "reset" });
              }}
              type="button"
            >
              Réinitialiser pour une nouvelle édition
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  function renderTvSection() {
    const tvActions: AdminRoundAction[] = ["show_registration_qr", "show_brief_tv", "show_leaderboard_tv"];

    return (
      <Panel accent="cyan" eyebrow="TV" title="Pilotage de l’écran TV">
        <div className="space-y-4">
          {renderAreaFeedback("tv")}

          <div className="rounded-[1.6rem] border border-cyan/20 bg-cyan/5 px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan">Vue active</p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-text">
              {round.tvDisplayMode === "registration_qr"
                ? "QR de création d’équipe"
                : round.tvDisplayMode === "brief"
                  ? "Vue brief"
                  : "Vue classement"}
            </h3>
            <p className={`mt-3 text-sm font-semibold ${getTvModeTextClass(round.tvDisplayMode)}`}>
              {getTvModeLabel(round.tvDisplayMode)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tvActions.map((action) => {
              const config = actionConfig[action];
              const isActive =
                (action === "show_registration_qr" && round.tvDisplayMode === "registration_qr") ||
                (action === "show_brief_tv" && round.tvDisplayMode === "brief") ||
                (action === "show_leaderboard_tv" && round.tvDisplayMode === "leaderboard");

              return (
                <button
                  key={action}
                  className={`group flex min-h-[84px] items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? "border-accent/30 bg-accent/10"
                      : "border-border bg-elevated/40 hover:border-border-hover hover:bg-elevated"
                  }`}
                  disabled={adminBusy || isActive}
                  onClick={() => void runRoundAction(action)}
                  type="button"
                >
                  <span className="mt-0.5 text-xl">{config.icon}</span>
                  <div>
                    <p className={`text-sm font-bold ${config.color}`}>
                      {busyAction === action ? "..." : config.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-text-faint">{config.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <Link className="ghost-button w-full" href="/tv" target="_blank" rel="noreferrer">
            Ouvrir la TV dans un nouvel onglet
          </Link>
        </div>
      </Panel>
    );
  }

  const dialogConfirmDisabled =
    dialogState?.kind === "reset" ? resetConfirmationText.trim().toUpperCase() !== "RESET" : false;

  return (
    <AppFrame
      title="Pilotage"
      subtitle="Tableau de bord organisateur"
      currentRound={currentRound}
      navigation="staff"
      staffRole={staffRole}
    >
      <LiveNotificationBanner notification={notification} />
      <div className="sticky top-0 z-20 -mx-1 mb-4 grid grid-cols-4 gap-2 bg-void/92 px-1 py-2 backdrop-blur-xl xl:hidden">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            className="segment-button min-w-0 !gap-1 !px-2 !text-[12px]"
            data-active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <StaffStatusHeader
        currentRound={currentRound}
        relayState={relayState}
        registrationOpen={round.registrationOpen}
        connected={connected}
        teams={teams}
      />

      <div className="space-y-6 xl:hidden">
        {activeTab === "live" && renderLiveSection()}
        {activeTab === "teams" && renderTeamsSection()}
        {activeTab === "setup" && renderSetupSection()}
        {activeTab === "tv" && renderTvSection()}
      </div>

      <div className="hidden gap-6 xl:grid xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          {renderLiveSection()}
          {renderSetupSection()}
          {renderTvSection()}
        </div>
        <div className="space-y-6">{renderTeamsSection()}</div>
      </div>

      <ConfirmDialog
        open={dialogState !== null}
        title={
          dialogState?.kind === "roundAction"
            ? actionConfig[dialogState.action].confirmTitle ?? actionConfig[dialogState.action].label
            : dialogState?.kind === "switchRound"
              ? "Activer cette manche ?"
              : "Réinitialiser l’édition ?"
        }
        description={
          dialogState?.kind === "roundAction"
            ? actionConfig[dialogState.action].confirmDescription ?? actionConfig[dialogState.action].desc
            : dialogState?.kind === "switchRound"
              ? "Le cockpit, le jury et la TV se rebrancheront sur cette manche."
              : "Tape RESET pour confirmer la suppression complète des données courantes."
        }
        confirmLabel={
          dialogState?.kind === "switchRound"
            ? "Activer"
            : dialogState?.kind === "reset"
              ? "Réinitialiser"
              : actionConfig[dialogState?.action ?? "pause_round"].label
        }
        tone={dialogState?.kind === "reset" ? "danger" : "default"}
        busy={adminBusy}
        confirmDisabled={dialogConfirmDisabled}
        onCancel={() => {
          if (!adminBusy) {
            setDialogState(null);
          }
        }}
        onConfirm={() => {
          if (!dialogState) {
            return;
          }

          if (dialogState.kind === "roundAction") {
            void runRoundAction(dialogState.action);
            return;
          }

          if (dialogState.kind === "switchRound") {
            void handleSwitchRound(dialogState.roundId);
            return;
          }

          void handleResetEventData();
        }}
      >
        {dialogState?.kind === "switchRound" ? (
          <div>
            <p className="font-semibold text-text">{dialogState.roundName}</p>
            <p className="mt-1 text-sm">Tu pourras revenir ensuite sur la manche précédente depuis le setup.</p>
          </div>
        ) : dialogState?.kind === "reset" ? (
          <div className="space-y-3">
            <p className="text-sm">
              Cette action supprime toutes les manches, toutes les équipes et tous les scores.
            </p>
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-text-faint">
                Confirmation
              </span>
              <input
                className="signal-input"
                value={resetConfirmationText}
                onChange={(event) => setResetConfirmationText(event.target.value)}
                placeholder="Tape RESET"
              />
            </label>
          </div>
        ) : null}
      </ConfirmDialog>
    </AppFrame>
  );
}
