import { MainLayout } from "@/components/layout";
import { useSearchListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";

  const [search, setSearch] = useState(query);

  const { data, isLoading } = useSearchListings({
    q: search,
    city: cityParam || undefined,
    limit: 20
  });

  return (
    <MainLayout>
      <div className="bg-primary/5 py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants, cuisines..."
                className="pl-12 h-12 rounded-full bg-card border-border/50 text-lg shadow-sm"
              />
            </div>
            <Button variant="outline" className="h-12 rounded-full px-6 gap-2 w-full md:w-auto bg-card border-border/50">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-8 hidden md:block">
            <div>
              <h3 className="font-serif font-bold text-lg mb-4">City</h3>
              <div className="space-y-2">
                {["Accra", "Kumasi", "Takoradi", "Tamale"].map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary accent-primary" defaultChecked={c === cityParam} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg mb-4">Category</h3>
              <div className="space-y-2">
                {["chop_bar", "fine_dining", "cafe_bakery", "street_food"].map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary accent-primary" />
                    <span className="capitalize">{c.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-medium text-muted-foreground">
                {isLoading ? "Searching..." : `Found ${data?.total || 0} places`}
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-muted animate-pulse rounded-xl h-80"></div>
                ))}
              </div>
            ) : data?.listings && data.listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-muted/30 rounded-3xl border border-border/50">
                <h3 className="text-2xl font-serif font-bold mb-2">No places found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
