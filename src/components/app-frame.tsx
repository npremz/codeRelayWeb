"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { RoundSummary } from "@/lib/game-types";

import { Home, UserPlus, ShieldAlert, Settings, Star, BarChart3, Tv } from "lucide-react";

const links = [
  { href: "/", label: "Accueil", icon: <Home size={16} /> },
  { href: "/register", label: "Inscription", icon: <UserPlus size={16} /> },
  { href: "/staff", label: "Staff", icon: <ShieldAlert size={16} /> },
  { href: "/admin", label: "Admin", icon: <Settings size={16} /> },
  { href: "/judge", label: "Jury", icon: <Star size={16} /> },
  { href: "/results", label: "Résultats", icon: <BarChart3 size={16} /> },
  { href: "/tv", label: "TV", icon: <Tv size={16} /> }
];

type AppFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  currentRound?: RoundSummary | null;
};

export function AppFrame({ title, subtitle, children, currentRound }: AppFrameProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <nav className="hidden md:flex md:items-center md:gap-1.5">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 overflow-hidden ${
                    active
                      ? "bg-accent/15 text-accent-light"
                      : "text-text-faint hover:bg-elevated hover:text-text-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" aria-hidden="true" />
                  )}
                  <span className={`text-xs ${active ? "opacity-100" : "opacity-70"}`}>{link.icon}</span>
                  {link.label}
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
                className={`relative flex items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium transition-all duration-150 overflow-hidden ${
                  active
                    ? "bg-accent/15 text-accent-light"
                    : "text-text-faint hover:bg-elevated hover:text-text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-full" aria-hidden="true" />
                )}
                <span className={`text-sm ${active ? "opacity-100" : "opacity-70"}`}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
