import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Image, Store, MapPin, Users, CreditCard, Settings, Tag } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/partners", label: "Partners", icon: Image },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/listings", label: "Listings", icon: MapPin },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export default function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { isAdminAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

  if (!isAdminAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-60 bg-zinc-950 text-white shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-zinc-800/50">
          <h2 className="font-semibold text-base tracking-tight">ChowHub Admin</h2>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location === item.href || (item.href !== '/admin/dashboard' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800/50">
          <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5 text-sm h-10" onClick={() => { logout(); setLocation("/admin/login"); }}>
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto min-h-screen">
        <header className="bg-white border-b border-zinc-200/80 px-8 py-5 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
