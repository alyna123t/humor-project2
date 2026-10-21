import { fullName, type Profile, type Restaurant, type Vibe, type VibeVote } from "@/lib/types";

export type VoteTally = { up: number; down: number; total: number; net: number };

export type VibeStat = Vibe & {
  restaurantName: string;
  cuisine: string;
  up: number;
  down: number;
  total: number;
  net: number;
  // 0 = one-sided, 1 = perfectly split — how divisive the vibe is.
  controversy: number;
};

export type Input = {
  profiles: Profile[];
  restaurants: Restaurant[];
  vibes: Vibe[];
  votes: VibeVote[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function computeStats({ profiles, restaurants, vibes, votes }: Input) {
  const restById = new Map(restaurants.map((r) => [r.id, r]));
  const nameByUser = new Map(
    profiles.map((p) => [p.id, fullName(p) || p.email || "Unknown user"]),
  );

  // Tally votes per vibe.
  const tally = new Map<number, VoteTally>();
  for (const v of votes) {
    const t = tally.get(v.vibe_id) ?? { up: 0, down: 0, total: 0, net: 0 };
    if (v.vote === 1) t.up += 1;
    else t.down += 1;
    t.total = t.up + t.down;
    t.net = t.up - t.down;
    tally.set(v.vibe_id, t);
  }

  // Enrich every vibe with its restaurant + vote math.
  const vibeStats: VibeStat[] = vibes.map((vibe) => {
    const t = tally.get(vibe.id) ?? { up: 0, down: 0, total: 0, net: 0 };
    const rest = restById.get(vibe.restaurant_id);
    const controversy = t.total > 0 ? 1 - Math.abs(t.net) / t.total : 0;
    return {
      ...vibe,
      restaurantName: rest?.name ?? `#${vibe.restaurant_id}`,
      cuisine: rest?.cuisine ?? "Unknown",
      up: t.up,
      down: t.down,
      total: t.total,
      net: t.net,
      controversy,
    };
  });

  const upvotes = votes.filter((v) => v.vote === 1).length;
  const downvotes = votes.length - upvotes;

  // KPI tiles.
  const kpis = {
    users: profiles.length,
    vibes: vibes.length,
    votes: votes.length,
    restaurants: restaurants.length,
    upvotes,
    downvotes,
    upvotePct: votes.length ? Math.round((upvotes / votes.length) * 100) : 0,
    avgVotesPerVibe: vibes.length
      ? Math.round((votes.length / vibes.length) * 10) / 10
      : 0,
  };

  // Leaderboards.
  const byNet = [...vibeStats].sort((a, b) => b.net - a.net || b.total - a.total);
  const topVibes = byNet.slice(0, 5);
  const bottomVibes = [...byNet].reverse().filter((v) => v.total > 0).slice(0, 5);

  const controversial = [...vibeStats]
    .filter((v) => v.total >= 2)
    .sort((a, b) => b.controversy - a.controversy || b.total - a.total)
    .slice(0, 5);

  // Net sentiment by cuisine (vibes -> restaurants -> votes).
  const cuisineMap = new Map<string, { up: number; down: number; vibes: number }>();
  for (const v of vibeStats) {
    const c = cuisineMap.get(v.cuisine) ?? { up: 0, down: 0, vibes: 0 };
    c.up += v.up;
    c.down += v.down;
    c.vibes += 1;
    cuisineMap.set(v.cuisine, c);
  }
  const sentimentByCuisine = [...cuisineMap.entries()]
    .map(([cuisine, c]) => ({
      cuisine,
      up: c.up,
      down: c.down,
      net: c.up - c.down,
      vibes: c.vibes,
    }))
    .sort((a, b) => b.net - a.net);

  // Most active creators (by vibes authored).
  const creatorMap = new Map<string, number>();
  for (const v of vibes) creatorMap.set(v.user_id, (creatorMap.get(v.user_id) ?? 0) + 1);
  const topCreators = [...creatorMap.entries()]
    .map(([user_id, count]) => ({ name: nameByUser.get(user_id) ?? "Unknown", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Most active voters (by votes cast).
  const voterMap = new Map<string, number>();
  for (const v of votes) voterMap.set(v.user_id, (voterMap.get(v.user_id) ?? 0) + 1);
  const topVoters = [...voterMap.entries()]
    .map(([user_id, count]) => ({ name: nameByUser.get(user_id) ?? "Unknown", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Votes-per-vibe distribution (engagement histogram).
  const buckets = [
    { label: "0", min: 0, max: 0 },
    { label: "1–2", min: 1, max: 2 },
    { label: "3–5", min: 3, max: 5 },
    { label: "6–10", min: 6, max: 10 },
    { label: "11+", min: 11, max: Infinity },
  ];
  const distribution = buckets.map((b) => ({
    label: b.label,
    vibes: vibeStats.filter((v) => v.total >= b.min && v.total <= b.max).length,
  }));

  // Activity over time — vibes created and votes cast per day.
  const dayMap = new Map<string, { vibes: number; votes: number }>();
  for (const v of vibes) {
    const k = dayKey(v.created_at);
    const d = dayMap.get(k) ?? { vibes: 0, votes: 0 };
    d.vibes += 1;
    dayMap.set(k, d);
  }
  for (const v of votes) {
    const k = dayKey(v.created_at);
    const d = dayMap.get(k) ?? { vibes: 0, votes: 0 };
    d.votes += 1;
    dayMap.set(k, d);
  }
  const activity = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => ({ day, ...d }));

  return {
    kpis,
    vibeStats,
    topVibes,
    bottomVibes,
    controversial,
    sentimentByCuisine,
    topCreators,
    topVoters,
    distribution,
    activity,
  };
}

export type Stats = ReturnType<typeof computeStats>;
