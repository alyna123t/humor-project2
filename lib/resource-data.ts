import { createClient } from "@/lib/supabase/server";
import { refLabelFor, type Resource } from "@/lib/resources";

export type Row = Record<string, unknown>;

// All rows of a resource's table, ordered per its config. Runs under the signed-in
// superadmin's session, so the genai.sql superadmin RLS policies are what make the
// full table visible.
export async function loadRows(resource: Resource): Promise<{ rows: Row[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(resource.table)
    .select("*")
    .order(resource.orderBy.column, { ascending: resource.orderBy.ascending });
  return { rows: (data ?? []) as Row[], error: error?.message ?? null };
}

export async function loadRow(resource: Resource, id: number): Promise<Row | null> {
  const supabase = await createClient();
  const { data } = await supabase.from(resource.table).select("*").eq("id", id).maybeSingle();
  return (data as Row) ?? null;
}

// For reference columns (list) and reference fields (form) we need id -> label maps.
// Collects every table referenced anywhere in the resource and loads each once.
export async function loadRefMaps(resource: Resource): Promise<Record<string, Map<string, string>>> {
  const tables = new Set<string>();
  for (const c of resource.list) if (c.kind === "reference" && c.refTable) tables.add(c.refTable);
  for (const f of resource.fields) if (f.type === "reference" && f.refTable) tables.add(f.refTable);

  const supabase = await createClient();
  const entries = await Promise.all(
    [...tables].map(async (table) => {
      const { data } = await supabase.from(table).select("*");
      const map = new Map<string, string>();
      for (const row of (data ?? []) as Row[]) {
        map.set(String(row.id), refLabelFor(table, row));
      }
      return [table, map] as const;
    }),
  );
  return Object.fromEntries(entries);
}

// Options for the reference <select>s on a form (sorted by label).
export async function loadRefOptions(resource: Resource): Promise<Record<string, { value: string; label: string }[]>> {
  const tables = new Set<string>();
  for (const f of resource.fields) if (f.type === "reference" && f.refTable) tables.add(f.refTable);

  const supabase = await createClient();
  const entries = await Promise.all(
    [...tables].map(async (table) => {
      const { data } = await supabase.from(table).select("*");
      const options = ((data ?? []) as Row[])
        .map((row) => ({ value: String(row.id), label: refLabelFor(table, row) }))
        .sort((a, b) => a.label.localeCompare(b.label));
      return [table, options] as const;
    }),
  );
  return Object.fromEntries(entries);
}
