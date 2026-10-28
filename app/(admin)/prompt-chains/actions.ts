"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertSuperadmin } from "@/lib/supabase/admin-auth";

// The ONLY write the prompt-chain area allows: updating a chain's mix row
// (weight / enabled / notes). Chains and steps are read-only per the assignment.
export async function updateMix(formData: FormData): Promise<void> {
  await assertSuperadmin();

  const id = Number(formData.get("id"));
  const chainId = Number(formData.get("chain_id"));
  if (!id) return;

  const weight = Number(formData.get("weight"));
  const is_enabled = formData.get("is_enabled") === "on";
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createClient();
  await supabase
    .from("prompt_chain_mix")
    .update({
      weight: Number.isNaN(weight) ? 1 : weight,
      is_enabled,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/prompt-chains/${chainId}`);
  revalidatePath("/prompt-chains");
}
