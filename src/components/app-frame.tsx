"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/register", label: "Register" },
  { href: "/staff", label: "Staff" },
  { href: "/admin", label: "Admin" },
  { href: "/judge", label: "Judge" },
  { href: "/results", label: "Results" },
  { href: "/tv", label: "TV" }
];

type AppFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppFrame({ title, subtitle, children }: AppFrameProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-obsidian text-sand">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,36,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(202,255,76,0.12),transparent_25%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:30px_30px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="tracking-[0.45em] text-signal">CODE RELAY CONTROL GRID</p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-none text-sand md:text-8xl">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-fog md:text-base">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                    active
                      ? "border-signal bg-signal text-obsidian"
                      : "border-white/10 bg-white/5 text-fog hover:border-lime hover:text-sand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
