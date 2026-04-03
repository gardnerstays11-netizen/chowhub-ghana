import { MainLayout } from "@/components/layout";
import { useSearchListings, useGetListingAutocomplete, useLogSearch } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, X, MapPin, SlidersHorizontal } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale"];
const CATEGORIES = [
  { label: "Chop Bars", value: "chop_bar" },
  { label: "Fine Dining", value: "fine_dining" },
  { label: "Cafes & Bakeries", value: "cafe_bakery" },
  { label: "Street Food", value: "street_food" },
  { label: "Bars & Grills", value: "bar_grill" },
  { label: "Seafood", value: "seafood" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Fast Food", value: "fast_food" },
];

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const categoryParam = searchParams.get("category") || "";

  const [search, setSearch] = useState(query);
  const [debouncedSearch, setDebouncedSearch] = useState(query);
  const [selectedCity, setSelectedCity] = useState(cityParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleSuggestionClick = (slug: string) => {
    setShowAutocomplete(false);
    setLocation(`/listings/${slug}`);
  };

  const toggleCity = (city: string) => {
    setSelectedCity(prev => prev === city ? "" : city);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategory(prev => prev === cat ? "" : cat);
  };

  const clearFilters = () => {
    setSelectedCity("");
    setSelectedCategory("");
    setSearch("");
    setDebouncedSearch("");
  };

  const activeFilterCount = (selectedCity ? 1 : 0) + (selectedCategory ? 1 : 0);

  return (
    <MainLayout>
      <div className="border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg" ref={autocompleteRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => search.length >= 2 && setShowAutocomplete(true)}
                placeholder="Search restaurants, cuisines, dishes..."
                className="pl-9 pr-9 h-11 bg-card border-border"
              />
              {search && (
                <button onClick={() => { setSearch(""); setDebouncedSearch(""); setShowAutocomplete(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}

              {showAutocomplete && suggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSuggestionClick(s.slug)}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{s.category.replace(/_/g, " ")} · {s.area}, {s.city}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters || activeFilterCount > 0 ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-6">
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">City</h4>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleCity(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedCity === c ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Category</h4>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => toggleCategory(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedCategory === c.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline self-end">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-5">
          {isLoading ? "Searching..." : `${data?.total || 0} places found`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-72"></div>
            ))}
          </div>
        ) : data?.listings && data.listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold mb-1">No places found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
