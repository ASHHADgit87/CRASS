import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
