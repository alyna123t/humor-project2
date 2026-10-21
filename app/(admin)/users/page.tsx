import Link from "next/link";
import { loadAll } from "@/lib/data";
import { fullName } from "@/lib/types";
import { Card } from "../components/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { profiles, vibes, votes, error } = await loadAll();

  const vibeCount = new Map<string, number>();
  for (const v of vibes) vibeCount.set(v.user_id, (vibeCount.get(v.user_id) ?? 0) + 1);
  const voteCount = new Map<string, number>();
  for (const v of votes) voteCount.set(v.user_id, (voteCount.get(v.user_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-[var(--muted)]">
          {profiles.length} profile{profiles.length === 1 ? "" : "s"} · read-only
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load users: {error}
        </p>
      ) : null}

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 text-right font-semibold">Vibes</th>
                <th className="px-5 py-3 text-right font-semibold">Votes</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"
                >
                  <td className="px-5 py-3">
                    <Link href={`/users/${p.id}`} className="flex items-center gap-3">
                      <Avatar url={p.avatar_url} name={fullName(p) || p.email || "?"} />
                      <span className="font-medium">
                        {fullName(p) || "—"}
                        {p.is_superadmin ? (
                          <span className="ml-2 rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">
                            admin
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{p.email ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{vibeCount.get(p.id) ?? 0}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{voteCount.get(p.id) ?? 0}</td>
                  <td className="px-5 py-3 text-[var(--muted)]">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[var(--muted)]">
                    No users yet.
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

export function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--muted)]">
      {initials || "?"}
    </span>
  );
}
