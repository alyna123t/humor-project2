"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Resource } from "@/lib/resources";
import type { FormState } from "./actions";
import type { Row } from "@/lib/resource-data";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm";

export default function ResourceForm({
  resource,
  action,
  row,
  options,
  submitLabel,
  cancelHref,
}: {
  resource: Resource;
  action: Action;
  row?: Row;
  options: Record<string, { value: string; label: string }[]>;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="__resource" value={resource.key} />
      {row ? <input type="hidden" name="id" value={String(row.id)} /> : null}

      {resource.fields.map((field) => {
        const current = row?.[field.name];

        return (
          <label key={field.name} className="block space-y-1.5">
            <span className="text-sm font-medium">
              {field.label}
              {field.required ? <span className="text-[var(--accent)]"> *</span> : null}
            </span>
            {field.hint ? (
              <span className="block text-xs text-[var(--muted)]">{field.hint}</span>
            ) : null}

            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                rows={4}
                required={field.required}
                defaultValue={current == null ? "" : String(current)}
                className={inputCls}
              />
            ) : field.type === "boolean" ? (
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={
                    current == null ? field.defaultBool ?? false : Boolean(current)
                  }
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <span className="text-sm text-[var(--muted)]">Enabled</span>
              </span>
            ) : field.type === "number" ? (
              <input
                type="number"
                step="any"
                name={field.name}
                required={field.required}
                defaultValue={current == null ? "" : String(current)}
                className={inputCls}
              />
            ) : field.type === "reference" || field.type === "select" ? (
              <select
                name={field.name}
                required={field.required}
                defaultValue={current == null ? "" : String(current)}
                className={inputCls}
              >
                <option value="">{field.required ? "Choose…" : "— none —"}</option>
                {(field.type === "reference"
                  ? options[field.refTable ?? ""] ?? []
                  : field.options ?? []
                ).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name={field.name}
                required={field.required}
                defaultValue={current == null ? "" : String(current)}
                className={inputCls}
              />
            )}
          </label>
        );
      })}

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
