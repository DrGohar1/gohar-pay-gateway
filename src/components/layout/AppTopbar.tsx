import { Bell, Search, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export function AppTopbar({ title }: { title: string }) {
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
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
    <header className="h-16 border-b bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center px-6 gap-4">
      <h1 className="text-lg font-semibold font-display flex-1">{title}</h1>
      <div className="relative hidden md:block">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="ابحث عن حوالة، مرجع، طلب..."
          className="h-9 w-80 rounded-md border bg-muted/30 ps-3 pe-9 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button variant="ghost" size="icon" onClick={toggleDark}>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
    </header>
  );
}
