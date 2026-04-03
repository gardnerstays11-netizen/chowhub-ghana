import { Link } from "wouter";
import { Card } from "./ui/card";
import { Star, MapPin } from "lucide-react";
import { ListingCard as ListingCardType } from "@workspace/api-client-react";

interface Props {
  listing: ListingCardType;
}

export function ListingCard({ listing }: Props) {
  return (
    <Link href={`/listings/${listing.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col border-border">
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          {listing.coverPhoto ? (
            <img 
              src={listing.coverPhoto} 
              alt={listing.name}
              className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30 text-lg font-medium">
              {listing.name}
            </div>
          )}
          {listing.isFeatured && (
            <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded">
              Featured
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover:text-primary transition-colors">{listing.name}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
              <span className="text-sm font-semibold">{listing.averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{listing.area}, {listing.city}</span>
          </div>

          <div className="flex items-center gap-2 mt-auto text-xs text-muted-foreground">
            <span className="capitalize">{listing.category.replace('_', ' ')}</span>
            <span className="text-border">&middot;</span>
            <span>{listing.priceRange}</span>
            {listing.cuisineType.length > 0 && (
              <>
                <span className="text-border">&middot;</span>
                <span className="capitalize line-clamp-1">{listing.cuisineType.slice(0, 2).map(c => c.replace('_', ' ')).join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
