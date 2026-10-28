import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { loadRefOptions } from "@/lib/resource-data";
import { Card } from "../../../components/ui";
import ResourceForm from "../../ResourceForm";
import { createRow } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource || !resource.can.create) notFound();

  const options = await loadRefOptions(resource);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/data/${resource.key}`} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
          ← {resource.label}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">New {resource.singular}</h1>
      </div>
      <Card>
        <ResourceForm
          resource={resource}
          action={createRow}
          options={options}
          submitLabel={`Create ${resource.singular}`}
          cancelHref={`/data/${resource.key}`}
        />
      </Card>
    </div>
  );
}
