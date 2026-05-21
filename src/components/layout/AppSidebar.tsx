import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ListChecks, Inbox, ShoppingCart, Smartphone,
  Wallet, Plug, KeyRound, Webhook, Bell, ShieldAlert, Users,
  Settings, ArrowLeftRight, Sparkles, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/app/transactions", label: "الحوالات", icon: ListChecks },
  { to: "/app/payment-links", label: "روابط الدفع", icon: Link2 },
  { to: "/app/confirmations", label: "التأكيدات الواردة", icon: Inbox },
  { to: "/app/orders", label: "الطلبات", icon: ShoppingCart },
  { to: "/app/sources", label: "المصادر والخطوط", icon: Smartphone },
  { to: "/app/balances", label: "لقطات الأرصدة", icon: Wallet },
  { to: "/app/integrations", label: "الربط والتكاملات", icon: Plug },
  { to: "/app/api-keys", label: "مفاتيح API", icon: KeyRound },
  { to: "/app/webhooks", label: "Webhooks", icon: Webhook },
  { to: "/app/alerts", label: "التنبيهات", icon: Bell },
  { to: "/app/risk", label: "إدارة المخاطر", icon: ShieldAlert },
  { to: "/app/team", label: "الفريق", icon: Users },
  { to: "/app/transfers", label: "التحويلات", icon: ArrowLeftRight, soon: true },
  { to: "/app/settings", label: "الإعدادات", icon: Settings },
];

const adminNav = [
  { to: "/admin", label: "لوحة التحكم", exact: true },
  { to: "/admin/merchants", label: "التجار" },
  { to: "/admin/subscriptions", label: "الاشتراكات والتجارب" },
  { to: "/admin/devices", label: "الأجهزة" },
  { to: "/admin/parser", label: "محرك التحليل" },
  { to: "/admin/fraud", label: "قائمة الاحتيال" },
  { to: "/admin/system", label: "الباقات والنظام" },
];

export function SidebarBrand({ title = "جوهر باي", subtitle, accent }: { title?: string; subtitle?: string; accent?: "primary" | "danger" }) {
  return (
    <div className="flex items-center gap-2 px-5 h-16 border-b shrink-0">
      <div className={cn("h-8 w-8 rounded-lg grid place-items-center text-white",
        accent === "danger" ? "bg-destructive" : "bg-hero-gradient")}>
        {accent === "danger" ? <span className="font-bold text-sm">A</span> : <Sparkles className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="font-display font-bold text-base truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
    </div>
  );
}

export function AppSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="p-3 overflow-y-auto flex-1 space-y-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to} onClick={onNavigate}
            className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.soon && <span className="text-[10px] rounded bg-warning/20 text-warning-foreground px-1.5 py-0.5">قريباً</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="p-3 space-y-1 overflow-y-auto flex-1">
      {adminNav.map((i) => {
        const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
        return (
          <Link key={i.to} to={i.to} onClick={onNavigate}
            className={cn("block rounded-md px-3 py-2 text-sm",
              active ? "bg-sidebar-accent text-sidebar-primary font-medium"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="w-64 shrink-0 border-l bg-sidebar text-sidebar-foreground h-screen sticky top-0 hidden md:flex flex-col">
      <SidebarBrand />
      <AppSidebarNav />
    </aside>
  );
}

export function AdminSidebar() {
  return (
    <aside className="w-64 shrink-0 border-l bg-sidebar h-screen sticky top-0 hidden md:flex flex-col">
      <SidebarBrand title="لوحة الإدارة" subtitle="داخلي فقط" accent="danger" />
      <AdminSidebarNav />
    </aside>
  );
}
