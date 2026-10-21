"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";

export type FormState = { error?: string };

// CREATE — every mutation re-checks superadmin via assertSuperadmin() so a vibe can
// never be written without the flag, regardless of how the request arrived.
export async function createVibe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await assertSuperadmin();

  const restaurant_id = Number(formData.get("restaurant_id"));
  const author_name = String(formData.get("author_name") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!restaurant_id) return { error: "Pick a restaurant." };
  if (!author_name) return { error: "Enter an author name." };
  if (!content) return { error: "Vibe content can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("vibes").insert({
    restaurant_id,
    user_id: admin.id, // attributed to the admin who created it
    author_name,
    prompt: prompt || "(created in admin)",
    content,
  });
  if (error) return { error: error.message };

  revalidatePath("/media");
  revalidatePath("/");
  redirect("/media");
}

// UPDATE
export async function updateVibe(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSuperadmin();

  const id = Number(formData.get("id"));
  const author_name = String(formData.get("author_name") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!id) return { error: "Missing vibe id." };
  if (!author_name) return { error: "Enter an author name." };
  if (!content) return { error: "Vibe content can't be empty." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vibes")
    .update({ author_name, prompt, content })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/media");
  revalidatePath(`/media/${id}`);
  revalidatePath("/");
  redirect(`/media/${id}`);
}

// DELETE
export async function deleteVibe(formData: FormData): Promise<void> {
  await assertSuperadmin();

  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("vibes").delete().eq("id", id);

  revalidatePath("/media");
  revalidatePath("/");
  redirect("/media");
}
