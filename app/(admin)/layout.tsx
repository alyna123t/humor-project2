import { requireSuperadmin } from "@/lib/supabase/admin-auth";
import { fullName } from "@/lib/types";
import SignOutButton from "@/app/login/SignOutButton";
import Nav from "./Nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = await requireSuperadmin();

  // Logged in, but not a superadmin: never render the admin UI or its data.
  if (state.status === "not-admin") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">No admin access</h1>
        <p className="text-[var(--muted)]">
          You&apos;re signed in as{" "}
          <span className="font-medium text-[var(--foreground)]">{state.email}</span>, but
          this account isn&apos;t a superadmin. Ask an existing admin to grant access, then
          sign back in.
        </p>
        <div>
          <SignOutButton />
        </div>
      </main>
    );
  }

  const who = fullName(state.profile) || state.profile.email || "Admin";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold">
              Vibes<span className="text-[var(--accent)]">Admin</span>
            </span>
            <Nav />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--muted)]">{who}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
