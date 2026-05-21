import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/_authenticated/app")({
  component: () => (
    <div className="min-h-screen flex w-full bg-muted/20" dir="rtl">
      <AppSidebar />
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  ),
});
