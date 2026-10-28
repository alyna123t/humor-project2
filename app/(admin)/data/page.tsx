import Link from "next/link";
import { RESOURCES } from "@/lib/resources";
import { Card } from "../components/ui";

export const dynamic = "force-dynamic";

export default function DataHubPage() {
  // Group the config-driven resources by their declared `group` for a tidy index.
  const groups = new Map<string, typeof RESOURCES>();
  for (const r of RESOURCES) {
    const list = groups.get(r.group) ?? [];
    list.push(r);
    groups.set(r.group, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data</h1>
        <p className="text-sm text-[var(--muted)]">
          Manage the GenAI backend tables. Read-only tables show live rows; the rest support
          full create / edit / delete.
        </p>
      </div>

      {[...groups.entries()].map(([group, resources]) => (
        <section key={group} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {group}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <Link key={r.key} href={`/data/${r.key}`} className="group block">
                <Card className="h-full transition-colors hover:border-[var(--accent)]">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-[var(--accent)]">{r.label}</h3>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        r.can.create
                          ? "bg-[var(--accent-light)] text-[var(--accent)]"
                          : "bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      {r.can.create ? "CRUD" : "read"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{r.blurb}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
