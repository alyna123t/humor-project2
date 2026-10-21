// Shapes of the shared Supabase tables (same database as the main Vibes app).

export type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_superadmin: boolean;
  created_at: string;
};

export type Restaurant = {
  id: number;
  name: string;
  neighbourhood: string;
  cuisine: string;
  price_range: string;
  created_at: string;
};

// A "vibe" is the AI-generated media: a short AI vibe check for a restaurant.
export type Vibe = {
  id: number;
  restaurant_id: number;
  user_id: string;
  author_name: string;
  prompt: string;
  content: string;
  created_at: string;
};

// A single up (1) or down (-1) vote on a vibe — the ratings data.
export type VibeVote = {
  id: number;
  vibe_id: number;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
};

export function fullName(p: Pick<Profile, "first_name" | "last_name">): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
}
