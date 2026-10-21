import Link from "next/link";
import { loadRestaurants } from "@/lib/data";
import { Card } from "../../components/ui";
import VibeForm from "../VibeForm";
import { createVibe } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewVibePage() {
  const restaurants = await loadRestaurants();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/media" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All media
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New vibe</h1>
        <p className="text-sm text-[var(--muted)]">
          Create a new AI-generated vibe check. It will be attributed to you.
        </p>
      </div>
      <Card>
        <VibeForm
          action={createVibe}
          restaurants={restaurants}
          submitLabel="Create vibe"
          cancelHref="/media"
        />
      </Card>
    </div>
  );
}
