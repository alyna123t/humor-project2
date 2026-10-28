import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { loadRow, loadRefOptions } from "@/lib/resource-data";
import { Card } from "../../../components/ui";
import ResourceForm from "../../ResourceForm";
import { updateRow } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource || !resource.can.update) notFound();

  const [row, options] = await Promise.all([loadRow(resource, Number(id)), loadRefOptions(resource)]);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/data/${resource.key}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← {resource.label}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Edit {resource.singular}</h1>
      </div>
      <Card>
        <ResourceForm
          resource={resource}
          action={updateRow}
          row={row}
          options={options}
          submitLabel="Save changes"
          cancelHref={`/data/${resource.key}`}
        />
      </Card>
    </div>
  );
}
