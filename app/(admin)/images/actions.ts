"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";

export type UploadState = { error?: string; ok?: boolean };

const BUCKET = "images";

// CREATE (upload): pushes the file into the Storage bucket, then records a row in
// public.images. Both the storage policy and the table RLS re-check superadmin.
export async function uploadImage(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const admin = await assertSuperadmin();

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file to upload." };

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  const supabase = await createClient();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) return { error: `Upload failed: ${upErr.message}` };

  const { error: insErr } = await supabase.from("images").insert({
    bucket: BUCKET,
    path,
    alt: alt || null,
    uploaded_by: admin.id,
  });
  if (insErr) {
    // Roll back the orphaned object so Storage and the table stay in sync.
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: insErr.message };
  }

  revalidatePath("/images");
  return { ok: true };
}

// UPDATE: edit the alt text on an existing image.
export async function updateImageAlt(formData: FormData): Promise<void> {
  await assertSuperadmin();
  const id = Number(formData.get("id"));
  const alt = String(formData.get("alt") ?? "").trim();
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("images").update({ alt: alt || null }).eq("id", id);
  revalidatePath("/images");
}

// DELETE: remove the Storage object and its row.
export async function deleteImage(formData: FormData): Promise<void> {
  await assertSuperadmin();
  const id = Number(formData.get("id"));
  const path = String(formData.get("path") ?? "");
  if (!id) return;

  const supabase = await createClient();
  if (path) await supabase.storage.from(BUCKET).remove([path]);
  await supabase.from("images").delete().eq("id", id);
  revalidatePath("/images");
}
