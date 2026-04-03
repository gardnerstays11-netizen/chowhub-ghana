import { MainLayout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Utensils, Wine, Coffee, Fish, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

const PLACE_CATEGORIES = [
  { label: "All", value: "", icon: Utensils },
  { label: "Fine Dining", value: "fine_dining", icon: Wine },
  { label: "Restaurants", value: "restaurant", icon: Utensils },
  { label: "Cafés", value: "cafe", icon: Coffee },
  { label: "Seafood", value: "seafood", icon: Fish },
];

interface Listing {
  id: string;
  name: string;
  slug: string;
  category: string;
  coverPhoto: string;
  city: string;
  area: string;
  averageRating: number;
  totalReviews: number;
  priceRange: string;
  cuisineType: string[];
  diningStyle: string;
  isFeatured: boolean;
  isVerified: boolean;
  acceptsReservations: boolean;
}

export default function PlacesPage() {
  usePageMeta({
    title: "Places — Reserve a Table | ChowHub Ghana",
    description: "Discover and reserve tables at the best restaurants, cafés, and dining venues across Ghana.",
    canonicalPath: "/places",
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ accepts_reservations: "true" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);

    fetch(`${API_BASE}/listings?${params}`)
      .then(r => r.json())
      .then(data => {
        const items = data.listings || data || [];
        setListings(items);
        if (!search && !category) {
          setFeatured(items.filter((l: Listing) => l.isFeatured).slice(0, 4));
        }
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  return (
    <MainLayout>
      <div className="bg-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--app-font-display)" }}>
              Find & Reserve a Table
            </h1>
            <p className="text-muted-foreground">
              Discover the best dining venues across Ghana and book your table instantly.
            </p>
          </div>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search venues..."
              className="pl-10 h-11 rounded-full border-border/60 bg-background"
            />
          </div>

          <div className="flex justify-center gap-2 mt-6 flex-wrap">
            {PLACE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border/60 hover:border-primary/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {!search && !category && featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--app-font-display)" }}>
                Top Picks for You
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--app-font-display)" }}>
              {search || category ? "Results" : "All Reservable Venues"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {listings.length} {listings.length === 1 ? "venue" : "venues"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/50">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">No reservable venues found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
