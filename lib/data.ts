import { createClient } from "@/lib/supabase/server";
import type { Profile, Restaurant, Vibe, VibeVote } from "@/lib/types";

// All four tables in one shot. These queries run with the signed-in superadmin's
// session, so the superadmin RLS policies (supabase/admin.sql) are what make the
// full dataset — not just the admin's own rows — visible here.
export async function loadAll() {
  const supabase = await createClient();

  const [profiles, restaurants, vibes, votes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, first_name, last_name, avatar_url, is_superadmin, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("restaurants")
      .select("id, name, neighbourhood, cuisine, price_range, created_at")
      .order("id", { ascending: true }),
    supabase
      .from("vibes")
      .select("id, restaurant_id, user_id, author_name, prompt, content, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("vibe_votes")
      .select("id, vibe_id, user_id, vote, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return {
    profiles: (profiles.data ?? []) as Profile[],
    restaurants: (restaurants.data ?? []) as Restaurant[],
    vibes: (vibes.data ?? []) as Vibe[],
    votes: (votes.data ?? []) as VibeVote[],
    error:
      profiles.error?.message ??
      restaurants.error?.message ??
      vibes.error?.message ??
      votes.error?.message ??
      null,
  };
}

export async function loadRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, neighbourhood, cuisine, price_range, created_at")
    .order("name", { ascending: true });
  return (data ?? []) as Restaurant[];
}

export async function loadVibe(id: number): Promise<Vibe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vibes")
    .select("id, restaurant_id, user_id, author_name, prompt, content, created_at")
    .eq("id", id)
    .maybeSingle<Vibe>();
  return data ?? null;
}
