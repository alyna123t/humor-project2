"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";
import { getResource, type Resource } from "@/lib/resources";

export type FormState = { error?: string };

// Turn FormData into an insert/update payload using ONLY the resource's declared
// fields — a request can never set a column that isn't in the config.
function buildPayload(resource: Resource, formData: FormData): { values: Record<string, unknown> } | { error: string } {
  const values: Record<string, unknown> = {};

  for (const field of resource.fields) {
    const raw = formData.get(field.name);

    if (field.type === "boolean") {
      values[field.name] = raw === "on" || raw === "true";
      continue;
    }

    const str = typeof raw === "string" ? raw.trim() : "";

    if (!str) {
      if (field.required) return { error: `${field.label} is required.` };
      values[field.name] = null;
      continue;
    }

    if (field.type === "number") {
      const n = Number(str);
      if (Number.isNaN(n)) return { error: `${field.label} must be a number.` };
      values[field.name] = n;
    } else if (field.type === "reference") {
      values[field.name] = Number(str);
    } else {
      values[field.name] = str;
    }
  }

  return { values };
}

function resolve(formData: FormData): Resource {
  const key = String(formData.get("__resource") ?? "");
  const resource = getResource(key);
  if (!resource) throw new Error(`Unknown resource: ${key}`);
  return resource;
}

export async function createRow(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertSuperadmin();
  const resource = resolve(formData);
  if (!resource.can.create) return { error: "This resource is read-only." };

  const built = buildPayload(resource, formData);
  if ("error" in built) return built;

  const supabase = await createClient();
  const { error } = await supabase.from(resource.table).insert(built.values);
  if (error) return { error: error.message };

  revalidatePath(`/data/${resource.key}`);
  redirect(`/data/${resource.key}`);
}

export async function updateRow(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertSuperadmin();
  const resource = resolve(formData);
  if (!resource.can.update) return { error: "This resource can't be edited." };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing row id." };

  const built = buildPayload(resource, formData);
  if ("error" in built) return built;

  const supabase = await createClient();
  const { error } = await supabase.from(resource.table).update(built.values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/data/${resource.key}`);
  revalidatePath(`/data/${resource.key}/${id}`);
  redirect(`/data/${resource.key}`);
}

export async function deleteRow(formData: FormData): Promise<void> {
  await assertSuperadmin();
  const resource = resolve(formData);
  if (!resource.can.delete) return;

  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  await supabase.from(resource.table).delete().eq("id", id);

  revalidatePath(`/data/${resource.key}`);
  redirect(`/data/${resource.key}`);
}
