import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowRight, Navigation, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { useGetFeaturedListings, useGetRecentListings, useGetNearbyListings, useGetListingAutocomplete, useGetPartners } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";

const CATEGORIES = [
  { name: "Local Chop Bars", slug: "chop_bar" },
  { name: "Fine Dining", slug: "fine_dining" },
  { name: "Cafes & Bakeries", slug: "cafe_bakery" },
  { name: "Bars & Grills", slug: "bar_grill" },
  { name: "Street Food", slug: "street_food" },
  { name: "Seafood", slug: "seafood" },
];

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { coords, loading, error, requestLocation };
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Accra");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { coords, loading: geoLoading } = useGeolocation();

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedListings();
  const { data: recent, isLoading: recentLoading } = useGetRecentListings({ limit: 6 });
  const { data: nearby, isLoading: nearbyLoading } = useGetNearbyListings(
    { lat: coords?.lat || 0, lng: coords?.lng || 0, radius: 10, limit: 6 },
    { query: { enabled: !!coords } as any }
  );

  const { data: partners } = useGetPartners();

  const { data: suggestions } = useGetListingAutocomplete(
    { q: search, limit: 6 },
    { query: { enabled: search.length >= 2 && showAutocomplete } as any }
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutocomplete(false);
    setLocation(`/search?q=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}`);
  };

  const handleSuggestionClick = (slug: string) => {
    setShowAutocomplete(false);
    setLocation(`/listings/${slug}`);
  };

  return (
    <MainLayout>
      <section className="bg-primary text-primary-foreground py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-4">
              Find great food across Ghana
            </h1>
            <p className="text-primary-foreground/70 text-lg mb-10 max-w-lg">
              From chop bars to rooftop dining — search restaurants, read reviews, and book tables.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="flex-1 relative" ref={autocompleteRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => search.length >= 2 && setShowAutocomplete(true)}
                  placeholder="Restaurant, cuisine, or dish..."
                  className="pl-9 h-11 bg-white text-foreground border-0 rounded-md"
                />
                {showAutocomplete && suggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSuggestionClick(s.slug)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0 text-foreground"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{s.category.replace(/_/g, " ")} · {s.area}, {s.city}</div>
                        </div>
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 text-sm text-primary font-medium"
                    >
                      <Search className="w-4 h-4" />
                      <span>See all results for "{search}"</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 pl-9 pr-8 bg-white text-foreground border-0 rounded-md text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="Accra">Accra</option>
                  <option value="Kumasi">Kumasi</option>
                  <option value="Takoradi">Takoradi</option>
                  <option value="Tamale">Tamale</option>
                </select>
              </div>
              <Button type="submit" size="default" className="h-11 px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold rounded-md">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {coords && nearby && nearby.length > 0 && (
        <section className="py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl">Near you</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Restaurants close to your location</p>
                </div>
              </div>
            </div>
            {nearbyLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Finding nearby places...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {nearby.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Browse by category</h2>
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/search?category=${cat.slug}`} className="group block">
                <div className="border border-border rounded-lg px-4 py-5 text-center hover:border-primary/30 hover:bg-primary/[0.03] transition-colors">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl">Featured places</h2>
              <p className="text-muted-foreground text-sm mt-1">Top picks from the ChowHub community</p>
            </div>
            <Link href="/search?sort=featured" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-72"></div>
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.slice(0, 6).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-14 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl">Recently added</h2>
              <p className="text-muted-foreground text-sm mt-1">New spots to try out</p>
            </div>
            <Link href="/search?sort=newest" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-72"></div>
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recent.slice(0, 6).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {partners && partners.length > 0 && (
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl">Meet Our Partners</h2>
              <p className="text-muted-foreground text-sm mt-1">Trusted by leading organizations across Ghana</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {partners.map(partner => (
                <a
                  key={partner.id}
                  href={partner.website || "#"}
                  target={partner.website ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center p-4 rounded-xl border border-border bg-white hover:shadow-md hover:border-primary/20 transition-all grayscale hover:grayscale-0">
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2 group-hover:text-foreground transition-colors">{partner.name}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="text-3xl mb-3">Own a restaurant?</h2>
          <p className="text-primary-foreground/70 mb-8">
            List your restaurant on ChowHub and reach food lovers across Ghana.
          </p>
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-6">
            <Link href="/vendor/register">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
