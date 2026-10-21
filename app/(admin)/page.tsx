import { loadAll } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { Card, StatTile, Leaderboard } from "./components/ui";
import { ActivityChart, CuisineChart, DistributionChart } from "./components/Charts";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { profiles, restaurants, vibes, votes, error } = await loadAll();
  const s = computeStats({ profiles, restaurants, vibes, votes });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-[var(--muted)]">
          Live stats across the NYC Vibes database.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          Could not load data: {error}
        </p>
      ) : null}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Users" value={s.kpis.users} />
        <StatTile label="AI vibes" value={s.kpis.vibes} />
        <StatTile label="Votes" value={s.kpis.votes} />
        <StatTile
          label="Upvote rate"
          value={`${s.kpis.upvotePct}%`}
          hint={`${s.kpis.upvotes}↑ / ${s.kpis.downvotes}↓`}
        />
        <StatTile label="Avg votes / vibe" value={s.kpis.avgVotesPerVibe} />
        <StatTile label="Restaurants" value={s.kpis.restaurants} />
      </div>

      {/* Activity over time */}
      <Card
        title="Activity over time"
        subtitle="AI vibes generated and votes cast, per day"
      >
        <ActivityChart data={s.activity} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Net sentiment by cuisine" subtitle="Upvotes minus downvotes, grouped by the restaurant's cuisine">
          <CuisineChart data={s.sentimentByCuisine} />
        </Card>
        <Card title="Engagement" subtitle="How many votes each vibe has attracted">
          <DistributionChart data={s.distribution} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top vibes" subtitle="Highest net score (upvotes − downvotes)">
          <Leaderboard
            linkBase="/media"
            valueLabel="net"
            rows={s.topVibes.map((v) => ({
              id: v.id,
              primary: v.restaurantName,
              secondary: `${v.content.slice(0, 60)}…`,
              value: v.net,
            }))}
          />
        </Card>
        <Card title="Most controversial" subtitle="Most evenly split up/down votes (≥2 votes)">
          <Leaderboard
            linkBase="/media"
            valueLabel="votes"
            rows={s.controversial.map((v) => ({
              id: v.id,
              primary: v.restaurantName,
              secondary: `${v.up}↑ · ${v.down}↓`,
              value: v.total,
            }))}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Most active creators" subtitle="Users who generated the most vibes">
          <Leaderboard
            valueLabel="vibes"
            rows={s.topCreators.map((c) => ({ primary: c.name, value: c.count }))}
          />
        </Card>
        <Card title="Most active voters" subtitle="Users who cast the most votes">
          <Leaderboard
            valueLabel="votes"
            rows={s.topVoters.map((c) => ({ primary: c.name, value: c.count }))}
          />
        </Card>
      </div>
    </div>
  );
}
