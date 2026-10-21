import Link from "next/link";
import { loadAll } from "@/lib/data";
import { fullName } from "@/lib/types";
import { Card, StatTile } from "../components/ui";

export const dynamic = "force-dynamic";

export default async function RatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ dir?: string }>;
}) {
  const { dir } = await searchParams;
  const { profiles, restaurants, vibes, votes, error } = await loadAll();

  const nameByUser = new Map(
    profiles.map((p) => [p.id, fullName(p) || p.email || "Unknown"]),
  );
  const restByVibe = new Map(
    vibes.map((v) => [v.id, restaurants.find((r) => r.id === v.restaurant_id)?.name ?? `#${v.restaurant_id}`]),
  );

  const upvotes = votes.filter((v) => v.vote === 1).length;
  const downvotes = votes.length - upvotes;

  const filtered =
    dir === "up" ? votes.filter((v) => v.vote === 1)
    : dir === "down" ? votes.filter((v) => v.vote === -1)
    : votes;

  const tabs = [
    { key: "", label: `All (${votes.length})` },
    { key: "up", label: `Upvotes (${upvotes})` },
    { key: "down", label: `Downvotes (${downvotes})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ratings</h1>
        <p className="text-sm text-[var(--muted)]">
          Every upvote and downvote across the app · read-only
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load ratings: {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total votes" value={votes.length} />
        <StatTile label="Upvotes" value={upvotes} />
        <StatTile label="Downvotes" value={downvotes} />
        <StatTile
          label="Upvote rate"
          value={`${votes.length ? Math.round((upvotes / votes.length) * 100) : 0}%`}
        />
      </div>

      <div className="flex gap-1">
        {tabs.map((t) => {
          const active = (dir ?? "") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/ratings?dir=${t.key}` : "/ratings"}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-5 py-3 font-semibold">Vote</th>
                <th className="px-5 py-3 font-semibold">Voter</th>
                <th className="px-5 py-3 font-semibold">On vibe</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                  <td className="px-5 py-3">
                    {v.vote === 1 ? (
                      <span className="font-semibold text-[var(--positive)]">↑ Up</span>
                    ) : (
                      <span className="font-semibold text-[var(--negative)]">↓ Down</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/users/${v.user_id}`} className="hover:text-[var(--accent)]">
                      {nameByUser.get(v.user_id) ?? "Unknown"}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/media/${v.vibe_id}`} className="hover:text-[var(--accent)]">
                      {restByVibe.get(v.vibe_id) ?? `Vibe #${v.vibe_id}`}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[var(--muted)]">
                    No votes to show.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
