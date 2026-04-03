import { MainLayout } from "@/components/layout";
import { useSearchListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
      <div className="border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants, cuisines..."
              className="pl-9 h-11 bg-card border-border"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-10">
          <aside className="w-full md:w-52 shrink-0 space-y-6 hidden md:block">
            <div>
              <h4 className="font-semibold text-sm mb-3">City</h4>
              <div className="space-y-2">
                {["Accra", "Kumasi", "Takoradi", "Tamale"].map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="rounded accent-primary" defaultChecked={c === cityParam} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Category</h4>
              <div className="space-y-2">
                {["chop_bar", "fine_dining", "cafe_bakery", "street_food"].map(c => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" className="rounded accent-primary" />
                    <span className="capitalize">{c.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
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
        </div>
      </div>
    </MainLayout>
  );
}
