import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useGetFeaturedListings, useGetRecentListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Accra");

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedListings();
  const { data: recent, isLoading: recentLoading } = useGetRecentListings({ limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <MainLayout>
      <section className="relative bg-primary/5 py-24 md:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              Taste the heart of <span className="text-primary">Ghana</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              From bustling chop bars to elegant rooftop dining. Find your next favorite meal.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto bg-card p-4 rounded-3xl shadow-lg border border-border/50">
              <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Restaurant, cuisine, or dish..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full flex-1 text-sm font-medium"
                >
                  <option value="Accra">Accra</option>
                  <option value="Kumasi">Kumasi</option>
                  <option value="Takoradi">Takoradi</option>
                  <option value="Tamale">Tamale</option>
                </select>
              </div>
              <Button type="submit" size="lg" className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold">Explore by Category</h2>
            <Link href="/search" className="text-primary font-medium hover:underline flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Local Chop Bars", slug: "chop_bar", emoji: "🍲" },
              { name: "Fine Dining", slug: "fine_dining", emoji: "🍽️" },
              { name: "Cafes", slug: "cafe", emoji: "☕" },
              { name: "Bars & Grills", slug: "bar_grill", emoji: "🍻" },
              { name: "Street Food", slug: "street_food", emoji: "🌯" },
              { name: "Seafood", slug: "seafood", emoji: "🦐" }
            ].map((cat) => (
              <Link key={cat.slug} href={`/search?category=${cat.slug}`} className="group block">
                <div className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center p-4 text-center group-hover:bg-primary/10 transition-colors border border-border/50">
                  <span className="text-3xl mb-2">{cat.emoji}</span>
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold">Featured Places</h2>
              <p className="text-muted-foreground mt-1">Top picks from the ChowHub community</p>
            </div>
            <Link href="/search?sort=featured" className="text-primary font-medium hover:underline flex items-center gap-1">See All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-80"></div>
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold">Recently Added</h2>
              <p className="text-muted-foreground mt-1">Fresh spots to try out</p>
            </div>
            <Link href="/search?sort=newest" className="text-primary font-medium hover:underline flex items-center gap-1">See All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {recentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-xl h-80"></div>
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent.slice(0, 6).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Own a Restaurant?</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            List your restaurant on ChowHub and reach thousands of food lovers across Ghana.
          </p>
          <Button asChild size="lg" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8">
            <Link href="/vendor/register">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
