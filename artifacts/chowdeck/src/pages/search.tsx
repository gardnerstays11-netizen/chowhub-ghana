import { MainLayout } from "@/components/layout";
import { useSearchListings, useGetListingAutocomplete, useLogSearch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, SlidersHorizontal, ChevronDown, ArrowUpDown, Navigation, Loader2, UtensilsCrossed } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

const FALLBACK_CATEGORIES = [
  { id: "1", name: "Local Chop Bars", slug: "chop_bar", icon: "utensils" },
  { id: "2", name: "Fine Dining", slug: "fine_dining", icon: "wine" },
  { id: "3", name: "Cafes & Bakeries", slug: "cafe_bakery", icon: "coffee" },
  { id: "4", name: "Bars & Grills", slug: "bar_grill", icon: "flame" },
  { id: "5", name: "Street Food", slug: "street_food", icon: "shopping-bag" },
  { id: "6", name: "Seafood", slug: "seafood", icon: "fish" },
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

const CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale"];

const CUISINES = [
  { label: "Ghanaian", value: "ghanaian" },
  { label: "Nigerian", value: "nigerian" },
  { label: "Chinese", value: "chinese" },
  { label: "Indian", value: "indian" },
  { label: "Italian", value: "italian" },
  { label: "Lebanese", value: "lebanese" },
  { label: "Continental", value: "continental" },
  { label: "American", value: "american" },
];

const PRICE_RANGES = [
  { label: "$", value: "$" },
  { label: "$$", value: "$$" },
  { label: "$$$", value: "$$$" },
  { label: "$$$$", value: "$$$$" },
];

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "" },
  { label: "Nearest", value: "nearest" },
  { label: "Highest Rated", value: "highest_rated" },
  { label: "Most Reviewed", value: "most_reviewed" },
  { label: "Newest", value: "newest" },
  { label: "Featured", value: "featured" },
];

const DINING_STYLES = [
  { label: "Casual", value: "casual" },
  { label: "Fine Dining", value: "fine_dining" },
  { label: "Fast Casual", value: "fast_casual" },
  { label: "Buffet", value: "buffet" },
];

const OCCASIONS = [
  { label: "Date Night", value: "date_night" },
  { label: "Birthday Dinner", value: "birthday_dinner" },
  { label: "Family Outing", value: "family_outing" },
  { label: "Business Lunch", value: "business_lunch" },
  { label: "Casual Hangout", value: "casual_hangout" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Business Dinner", value: "business_dinner" },
  { label: "Group Outing", value: "group_outing" },
];

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : (location.split("?")[1] || ""));
  const query = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const categoryParam = searchParams.get("category") || "";
  const occasionParam = searchParams.get("occasion") || "";

  const [search, setSearch] = useState(query);
  const [debouncedSearch, setDebouncedSearch] = useState(query);
  const [selectedCity, setSelectedCity] = useState(cityParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedDiningStyle, setSelectedDiningStyle] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState(occasionParam);
  const [acceptsReservations, setAcceptsReservations] = useState(false);
  const [acceptsOrders, setAcceptsOrders] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFilters, setShowFilters] = useState(!!occasionParam);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: categoriesData } = useCategories();

  usePageMeta({
    title: query
      ? `"${query}" — Restaurant Search | ChowHub Ghana`
      : "Search Restaurants & Food Spots in Ghana | ChowHub Ghana",
    description: "Search and discover the best restaurants, chop bars, fast food joints, cafes, and street food spots across Ghana. Filter by cuisine, price, and location.",
    canonicalPath: "/search",
  });
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const logSearchMut = useLogSearch();
  const searchLoggedRef = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: suggestions } = useGetListingAutocomplete(
    { q: search, limit: 6 },
    { query: { enabled: search.length >= 2 && showAutocomplete } as any }
  );

  const { data, isLoading } = useSearchListings({
    q: debouncedSearch || undefined,
    city: selectedCity || undefined,
    category: selectedCategory || undefined,
    cuisine_type: selectedCuisine || undefined,
    price_range: selectedPrice || undefined,
    dining_style: selectedDiningStyle || undefined,
    sort: (selectedSort || undefined) as any,
    occasion: selectedOccasion || undefined,
    accepts_reservations: acceptsReservations ? "true" : undefined,
    accepts_orders: acceptsOrders ? "true" : undefined,
    lat: nearMeActive && userCoords ? userCoords.lat : undefined,
    lng: nearMeActive && userCoords ? userCoords.lng : undefined,
    limit: 30,
  });

  const logCurrentSearch = useCallback(() => {
    if (debouncedSearch.length >= 2 && searchLoggedRef.current !== debouncedSearch) {
      searchLoggedRef.current = debouncedSearch;
      logSearchMut.mutate({
        data: {
          query: debouncedSearch,
          resultsCount: data?.total || 0,
          city: selectedCity || null,
          category: selectedCategory || null,
        },
      });
    }
  }, [debouncedSearch, data?.total, selectedCity, selectedCategory, logSearchMut]);

  useEffect(() => {
    if (data && debouncedSearch.length >= 2) {
      logCurrentSearch();
    }
  }, [data, debouncedSearch, logCurrentSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSuggestionClick = (item: any) => {
    setShowAutocomplete(false);
    if (item.type === "dish" || !item.slug) {
      setSearch(item.name);
      setDebouncedSearch(item.name);
    } else {
      setLocation(`/listings/${item.slug}`);
    }
  };

  const toggleCity = (city: string) => setSelectedCity(prev => prev === city ? "" : city);
  const toggleCategory = (cat: string) => setSelectedCategory(prev => prev === cat ? "" : cat);
  const toggleCuisine = (c: string) => setSelectedCuisine(prev => prev === c ? "" : c);
  const togglePrice = (p: string) => setSelectedPrice(prev => prev === p ? "" : p);
  const toggleDiningStyle = (d: string) => setSelectedDiningStyle(prev => prev === d ? "" : d);
  const toggleOccasion = (o: string) => setSelectedOccasion(prev => prev === o ? "" : o);

  const handleNearMe = () => {
    if (nearMeActive) {
      setNearMeActive(false);
      setUserCoords(null);
      setLocationError("");
      if (selectedSort === "nearest") setSelectedSort("");
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setNearMeActive(true);
        setSelectedSort("nearest");
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please enable location in your browser settings.");
        } else {
          setLocationError("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearFilters = () => {
    setSelectedCity("");
    setSelectedCategory("");
    setSelectedCuisine("");
    setSelectedPrice("");
    setSelectedSort("");
    setSelectedDiningStyle("");
    setSelectedOccasion("");
    setAcceptsReservations(false);
    setAcceptsOrders(false);
    setSearch("");
    setDebouncedSearch("");
    setNearMeActive(false);
    setUserCoords(null);
    setLocationError("");
  };

  const activeFilterCount =
    (selectedCity ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedCuisine ? 1 : 0) +
    (selectedPrice ? 1 : 0) + (selectedDiningStyle ? 1 : 0) + (selectedOccasion ? 1 : 0) +
    (acceptsReservations ? 1 : 0) + (acceptsOrders ? 1 : 0) + (nearMeActive ? 1 : 0);

  return (
    <MainLayout>
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xl" ref={autocompleteRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => search.length >= 2 && setShowAutocomplete(true)}
                placeholder="Search by restaurant, dish, or cuisine..."
                className="pl-10 pr-10 h-11 bg-background border-border text-sm"
              />
              {search && (
                <button onClick={() => { setSearch(""); setDebouncedSearch(""); setShowAutocomplete(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}

              {showAutocomplete && suggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  {suggestions.map((s: any) => {
                    const isDish = s.type === "dish" || s.category === "dish";
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                      >
                        {isDish ? (
                          <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {isDish ? "Dish · Tap to search" : `${(s.category || "").replace(/_/g, " ")} · ${s.area || ""}, ${s.city || ""}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleNearMe}
              disabled={locationLoading}
              className={`h-11 px-4 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${nearMeActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted/50"}`}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{nearMeActive ? "Near Me" : "Near Me"}</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? "border-primary bg-primary/5 text-primary" : "border-border bg-background hover:bg-muted/50"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>

            <div className="relative hidden sm:block">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="h-11 pl-9 pr-4 border border-border rounded-lg text-sm font-medium bg-background appearance-none cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {showFilters && (
            <div className="mt-5 pt-5 border-t border-border/50 space-y-5">
              <FilterSection label="City">
                {CITIES.map(c => (
                  <FilterChip key={c} label={c} active={selectedCity === c} onClick={() => toggleCity(c)} />
                ))}
              </FilterSection>

              <FilterSection label="Category">
                {(categoriesData || []).map(c => (
                  <FilterChip key={c.slug} label={c.name} active={selectedCategory === c.slug} onClick={() => toggleCategory(c.slug)} />
                ))}
              </FilterSection>

              <FilterSection label="Cuisine">
                {CUISINES.map(c => (
                  <FilterChip key={c.value} label={c.label} active={selectedCuisine === c.value} onClick={() => toggleCuisine(c.value)} />
                ))}
              </FilterSection>

              <div className="flex flex-wrap gap-x-10 gap-y-5">
                <FilterSection label="Price Range">
                  {PRICE_RANGES.map(p => (
                    <FilterChip key={p.value} label={p.label} active={selectedPrice === p.value} onClick={() => togglePrice(p.value)} />
                  ))}
                </FilterSection>

                <FilterSection label="Dining Style">
                  {DINING_STYLES.map(d => (
                    <FilterChip key={d.value} label={d.label} active={selectedDiningStyle === d.value} onClick={() => toggleDiningStyle(d.value)} />
                  ))}
                </FilterSection>
              </div>

              <FilterSection label="Occasion">
                {OCCASIONS.map(o => (
                  <FilterChip key={o.value} label={o.label} active={selectedOccasion === o.value} onClick={() => toggleOccasion(o.value)} />
                ))}
              </FilterSection>

              <FilterSection label="Services">
                <FilterChip label="Accepts Reservations" active={acceptsReservations} onClick={() => setAcceptsReservations(p => !p)} />
                <FilterChip label="Accepts Orders" active={acceptsOrders} onClick={() => setAcceptsOrders(p => !p)} />
              </FilterSection>

              {activeFilterCount > 0 && (
                <div className="flex justify-end">
                  <button onClick={clearFilters} className="text-sm text-primary hover:underline font-medium">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}

        {nearMeActive && userCoords && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary flex items-center gap-2">
            <Navigation className="w-4 h-4 shrink-0" />
            Showing results sorted by distance from your location
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching..." : `${data?.total || 0} places found`}
          </p>
          <div className="sm:hidden">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-72"></div>
            ))}
          </div>
        ) : data?.listings && data.listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.listings.map((listing: any) => (
              <div key={listing.id} className="relative">
                <ListingCard listing={listing} />
                {nearMeActive && listing.distance != null && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-md shadow-sm text-primary flex items-center gap-1 z-10">
                    <Navigation className="w-3 h-3" />
                    {listing.distance < 1 ? `${Math.round(listing.distance * 1000)}m` : `${listing.distance} km`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No places found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background hover:bg-muted/50 text-foreground"}`}
    >
      {label}
    </button>
  );
}
