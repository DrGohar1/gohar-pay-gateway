import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/layout/AppSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r) => r.role === "internal_admin" || r.role === "super_admin");
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  component: () => (
    <div className="min-h-screen flex w-full bg-muted/20" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  ),
});
