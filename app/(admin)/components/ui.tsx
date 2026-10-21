import Link from "next/link";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
    >
      {title ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function Leaderboard({
  rows,
  valueLabel,
  linkBase,
}: {
  rows: { id?: number; primary: string; secondary?: string; value: number }[];
  valueLabel?: string;
  linkBase?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No data yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => {
        const inner = (
          <div className="flex items-center gap-3">
            <span className="w-5 text-right text-sm font-semibold text-[var(--muted)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.primary}</p>
              {r.secondary ? (
                <p className="truncate text-xs text-[var(--muted)]">{r.secondary}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {r.value > 0 ? `+${r.value}` : r.value}
              {valueLabel ? (
                <span className="ml-1 font-normal text-[var(--muted)]">{valueLabel}</span>
              ) : null}
            </span>
          </div>
        );
        return (
          <li key={i} className="rounded-lg px-2 py-1.5 hover:bg-[var(--surface-2)]">
            {linkBase && r.id != null ? (
              <Link href={`${linkBase}/${r.id}`}>{inner}</Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ol>
  );
}
