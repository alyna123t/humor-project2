import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PromptChain, PromptChainStep, PromptChainMix, LlmModel } from "@/lib/types";
import { Card } from "../../components/ui";
import { updateMix } from "../actions";

export const dynamic = "force-dynamic";

export default async function PromptChainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chainId = Number(id);

  const supabase = await createClient();
  const [chainRes, stepsRes, mixRes, modelsRes] = await Promise.all([
    supabase.from("prompt_chains").select("*").eq("id", chainId).maybeSingle(),
    supabase.from("prompt_chain_steps").select("*").eq("chain_id", chainId).order("step_order"),
    supabase.from("prompt_chain_mix").select("*").eq("chain_id", chainId).order("id"),
    supabase.from("llm_models").select("id, name"),
  ]);

  const chain = chainRes.data as PromptChain | null;
  if (!chain) notFound();

  const steps = (stepsRes.data ?? []) as PromptChainStep[];
  const mixRows = (mixRes.data ?? []) as PromptChainMix[];
  const models = (modelsRes.data ?? []) as Pick<LlmModel, "id" | "name">[];
  const modelName = new Map(models.map((m) => [m.id, m.name]));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prompt-chains" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← Prompt Chains
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{chain.name}</h1>
        {chain.description ? (
          <p className="text-sm text-[var(--muted)]">{chain.description}</p>
        ) : null}
      </div>

      {/* Steps — read-only */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Steps ({steps.length}) · read-only
        </h2>
        {steps.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">This chain has no steps.</p>
          </Card>
        ) : (
          steps.map((s) => (
            <Card key={s.id} className="!p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                  {s.step_order}
                </span>
                <span className="font-semibold">{s.name}</span>
                {s.model_id ? (
                  <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
                    {modelName.get(s.model_id) ?? `model #${s.model_id}`}
                  </span>
                ) : null}
              </div>
              {s.system_prompt ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  <span className="font-semibold">System:</span> {s.system_prompt}
                </p>
              ) : null}
              {s.user_prompt_template ? (
                <p className="mt-1 text-xs text-[var(--muted)]">
                  <span className="font-semibold">Template:</span> {s.user_prompt_template}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </section>

      {/* Mix — read + update */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
          Mix · read / update
        </h2>
        {mixRows.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">No mix row for this chain.</p>
          </Card>
        ) : (
          mixRows.map((m) => (
            <Card key={m.id}>
              <form action={updateMix} className="space-y-4">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="chain_id" value={m.chain_id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Weight</span>
                    <input
                      type="number"
                      step="any"
                      name="weight"
                      defaultValue={String(m.weight)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-7">
                    <input
                      type="checkbox"
                      name="is_enabled"
                      defaultChecked={m.is_enabled}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Notes</span>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={m.notes ?? ""}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">
                    Updated {new Date(m.updated_at).toLocaleString()}
                  </span>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
                  >
                    Save mix
                  </button>
                </div>
              </form>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
