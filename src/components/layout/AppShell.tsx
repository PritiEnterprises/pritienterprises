"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ReactNode, useState } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-surface to-slate-200/80">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-screen flex-col lg:ml-[17rem]">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-6 lg:p-8">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
