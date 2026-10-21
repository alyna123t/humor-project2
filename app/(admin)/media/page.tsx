import Link from "next/link";
import { loadAll } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { Card } from "../components/ui";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const { profiles, restaurants, vibes, votes, error } = await loadAll();
  const s = computeStats({ profiles, restaurants, vibes, votes });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Media</h1>
          <p className="text-sm text-[var(--muted)]">
            {vibes.length} AI-generated vibe{vibes.length === 1 ? "" : "s"} · full CRUD
          </p>
        </div>
        <Link
          href="/media/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
        >
          + New vibe
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load media: {error}
        </p>
      ) : null}

      {s.vibeStats.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">
            No vibes yet. Create the first one with “New vibe”.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {s.vibeStats.map((v) => (
            <Card key={v.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/media/${v.id}`}
                      className="font-semibold hover:text-[var(--accent)]"
                    >
                      {v.restaurantName}
                    </Link>
                    <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
                      {v.cuisine}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{v.content}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    by {v.author_name} · {new Date(v.created_at).toLocaleDateString()} ·{" "}
                    <span className="text-[var(--positive)]">{v.up}↑</span>{" "}
                    <span className="text-[var(--negative)]">{v.down}↓</span> · net{" "}
                    {v.net >= 0 ? `+${v.net}` : v.net}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/media/${v.id}`}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={v.id} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
