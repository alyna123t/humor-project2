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

// ---------------------------------------------------------------------------
// GenAI backend tables (added in supabase/genai.sql for the Week-7 admin panel).
// ---------------------------------------------------------------------------

export type LlmProvider = {
  id: number;
  name: string;
  slug: string;
  base_url: string | null;
  api_key_env: string | null;
  is_active: boolean;
  created_at: string;
};

export type LlmModel = {
  id: number;
  provider_id: number;
  name: string;
  model_id: string;
  context_window: number | null;
  input_cost_per_1k: number | null;
  output_cost_per_1k: number | null;
  is_active: boolean;
  created_at: string;
};

export type PromptChain = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type PromptChainStep = {
  id: number;
  chain_id: number;
  step_order: number;
  name: string;
  system_prompt: string | null;
  user_prompt_template: string | null;
  model_id: number | null;
  created_at: string;
};

export type PromptChainMix = {
  id: number;
  chain_id: number;
  weight: number;
  is_enabled: boolean;
  notes: string | null;
  updated_at: string;
};

export type Term = {
  id: number;
  term: string;
  definition: string | null;
  category: string | null;
  created_at: string;
};

export type GenerationRequest = {
  id: number;
  user_id: string | null;
  restaurant_id: number | null;
  chain_id: number | null;
  input: string | null;
  status: string;
  created_at: string;
};

export type LlmResponse = {
  id: number;
  request_id: number | null;
  model_id: number | null;
  step_id: number | null;
  prompt: string | null;
  response: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  created_at: string;
};

export type AiGenerationExample = {
  id: number;
  label: string | null;
  input: string;
  output: string;
  chain_id: number | null;
  is_active: boolean;
  created_at: string;
};

export type AllowedSignupDomain = {
  id: number;
  domain: string;
  note: string | null;
  created_at: string;
};

export type WhitelistedEmail = {
  id: number;
  email: string;
  note: string | null;
  created_at: string;
};

export type ImageRow = {
  id: number;
  bucket: string;
  path: string;
  alt: string | null;
  uploaded_by: string | null;
  created_at: string;
};
