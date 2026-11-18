import { requireSuperadmin } from "@/lib/supabase/admin-auth";
import { fullName } from "@/lib/types";
import SignOutButton from "@/app/login/SignOutButton";
import { HOME_URL } from "@/lib/home-url";
import AdminShell from "./AdminShell";

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
        <div className="flex items-center gap-3">
          <SignOutButton />
          <a href={HOME_URL} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            &larr; Back to NYC Vibes
          </a>
        </div>
      </main>
    );
  }

  const who = fullName(state.profile) || state.profile.email || "Admin";

  return (
    <AdminShell who={who} signOut={<SignOutButton />}>
      {children}
    </AdminShell>
  );
}
