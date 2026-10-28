"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped sidebar nav — replaces the old crammed top bar. Every admin section is
// reachable here, organized so nothing is "shoved into the top bar". On desktop the
// sidebar is always visible; on mobile it slides in from the left behind a backdrop.
const NAV: { title?: string; links: { href: string; label: string }[] }[] = [
  { links: [{ href: "/", label: "Overview" }] },
  {
    title: "Content",
    links: [
      { href: "/media", label: "AI Media" },
      { href: "/images", label: "Images" },
      { href: "/data/terms", label: "Terms" },
      { href: "/data/ai_generation_examples", label: "AI Examples" },
    ],
  },
  { title: "Prompts", links: [{ href: "/prompt-chains", label: "Prompt Chains" }] },
  {
    title: "LLM",
    links: [
      { href: "/data/llm_providers", label: "Providers" },
      { href: "/data/llm_models", label: "Models" },
      { href: "/data/generation_requests", label: "Generation Requests" },
      { href: "/data/llm_responses", label: "Responses" },
    ],
  },
  {
    title: "People & Access",
    links: [
      { href: "/users", label: "Users" },
      { href: "/ratings", label: "Ratings" },
      { href: "/data/allowed_signup_domains", label: "Signup Domains" },
      { href: "/data/whitelisted_emails", label: "Whitelisted Emails" },
    ],
  },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 text-base font-bold">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-sm text-white">
        V
      </span>
      Vibes<span className="-ml-1.5 text-[var(--accent)]">Admin</span>
    </Link>
  );
}

export default function AdminShell({
  who,
  signOut,
  children,
}: {
  who: string;
  signOut: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const navList = (
    <nav className="space-y-5">
      {NAV.map((group, i) => (
        <div key={i} className="space-y-1">
          {group.title ? (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {group.title}
            </p>
          ) : null}
          {group.links.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Mobile backdrop */}
      {open ? (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4">
            <Brand />
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
            >
              <XIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{navList}</div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)]/85 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-2)] lg:hidden"
            >
              <MenuIcon />
            </button>
            <span className="lg:hidden">
              <Brand />
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--muted)] sm:inline">{who}</span>
            {signOut}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
