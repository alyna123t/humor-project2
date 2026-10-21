import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAll } from "@/lib/data";
import { fullName } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { Card, StatTile } from "../../components/ui";
import { Avatar } from "../page";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profiles, restaurants, vibes, votes } = await loadAll();

  const profile = profiles.find((p) => p.id === id);
  if (!profile) notFound();

  const s = computeStats({ profiles, restaurants, vibes, votes });
  const theirVibes = s.vibeStats.filter((v) => v.user_id === id);
  const theirVotes = votes.filter((v) => v.user_id === id);
  const up = theirVotes.filter((v) => v.vote === 1).length;

  return (
    <div className="space-y-6">
      <Link href="/users" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All users
      </Link>

      <div className="flex items-center gap-4">
        <div className="scale-150">
          <Avatar url={profile.avatar_url} name={fullName(profile) || profile.email || "?"} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {fullName(profile) || "Unnamed user"}
            {profile.is_superadmin ? (
              <span className="ml-2 rounded bg-[var(--accent-light)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--accent)]">
                superadmin
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-[var(--muted)]">{profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Vibes created" value={theirVibes.length} />
        <StatTile label="Votes cast" value={theirVotes.length} />
        <StatTile label="Upvotes given" value={up} />
        <StatTile label="Downvotes given" value={theirVotes.length - up} />
      </div>

      <Card title="Vibes by this user">
        {theirVibes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No vibes created.</p>
        ) : (
          <ul className="space-y-3">
            {theirVibes.map((v) => (
              <li key={v.id} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/media/${v.id}`} className="font-medium hover:text-[var(--accent)]">
                    {v.restaurantName}
                  </Link>
                  <span className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
                    {v.up}↑ · {v.down}↓ · net {v.net >= 0 ? `+${v.net}` : v.net}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{v.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs text-[var(--muted)]">User ID: {profile.id}</p>
    </div>
  );
}
