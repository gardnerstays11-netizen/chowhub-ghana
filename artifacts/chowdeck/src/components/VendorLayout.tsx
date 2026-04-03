import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BookOpen, Calendar, Image, Star, BarChart3, Settings, Crown } from "lucide-react";

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard, pendingAllowed: true },
  { href: "/vendor/menu", label: "Menu", icon: BookOpen, pendingAllowed: true },
  { href: "/vendor/events", label: "Events", icon: Calendar, pendingAllowed: false },
  { href: "/vendor/photos", label: "Photos", icon: Image, pendingAllowed: true },
  { href: "/vendor/reviews", label: "Reviews", icon: Star, pendingAllowed: false },
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3, pendingAllowed: false },
  { href: "/vendor/subscription", label: "Subscription", icon: Crown, pendingAllowed: true },
  { href: "/vendor/settings", label: "Settings", icon: Settings, pendingAllowed: true },
];

export default function VendorLayout({ children }: { children: ReactNode }) {
  const { vendor, isVendorAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isVendorAuthenticated) {
      setLocation("/vendor/login");
    }
  }, [isVendorAuthenticated, setLocation]);

  if (!isVendorAuthenticated || !vendor) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-card border-b border-border/50 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vendor/dashboard" className="font-serif text-xl font-bold text-primary flex items-center gap-2">
              <span className="text-secondary">Chow</span>Hub <span className="text-muted-foreground text-sm font-sans font-normal ml-2">Vendor Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">{vendor.businessName}</span>
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/vendor/login"); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {navItems.map(item => {
            const isActive = location === item.href;
            const disabled = vendor.status === 'pending' && !item.pendingAllowed;
            if (disabled) {
              return (
                <button key={item.href} disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap opacity-40 cursor-not-allowed">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link key={item.href} href={item.href}>
                <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
