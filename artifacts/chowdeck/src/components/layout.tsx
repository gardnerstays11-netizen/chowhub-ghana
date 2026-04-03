import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-semibold tracking-tight flex items-center gap-0.5" style={{ fontFamily: 'var(--app-font-display)' }}>
              <span className="text-secondary">Chow</span><span className="text-primary">Hub</span>
            </Link>
            <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
              <Link href="/search" className={`transition-colors ${location.startsWith('/search') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Discover</Link>
              <Link href="/search?category=fine_dining" className="text-muted-foreground hover:text-foreground transition-colors">Fine Dining</Link>
              <Link href="/search?category=chop_bar" className="text-muted-foreground hover:text-foreground transition-colors">Local Eats</Link>
              <Link href="/places" className={`transition-colors ${location.startsWith('/places') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Places</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{user?.name || 'Dashboard'}</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
                <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                  <Link href="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-primary text-primary-foreground pt-12 pb-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <p className="text-xl font-semibold mb-3" style={{ fontFamily: 'var(--app-font-display)' }}>
                <span className="text-secondary">Chow</span>Hub
              </p>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">Discover the best food and dining experiences across Ghana.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary-foreground/40">Explore</h4>
              <ul className="space-y-2.5 text-sm text-primary-foreground/60">
                <li><Link href="/search" className="hover:text-white transition-colors">All Restaurants</Link></li>
                <li><Link href="/search?category=fine_dining" className="hover:text-white transition-colors">Fine Dining</Link></li>
                <li><Link href="/search?category=chop_bar" className="hover:text-white transition-colors">Local Chop Bars</Link></li>
                <li><Link href="/search?category=cafe_bakery" className="hover:text-white transition-colors">Cafes & Bakeries</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary-foreground/40">Cities</h4>
              <ul className="space-y-2.5 text-sm text-primary-foreground/60">
                <li><Link href="/search?city=Accra" className="hover:text-white transition-colors">Accra</Link></li>
                <li><Link href="/search?city=Kumasi" className="hover:text-white transition-colors">Kumasi</Link></li>
                <li><Link href="/search?city=Takoradi" className="hover:text-white transition-colors">Takoradi</Link></li>
                <li><Link href="/search?city=Tamale" className="hover:text-white transition-colors">Tamale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-4 text-primary-foreground/40">For Restaurants</h4>
              <ul className="space-y-2.5 text-sm text-primary-foreground/60">
                <li><Link href="/vendor/login" className="hover:text-white transition-colors">Vendor Portal</Link></li>
                <li><Link href="/vendor/register" className="hover:text-white transition-colors">List Your Restaurant</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/30">
            &copy; {new Date().getFullYear()} ChowHub Ghana. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
