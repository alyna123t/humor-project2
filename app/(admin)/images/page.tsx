import { createClient } from "@/lib/supabase/server";
import type { ImageRow } from "@/lib/types";
import { Card } from "../components/ui";
import ImageUploadForm from "./ImageUploadForm";
import { updateImageAlt, deleteImage } from "./actions";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });
  const images = (data ?? []) as ImageRow[];

  const publicUrl = (img: ImageRow) =>
    supabase.storage.from(img.bucket).getPublicUrl(img.path).data.publicUrl;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Images</h1>
        <p className="text-sm text-[var(--muted)]">
          {images.length} image{images.length === 1 ? "" : "s"} · upload, edit alt text, delete
        </p>
      </div>

      <Card title="Upload a new image">
        <ImageUploadForm />
      </Card>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load images: {error.message}
        </p>
      ) : null}

      {images.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">No images yet. Upload the first one above.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <Card key={img.id} className="!p-3 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(img)}
                alt={img.alt ?? img.path}
                className="aspect-video w-full rounded-lg object-cover"
              />
              <form action={updateImageAlt} className="flex items-center gap-2">
                <input type="hidden" name="id" value={img.id} />
                <input
                  type="text"
                  name="alt"
                  defaultValue={img.alt ?? ""}
                  placeholder="Alt text"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-2)]"
                >
                  Save
                </button>
              </form>
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="truncate">{new Date(img.created_at).toLocaleDateString()}</span>
                <form action={deleteImage}>
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="path" value={img.path} />
                  <button
                    type="submit"
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-medium text-[var(--negative)] transition-colors hover:bg-[var(--surface-2)]"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
