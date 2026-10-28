"use client";

import { deleteRow } from "./actions";

// Tiny confirm-then-delete form, mirroring media/DeleteButton. The resource key +
// row id travel as hidden inputs; the server action re-checks superadmin + that the
// resource allows deletes.
export default function ResourceDeleteButton({
  resourceKey,
  id,
  label,
}: {
  resourceKey: string;
  id: number | string;
  label: string;
}) {
  return (
    <form
      action={deleteRow}
      onSubmit={(e) => {
        if (!confirm(`Delete this ${label}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="__resource" value={resourceKey} />
      <input type="hidden" name="id" value={String(id)} />
      <button
        type="submit"
        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--negative)] transition-colors hover:bg-[var(--surface-2)]"
      >
        Delete
      </button>
    </form>
  );
}
