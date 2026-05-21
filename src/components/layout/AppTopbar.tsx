import { Bell, Search, LogOut, Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SidebarBrand, AppSidebarNav, AdminSidebarNav } from "@/components/layout/AppSidebar";

export function AppTopbar({ title }: { title: string }) {
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <header className="h-14 sm:h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="القائمة">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-72 bg-sidebar text-sidebar-foreground flex flex-col">
          {isAdmin ? (
            <>
              <SidebarBrand title="لوحة الإدارة" subtitle="داخلي فقط" accent="danger" />
              <AdminSidebarNav onNavigate={() => setMenuOpen(false)} />
            </>
          ) : (
            <>
              <SidebarBrand />
              <AppSidebarNav onNavigate={() => setMenuOpen(false)} />
            </>
          )}
        </SheetContent>
      </Sheet>

      <h1 className="text-base sm:text-lg font-semibold font-display flex-1 truncate">{title}</h1>
      <div className="relative hidden lg:block">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="ابحث عن حوالة، مرجع، طلب..."
          className="h-9 w-72 rounded-md border bg-muted/30 ps-3 pe-9 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button variant="ghost" size="icon" onClick={toggleDark} className="shrink-0">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="shrink-0"><Bell className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={logout} className="shrink-0"><LogOut className="h-4 w-4" /></Button>
    </header>
  );
}
