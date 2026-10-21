"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Restaurant, Vibe } from "@/lib/types";
import type { FormState } from "./actions";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export default function VibeForm({
  action,
  restaurants,
  vibe,
  submitLabel,
  cancelHref,
}: {
  action: Action;
  restaurants: Restaurant[];
  vibe?: Vibe;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {vibe ? <input type="hidden" name="id" value={vibe.id} /> : null}

      <Field label="Restaurant">
        {vibe ? (
          // Restaurant is fixed once a vibe exists (it's a foreign key the main app set).
          <input type="hidden" name="restaurant_id" value={vibe.restaurant_id} />
        ) : null}
        {vibe ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
            {restaurants.find((r) => r.id === vibe.restaurant_id)?.name ??
              `Restaurant #${vibe.restaurant_id}`}
          </p>
        ) : (
          <select
            name="restaurant_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Choose a restaurant…
            </option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.neighbourhood} ({r.cuisine})
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Author name">
        <input
          name="author_name"
          required
          defaultValue={vibe?.author_name ?? ""}
          maxLength={80}
          placeholder="e.g. Alex"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Prompt" hint="The instruction that produced this vibe (optional).">
        <textarea
          name="prompt"
          rows={3}
          defaultValue={vibe?.prompt ?? ""}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Content" hint="The AI-generated vibe check shown to users.">
        <textarea
          name="content"
          required
          rows={5}
          defaultValue={vibe?.content ?? ""}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </Field>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="block text-xs text-[var(--muted)]">{hint}</span> : null}
      {children}
    </label>
  );
}
