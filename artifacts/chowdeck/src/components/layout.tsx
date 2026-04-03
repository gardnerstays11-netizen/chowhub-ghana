import { Link } from "wouter";
import { Button } from "./ui/button";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight flex items-center gap-0.5" style={{ fontFamily: 'var(--app-font-display)' }}>
            <span className="text-secondary">Chow</span><span className="text-primary">Hub</span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center text-sm font-medium text-muted-foreground">
            <Link href="/search" className="hover:text-foreground transition-colors">Discover</Link>
            <Link href="/search?category=fine_dining" className="hover:text-foreground transition-colors">Fine Dining</Link>
            <Link href="/search?category=chop_bar" className="hover:text-foreground transition-colors">Local Eats</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/register">Sign up</Link>
            </Button>
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
              <p className="text-primary-foreground/70 text-sm leading-relaxed">Discover the best food and dining experiences across Ghana.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary-foreground/50">Cities</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/search?city=Accra" className="hover:text-white transition-colors">Accra</Link></li>
                <li><Link href="/search?city=Kumasi" className="hover:text-white transition-colors">Kumasi</Link></li>
                <li><Link href="/search?city=Takoradi" className="hover:text-white transition-colors">Takoradi</Link></li>
                <li><Link href="/search?city=Tamale" className="hover:text-white transition-colors">Tamale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary-foreground/50">For Businesses</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li><Link href="/vendor/login" className="hover:text-white transition-colors">Vendor Login</Link></li>
                <li><Link href="/vendor/register" className="hover:text-white transition-colors">Add Your Restaurant</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/40">
            &copy; {new Date().getFullYear()} ChowHub Ghana. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
