"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { RoundSummary } from "@/lib/game-types";

import { Home, UserPlus, Settings, Star, BarChart3, Tv, FileText, ShieldAlert } from "lucide-react";

const publicLinks = [
  { href: "/", label: "Accueil", icon: <Home size={16} /> },
  { href: "/register", label: "Inscription", icon: <UserPlus size={16} /> },
  { href: "/brief", label: "Brief", icon: <FileText size={16} /> },
  { href: "/results", label: "Résultats", icon: <BarChart3 size={16} /> },
  { href: "/staff", label: "Staff", icon: <ShieldAlert size={16} /> }
];

const adminLinks = [
  { href: "/admin", label: "Admin", icon: <Settings size={16} /> },
  { href: "/judge", label: "Jury", icon: <Star size={16} /> },
  { href: "/tv", label: "TV", icon: <Tv size={16} /> }
];

const judgeLinks = [
  { href: "/judge", label: "Jury", icon: <Star size={16} /> }
];

type StaffRole = "admin" | "judge";

type AppFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  currentRound?: RoundSummary | null;
  navigation?: "public" | "staff";
  staffRole?: StaffRole;
};

export function AppFrame({ title, subtitle, children, currentRound, navigation = "public", staffRole }: AppFrameProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const links = navigation === "staff"
    ? [
        ...publicLinks,
        ...(staffRole === "admin" ? adminLinks : judgeLinks)
      ]
    : publicLinks;

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-void text-text">
      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.06),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-5 py-5 md:px-8 md:py-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          {/* Brand + title */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <svg width="20" height="20" className="md:h-[22px] md:w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-text md:text-2xl">{title}</h1>
              <p className="text-xs text-text-muted md:text-sm">{subtitle}</p>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex md:items-center md:gap-1.5 rounded-2xl bg-surface/60 p-1.5 shadow-sm ring-1 ring-border backdrop-blur-xl">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${
                    active
                      ? "text-text"
                      : "text-text-faint hover:text-text-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active Indicator Background */}
                  {active && (
                    <span 
                      className="absolute inset-0 rounded-xl bg-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-border/50" 
                      aria-hidden="true" 
                    />
                  )}
                  
                  {/* Tech Notch / Glow Indicator */}
                  {active && (
                    <span 
                      className="absolute -bottom-[6px] left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-t-md bg-accent shadow-[0_-2px_12px_var(--color-accent-glow)]" 
                      aria-hidden="true" 
                    />
                  )}

                  {/* Icon */}
                  <span className={`relative z-10 flex items-center justify-center transition-all duration-300 ${
                    active 
                      ? "text-accent scale-110 drop-shadow-sm" 
                      : "group-hover:scale-110 group-hover:text-text"
                  }`}>
                    {link.icon}
                  </span>

                  {/* Label */}
                  <span className={`relative z-10 tracking-wide ${active ? "" : "font-medium"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Hamburger Button - Mobile */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-text-muted transition-colors hover:bg-border md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </header>

        <main className="flex-1 animate-fade-in">{children}</main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed top-0 right-0 z-50 h-full w-[280px] max-w-[80vw] transform bg-surface border-l border-border p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="font-display font-bold text-accent-light tracking-widest uppercase text-sm">Menu</span>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-void text-text-muted transition-colors hover:bg-border"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "text-text"
                    : "text-text-faint hover:text-text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {/* Active Highlight Background */}
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/10 to-transparent" aria-hidden="true" />
                )}

                {/* Cyber Grid Texture */}
                {active && (
                  <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(var(--color-accent) 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
                )}

                {/* Icon Box */}
                <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 ${
                  active 
                    ? "bg-surface text-accent shadow-sm ring-1 ring-border" 
                    : "bg-elevated text-text-faint group-hover:bg-surface group-hover:text-text group-hover:ring-1 group-hover:ring-border/50"
                }`}>
                  {link.icon}
                </div>
                
                {/* Text */}
                <span className={`relative z-10 flex-1 tracking-wide ${active ? "font-bold text-text" : "font-semibold"}`}>
                  {link.label}
                </span>

                {/* Pulsing Status Dot */}
                {active && (
                  <span className="relative z-10 flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
