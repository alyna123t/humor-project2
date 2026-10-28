"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadImage, type UploadState } from "./actions";

export default function ImageUploadForm() {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(uploadImage, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the file input after a successful upload so the next one starts fresh.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Image file</span>
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[var(--accent-dark)]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Alt text</span>
          <input
            type="text"
            name="alt"
            placeholder="Describe the image (optional)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-[var(--positive)] dark:border-green-900 dark:bg-green-950/30">
          Uploaded.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload image"}
      </button>
    </form>
  );
}
