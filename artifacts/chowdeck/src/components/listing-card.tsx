import { Link } from "wouter";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star, MapPin, Clock } from "lucide-react";
import { ListingCard as ListingCardType } from "@workspace/api-client-react";

interface Props {
  listing: ListingCardType;
}

export function ListingCard({ listing }: Props) {
  return (
    <Link href={`/listings/${listing.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col border-border/50">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {listing.coverPhoto ? (
            <img 
              src={listing.coverPhoto} 
              alt={listing.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40 font-serif text-xl font-bold">
              ChowHub
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {listing.isFeatured && (
              <Badge className="bg-secondary text-secondary-foreground font-bold border-0 shadow-sm">Featured</Badge>
            )}
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground border-0 shadow-sm">
              {listing.category.replace('_', ' ')}
            </Badge>
          </div>
          {listing.distance && (
            <Badge variant="outline" className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm shadow-sm font-medium border-0">
              {(listing.distance / 1000).toFixed(1)} km
            </Badge>
          )}
        </div>
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-serif font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">{listing.name}</h3>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              <span className="text-sm font-bold text-primary">{listing.averageRating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{listing.area}, {listing.city}</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-auto pt-4">
            <Badge variant="outline" className="bg-muted/50 border-0 text-xs">
              {listing.priceRange === '$' ? '$' :
               listing.priceRange === '$$' ? '$$' :
               listing.priceRange === '$$$' ? '$$$' : '$$$$'}
            </Badge>
            {listing.cuisineType.slice(0, 2).map(cuisine => (
              <Badge key={cuisine} variant="outline" className="bg-muted/50 border-0 text-xs text-muted-foreground capitalize">
                {cuisine.replace('_', ' ')}
              </Badge>
            ))}
            {listing.cuisineType.length > 2 && (
              <Badge variant="outline" className="bg-muted/50 border-0 text-xs text-muted-foreground">
                +{listing.cuisineType.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
