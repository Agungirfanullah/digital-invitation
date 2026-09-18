import type { ReactNode } from "react";

import { requireAppUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAppUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Keluar
          </Button>
        </form>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
