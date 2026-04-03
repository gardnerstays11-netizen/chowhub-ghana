import { Link } from "wouter";
import { Button } from "./ui/button";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
            <span className="text-secondary">Chow</span>Hub
          </Link>
          <nav className="hidden md:flex gap-6 items-center font-medium">
            <Link href="/search" className="hover:text-primary transition-colors">Discover</Link>
            <Link href="/search?category=fine_dining" className="hover:text-primary transition-colors">Fine Dining</Link>
            <Link href="/search?category=chop_bar" className="hover:text-primary transition-colors">Local Eats</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary">Log in</Link>
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-primary text-primary-foreground py-12 mt-12">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4 text-secondary">ChowHub</h3>
            <p className="text-primary-foreground/80">Discover the best food and dining experiences across Ghana.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Cities</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link href="/search?city=Accra">Accra</Link></li>
              <li><Link href="/search?city=Kumasi">Kumasi</Link></li>
              <li><Link href="/search?city=Takoradi">Takoradi</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">For Businesses</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link href="/vendor/login">Vendor Login</Link></li>
              <li><Link href="/vendor/register">Add Your Restaurant</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
