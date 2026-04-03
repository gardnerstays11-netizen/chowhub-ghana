import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, ArrowRight, Navigation, Loader2, TrendingUp, Sparkles, Heart, Star, Calendar, Gem } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { useGetFeaturedListings, useGetRecentListings, useGetNearbyListings, useGetListingAutocomplete, useGetPartners, useGetTrendingListings, useGetUpcomingEvents } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { usePageMeta } from "@/hooks/use-page-meta";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

const FALLBACK_CATEGORIES = [
  { id: "1", name: "Local Chop Bars", slug: "chop_bar", icon: "utensils" },
  { id: "2", name: "Fine Dining", slug: "fine_dining", icon: "wine" },
  { id: "3", name: "Cafes & Bakeries", slug: "cafe_bakery", icon: "coffee" },
  { id: "4", name: "Bars & Grills", slug: "bar_grill", icon: "flame" },
  { id: "5", name: "Street Food", slug: "street_food", icon: "shopping-bag" },
  { id: "6", name: "Seafood", slug: "seafood", icon: "fish" },
  { id: "7", name: "Fast Food", slug: "fast_food", icon: "zap" },
  { id: "8", name: "Restaurants", slug: "restaurant", icon: "store" },
];

function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) return FALLBACK_CATEGORIES;
        const data = await res.json();
        return data.length > 0 ? data : FALLBACK_CATEGORIES;
      } catch {
        return FALLBACK_CATEGORIES;
      }
    },
  });
}

function useHiddenGems() {
  return useQuery({
    queryKey: ["hidden-gems"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/listings/hidden-gems?limit=6`);
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
  });
}

function useEditorsPicks() {
  return useQuery({
    queryKey: ["editors-picks"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/editors-picks`);
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
  });
}

const OCCASIONS = [
  { value: "date_night", label: "Date Night", icon: Heart },
  { value: "birthday_dinner", label: "Birthday Dinner", icon: Sparkles },
  { value: "family_outing", label: "Family Outing", icon: Heart },
  { value: "business_lunch", label: "Business Lunch", icon: Star },
  { value: "casual_hangout", label: "Casual Hangout", icon: Star },
  { value: "anniversary", label: "Anniversary", icon: Heart },
  { value: "group_outing", label: "Group Outing", icon: Star },
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
  const { data: categories } = useCategories();
  const { data: trending } = useGetTrendingListings({ limit: 6 });
  const { data: hiddenGems } = useHiddenGems();
  const { data: editorsPicks } = useEditorsPicks();
  const { data: events } = useGetUpcomingEvents({ limit: 6 });

  usePageMeta({
    title: "ChowHub Ghana — Discover the Best Restaurants & Food Spots",
    description: "Find the best restaurants, chop bars, street food, and fine dining across Ghana. Browse by category, read reviews, and book tables on ChowHub.",
    canonicalPath: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ChowHub Ghana",
      url: "https://chowhub.gh",
      description: "Ghana's premier food and dining discovery platform. Find restaurants, chop bars, street food, and fine dining across Accra, Kumasi, and beyond.",
      areaServed: {
        "@type": "Country",
        name: "Ghana",
      },
      sameAs: [],
    },
  });

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
            {(categories || []).map((cat) => (
              <Link key={cat.slug} href={`/search?category=${cat.slug}`} className="group block">
                <div className="border border-border rounded-lg px-4 py-5 text-center hover:border-primary/30 hover:bg-primary/[0.03] transition-colors">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl mb-5">Find by occasion</h2>
          <div className="flex flex-wrap gap-2.5">
            {OCCASIONS.map(occ => (
              <Link
                key={occ.value}
                href={`/search?occasion=${occ.value}`}
                className="group inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
              >
                <occ.icon className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{occ.label}</span>
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

      {trending && trending.length > 0 && (
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl">Trending now</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Popular this week based on reviews and visits</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trending.slice(0, 6).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {hiddenGems && hiddenGems.length > 0 && (
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Gem className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl">Hidden gems</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Highly rated spots that fly under the radar</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hiddenGems.slice(0, 6).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {events && events.length > 0 && (
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl">Upcoming events</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Live music, special menus, and more happening soon</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 6).map((event: any) => (
                <div key={event.id} className="border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-xs text-secondary font-medium mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(event.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{event.title}</h3>
                  {event.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.description}</p>}
                  <span className="text-xs capitalize px-2 py-0.5 rounded bg-muted text-muted-foreground">{event.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {editorsPicks && editorsPicks.length > 0 && (
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl">Editor's picks</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Curated collections by the ChowHub team</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {editorsPicks.map((pick: any) => (
                <Link key={pick.id} href={`/search?q=${encodeURIComponent(pick.title)}`} className="group block">
                  <div className="border border-border rounded-lg p-6 hover:border-primary/30 hover:bg-primary/[0.02] transition-colors">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{pick.title}</h3>
                    {pick.description && <p className="text-sm text-muted-foreground mb-3">{pick.description}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-secondary">{pick.listingCount} {pick.listingCount === 1 ? "place" : "places"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
