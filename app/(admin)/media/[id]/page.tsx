import Link from "next/link";
import { notFound } from "next/navigation";
import { loadRestaurants, loadVibe } from "@/lib/data";
import { Card } from "../../components/ui";
import VibeForm from "../VibeForm";
import DeleteButton from "../DeleteButton";
import { updateVibe } from "../actions";

export const dynamic = "force-dynamic";

export default async function VibeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vibeId = Number(id);
  const [vibe, restaurants] = await Promise.all([
    loadVibe(vibeId),
    loadRestaurants(),
  ]);
  if (!vibe) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/media" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All media
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edit vibe #{vibe.id}</h1>
          <p className="text-sm text-[var(--muted)]">
            Created {new Date(vibe.created_at).toLocaleString()}
          </p>
        </div>
        <DeleteButton id={vibe.id} />
      </div>
      <Card>
        <VibeForm
          action={updateVibe}
          restaurants={restaurants}
          vibe={vibe}
          submitLabel="Save changes"
          cancelHref="/media"
        />
      </Card>
    </div>
  );
}
