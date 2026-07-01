import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { DesktopNav, MobileNav } from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-hairline bg-surface-1">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-ink">
            <span aria-hidden>🚣</span> Row Buddy
          </Link>
          <div className="flex items-center gap-2">
            <DesktopNav />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm text-ink-secondary hover:text-ink"
                title={`Signed in as ${session.username}`}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-10">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
