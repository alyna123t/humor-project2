import Link from "next/link";
import type { Resource, ListColumn } from "@/lib/resources";
import type { Row } from "@/lib/resource-data";
import { Card } from "../components/ui";
import ResourceDeleteButton from "./ResourceDeleteButton";

function Cell({
  column,
  value,
  refMaps,
}: {
  column: ListColumn;
  value: unknown;
  refMaps: Record<string, Map<string, string>>;
}) {
  if (value == null || value === "") return <span className="text-[var(--muted)]">—</span>;

  if (column.kind === "reference" && column.refTable) {
    const label = refMaps[column.refTable]?.get(String(value));
    return <span>{label ?? `#${String(value)}`}</span>;
  }
  if (column.kind === "date") {
    return <span className="text-[var(--muted)]">{new Date(String(value)).toLocaleDateString()}</span>;
  }
  if (column.kind === "boolean") {
    return value ? (
      <span className="rounded bg-[var(--accent-light)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">
        yes
      </span>
    ) : (
      <span className="text-[var(--muted)]">no</span>
    );
  }
  if (column.kind === "badge") {
    return (
      <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--muted)]">
        {String(value)}
      </span>
    );
  }
  const text = String(value);
  if (column.truncate) {
    return <span className="block max-w-[22rem] truncate text-[var(--muted)]">{text}</span>;
  }
  return <span>{text}</span>;
}

export default function ResourceTable({
  resource,
  rows,
  refMaps,
}: {
  resource: Resource;
  rows: Row[];
  refMaps: Record<string, Map<string, string>>;
}) {
  const hasActions = resource.can.update || resource.can.delete;

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              {resource.list.map((c) => (
                <th key={c.field} className="px-5 py-3 font-semibold">
                  {c.label}
                </th>
              ))}
              {hasActions ? <th className="px-5 py-3 text-right font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={String(row.id)}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]"
              >
                {resource.list.map((c) => (
                  <td key={c.field} className="px-5 py-3 align-top">
                    <Cell column={c} value={row[c.field]} refMaps={refMaps} />
                  </td>
                ))}
                {hasActions ? (
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {resource.can.update ? (
                        <Link
                          href={`/data/${resource.key}/${String(row.id)}`}
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
                        >
                          Edit
                        </Link>
                      ) : null}
                      {resource.can.delete ? (
                        <ResourceDeleteButton
                          resourceKey={resource.key}
                          id={row.id as number}
                          label={resource.singular}
                        />
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={resource.list.length + (hasActions ? 1 : 0)}
                  className="px-5 py-8 text-center text-[var(--muted)]"
                >
                  No {resource.label.toLowerCase()} yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
