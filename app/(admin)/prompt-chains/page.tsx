import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PromptChain, PromptChainStep, PromptChainMix } from "@/lib/types";
import { Card } from "../components/ui";

export const dynamic = "force-dynamic";

export default async function PromptChainsPage() {
  const supabase = await createClient();
  const [chainsRes, stepsRes, mixRes] = await Promise.all([
    supabase.from("prompt_chains").select("*").order("id", { ascending: true }),
    supabase.from("prompt_chain_steps").select("id, chain_id"),
    supabase.from("prompt_chain_mix").select("*"),
  ]);

  const chains = (chainsRes.data ?? []) as PromptChain[];
  const steps = (stepsRes.data ?? []) as Pick<PromptChainStep, "id" | "chain_id">[];
  const mix = (mixRes.data ?? []) as PromptChainMix[];
  const error = chainsRes.error?.message ?? stepsRes.error?.message ?? mixRes.error?.message ?? null;

  const stepCount = new Map<number, number>();
  for (const s of steps) stepCount.set(s.chain_id, (stepCount.get(s.chain_id) ?? 0) + 1);
  const mixByChain = new Map<number, PromptChainMix>();
  for (const m of mix) mixByChain.set(m.chain_id, m);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Chains</h1>
        <p className="text-sm text-[var(--muted)]">
          {chains.length} chain{chains.length === 1 ? "" : "s"} · read chains &amp; steps,
          read/update the mix
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load prompt chains: {error}
        </p>
      ) : null}

      {chains.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">No prompt chains yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {chains.map((c) => {
            const m = mixByChain.get(c.id);
            return (
              <Card key={c.id} className="!p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/prompt-chains/${c.id}`}
                        className="font-semibold hover:text-[var(--accent)]"
                      >
                        {c.name}
                      </Link>
                      {c.is_active ? (
                        <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">
                          active
                        </span>
                      ) : (
                        <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
                          inactive
                        </span>
                      )}
                    </div>
                    {c.description ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">{c.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {stepCount.get(c.id) ?? 0} step{(stepCount.get(c.id) ?? 0) === 1 ? "" : "s"}
                      {m ? (
                        <>
                          {" · "}mix weight {m.weight}{" · "}
                          <span className={m.is_enabled ? "text-[var(--positive)]" : "text-[var(--negative)]"}>
                            {m.is_enabled ? "enabled" : "disabled"}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Link
                    href={`/prompt-chains/${c.id}`}
                    className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                  >
                    View
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
