// Config-driven admin resources. Each entry describes one table: how to list it,
// which fields its create/edit form has, and what the superadmin may do to it.
// The generic pages under app/(admin)/data/[resource] and the generic server
// actions read ONLY from this config, so a table can never be written through a
// column that isn't declared here. Prompt chains and images are special-cased in
// their own routes; everything else runs through this engine.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "reference";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[]; // for "select"
  refTable?: string; // for "reference": which table to pull <option>s from
  defaultBool?: boolean; // for "boolean": default on a new row
};

export type ListColumnKind = "text" | "date" | "boolean" | "badge" | "reference";

export type ListColumn = {
  field: string;
  label: string;
  kind?: ListColumnKind;
  refTable?: string; // for kind "reference": resolve the id to a label from here
  truncate?: boolean;
};

export type Resource = {
  key: string; // URL segment under /data
  table: string; // Postgres table name
  label: string; // plural — nav + page heading
  singular: string;
  group: string; // nav grouping
  blurb: string; // one-line description under the heading
  can: { create: boolean; update: boolean; delete: boolean }; // read is always on
  orderBy: { column: string; ascending: boolean };
  list: ListColumn[];
  fields: ResourceField[]; // empty array => read-only resource
};

// Columns used to build a human label for a referenced row (FK dropdowns + list
// cells). Default value column is "id".
const REF_LABELS: Record<string, string[]> = {
  llm_providers: ["name"],
  llm_models: ["name"],
  prompt_chains: ["name"],
  prompt_chain_steps: ["name"],
  restaurants: ["name"],
  profiles: ["email"],
};

export function refLabelFor(table: string, row: Record<string, unknown>): string {
  const cols = REF_LABELS[table] ?? ["id"];
  const label = cols
    .map((c) => row[c])
    .filter((v) => v != null && v !== "")
    .join(" ");
  return label || `#${row.id}`;
}

export const RESOURCES: Resource[] = [
  {
    key: "llm_providers",
    table: "llm_providers",
    label: "LLM Providers",
    singular: "provider",
    group: "LLM",
    blurb: "Model vendors (OpenAI, Anthropic, …) · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "id", ascending: true },
    list: [
      { field: "name", label: "Name" },
      { field: "slug", label: "Slug" },
      { field: "base_url", label: "Base URL", truncate: true },
      { field: "api_key_env", label: "Key env" },
      { field: "is_active", label: "Active", kind: "boolean" },
      { field: "created_at", label: "Created", kind: "date" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, hint: "Unique, lowercase, e.g. openai" },
      { name: "base_url", label: "Base URL", type: "text" },
      { name: "api_key_env", label: "API key env var", type: "text", hint: "Name of the env var that holds the key — never the key itself." },
      { name: "is_active", label: "Active", type: "boolean", defaultBool: true },
    ],
  },
  {
    key: "llm_models",
    table: "llm_models",
    label: "LLM Models",
    singular: "model",
    group: "LLM",
    blurb: "Individual models and their costs · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "id", ascending: true },
    list: [
      { field: "name", label: "Name" },
      { field: "model_id", label: "Model ID" },
      { field: "provider_id", label: "Provider", kind: "reference", refTable: "llm_providers" },
      { field: "context_window", label: "Context" },
      { field: "is_active", label: "Active", kind: "boolean" },
    ],
    fields: [
      { name: "provider_id", label: "Provider", type: "reference", refTable: "llm_providers", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "model_id", label: "Model ID", type: "text", required: true, hint: "The API identifier, e.g. gpt-4o-mini" },
      { name: "context_window", label: "Context window (tokens)", type: "number" },
      { name: "input_cost_per_1k", label: "Input $ / 1K tokens", type: "number" },
      { name: "output_cost_per_1k", label: "Output $ / 1K tokens", type: "number" },
      { name: "is_active", label: "Active", type: "boolean", defaultBool: true },
    ],
  },
  {
    key: "llm_responses",
    table: "llm_responses",
    label: "LLM Responses",
    singular: "response",
    group: "LLM",
    blurb: "Raw model output logged per request · read-only",
    can: { create: false, update: false, delete: false },
    orderBy: { column: "created_at", ascending: false },
    list: [
      { field: "id", label: "ID" },
      { field: "request_id", label: "Request" },
      { field: "model_id", label: "Model", kind: "reference", refTable: "llm_models" },
      { field: "response", label: "Response", truncate: true },
      { field: "prompt_tokens", label: "In tok" },
      { field: "completion_tokens", label: "Out tok" },
      { field: "latency_ms", label: "ms" },
      { field: "created_at", label: "When", kind: "date" },
    ],
    fields: [],
  },
  {
    key: "generation_requests",
    table: "generation_requests",
    label: "Generation Requests",
    singular: "request",
    group: "LLM",
    blurb: "Every request to generate a caption · read-only",
    can: { create: false, update: false, delete: false },
    orderBy: { column: "created_at", ascending: false },
    list: [
      { field: "id", label: "ID" },
      { field: "status", label: "Status", kind: "badge" },
      { field: "chain_id", label: "Chain", kind: "reference", refTable: "prompt_chains" },
      { field: "restaurant_id", label: "Restaurant", kind: "reference", refTable: "restaurants" },
      { field: "user_id", label: "User", kind: "reference", refTable: "profiles" },
      { field: "input", label: "Input", truncate: true },
      { field: "created_at", label: "When", kind: "date" },
    ],
    fields: [],
  },
  {
    key: "ai_generation_examples",
    table: "ai_generation_examples",
    label: "AI Examples",
    singular: "example",
    group: "Content",
    blurb: "Few-shot input/output examples · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "id", ascending: true },
    list: [
      { field: "label", label: "Label" },
      { field: "chain_id", label: "Chain", kind: "reference", refTable: "prompt_chains" },
      { field: "input", label: "Input", truncate: true },
      { field: "output", label: "Output", truncate: true },
      { field: "is_active", label: "Active", kind: "boolean" },
    ],
    fields: [
      { name: "label", label: "Label", type: "text" },
      { name: "chain_id", label: "Prompt chain", type: "reference", refTable: "prompt_chains" },
      { name: "input", label: "Input", type: "textarea", required: true },
      { name: "output", label: "Output", type: "textarea", required: true },
      { name: "is_active", label: "Active", type: "boolean", defaultBool: true },
    ],
  },
  {
    key: "terms",
    table: "terms",
    label: "Terms",
    singular: "term",
    group: "Content",
    blurb: "Glossary / controlled vocabulary · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "term", ascending: true },
    list: [
      { field: "term", label: "Term" },
      { field: "category", label: "Category", kind: "badge" },
      { field: "definition", label: "Definition", truncate: true },
      { field: "created_at", label: "Created", kind: "date" },
    ],
    fields: [
      { name: "term", label: "Term", type: "text", required: true },
      { name: "definition", label: "Definition", type: "textarea" },
      { name: "category", label: "Category", type: "text" },
    ],
  },
  {
    key: "allowed_signup_domains",
    table: "allowed_signup_domains",
    label: "Signup Domains",
    singular: "domain",
    group: "Access",
    blurb: "Email domains allowed to sign up · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "domain", ascending: true },
    list: [
      { field: "domain", label: "Domain" },
      { field: "note", label: "Note", truncate: true },
      { field: "created_at", label: "Created", kind: "date" },
    ],
    fields: [
      { name: "domain", label: "Domain", type: "text", required: true, hint: "e.g. columbia.edu" },
      { name: "note", label: "Note", type: "text" },
    ],
  },
  {
    key: "whitelisted_emails",
    table: "whitelisted_emails",
    label: "Whitelisted Emails",
    singular: "email",
    group: "Access",
    blurb: "Individually allowed addresses · full CRUD",
    can: { create: true, update: true, delete: true },
    orderBy: { column: "email", ascending: true },
    list: [
      { field: "email", label: "Email" },
      { field: "note", label: "Note", truncate: true },
      { field: "created_at", label: "Created", kind: "date" },
    ],
    fields: [
      { name: "email", label: "Email", type: "text", required: true },
      { name: "note", label: "Note", type: "text" },
    ],
  },
];

export function getResource(key: string): Resource | undefined {
  return RESOURCES.find((r) => r.key === key);
}
