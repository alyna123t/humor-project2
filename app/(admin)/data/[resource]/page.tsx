import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { loadRows, loadRefMaps } from "@/lib/resource-data";
import ResourceTable from "../ResourceTable";

export const dynamic = "force-dynamic";

export default async function ResourceListPage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();

  const [{ rows, error }, refMaps] = await Promise.all([loadRows(resource), loadRefMaps(resource)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{resource.label}</h1>
          <p className="text-sm text-[var(--muted)]">
            {rows.length} {rows.length === 1 ? resource.singular : `${resource.singular}s`} ·{" "}
            {resource.blurb}
          </p>
        </div>
        {resource.can.create ? (
          <Link
            href={`/data/${resource.key}/new`}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-dark)]"
          >
            + New {resource.singular}
          </Link>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load {resource.label.toLowerCase()}: {error}
        </p>
      ) : null}

      <ResourceTable resource={resource} rows={rows} refMaps={refMaps} />
    </div>
  );
}
