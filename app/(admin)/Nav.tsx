"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped so the ~16 admin sections stay legible in the header. Each `href` is the
// list/overview route; detail, new and edit pages live underneath it.
const GROUPS: { title?: string; links: { href: string; label: string }[] }[] = [
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
      { href: "/data/generation_requests", label: "Requests" },
      { href: "/data/llm_responses", label: "Responses" },
    ],
  },
  {
    title: "People & Access",
    links: [
      { href: "/users", label: "Users" },
      { href: "/ratings", label: "Ratings" },
      { href: "/data/allowed_signup_domains", label: "Signup Domains" },
      { href: "/data/whitelisted_emails", label: "Whitelist" },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1">
          {group.title ? (
            <span className="ml-1 hidden text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] lg:inline">
              {group.title}
            </span>
          ) : null}
          {group.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
