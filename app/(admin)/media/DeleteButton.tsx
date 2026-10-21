"use client";

import { deleteVibe } from "./actions";

export default function DeleteButton({
  id,
  label = "Delete",
}: {
  id: number;
  label?: string;
}) {
  return (
    <form
      action={deleteVibe}
      onSubmit={(e) => {
        if (!confirm("Delete this vibe permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-[var(--negative)] px-3 py-1.5 text-sm font-medium text-[var(--negative)] transition-colors hover:bg-[var(--negative)] hover:text-white"
      >
        {label}
      </button>
    </form>
  );
}
