import { MainLayout } from "@/components/layout";
import { useGetListingBySlug, useGetListingMenu, useGetListingReviews, useCreateReservation, useCreateOrder, useSaveListing, useUnsaveListing } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, Phone, MessageCircle, Heart, Share2, Navigation, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function ListingDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: listing, isLoading } = useGetListingBySlug(slug || "", {
    query: { enabled: !!slug }
  });

  const { data: menu } = useGetListingMenu(listing?.id || "", {
    query: { enabled: !!listing?.id }
  });

  const { data: reviews } = useGetListingReviews(listing?.id || "", {}, {
    query: { enabled: !!listing?.id }
  });

  const saveMutation = useSaveListing();

  const priceMap: Record<string, string> = { "$": "$", "$$": "$$", "$$$": "$$$", "$$$$": "$$$$" };
  const jsonLd = useMemo(() => {
    if (!listing) return undefined;
    const ld: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": listing.name,
      "description": listing.description,
      "url": `https://chowhub.gh/listings/${listing.slug}`,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": listing.address,
        "addressLocality": listing.area,
        "addressRegion": listing.city,
        "addressCountry": "GH",
      },
      "servesCuisine": listing.cuisineType,
      "priceRange": priceMap[listing.priceRange] || listing.priceRange,
    };
    if (listing.phone) ld.telephone = listing.phone;
    if (listing.lat && listing.lng) {
      ld.geo = { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng };
    }
    if (listing.coverPhoto) ld.image = listing.coverPhoto;
    if (listing.averageRating && listing.totalReviews) {
      ld.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: listing.averageRating,
        reviewCount: listing.totalReviews,
        bestRating: 5,
      };
    }
    if (listing.acceptsReservations) ld.acceptsReservations = "True";
    return ld;
  }, [listing]);

  usePageMeta({
    title: listing ? `${listing.name} — ${listing.area}, ${listing.city} | ChowHub Ghana` : "ChowHub Ghana",
    description: listing ? `${listing.name} in ${listing.area}, ${listing.city}. ${listing.cuisineType?.join(", ")} cuisine. ${listing.description?.slice(0, 120)}` : undefined,
    canonicalPath: listing ? `/listings/${listing.slug}` : undefined,
    ogImage: listing?.coverPhoto || undefined,
    jsonLd,
  });

  const getDirectionsUrl = () => {
    if (!listing) return "#";
    if (listing.lat && listing.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`;
    }
    const addr = encodeURIComponent(`${listing.address}, ${listing.area}, ${listing.city}, Ghana`);
    return `https://www.google.com/maps/dir/?api=1&destination=${addr}`;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-64 md:h-80 bg-muted rounded-lg w-full"></div>
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!listing) return <MainLayout><div className="text-center py-20 text-muted-foreground">Listing not found</div></MainLayout>;

  const menuByCategory = menu?.reduce((acc: Record<string, typeof menu>, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof menu>) || {};

  return (
    <MainLayout>
      <div className="relative h-64 md:h-[360px] w-full bg-muted overflow-hidden">
        {listing.photos && listing.photos.length > 0 ? (
          <img src={listing.photos[0].url} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20 text-3xl font-medium">
            {listing.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:px-0 md:py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2 text-sm text-white/60">
                  <span className="capitalize">{listing.category.replace(/_/g, ' ')}</span>
                  {listing.priceRange && (
                    <>
                      <span className="text-white/30">&middot;</span>
                      <span>{listing.priceRange}</span>
                    </>
                  )}
                  {listing.isFeatured && (
                    <>
                      <span className="text-white/30">&middot;</span>
                      <span className="text-secondary font-medium">Featured</span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2" style={{ fontFamily: 'var(--app-font-display)' }}>{listing.name}</h1>
                <div className="flex items-center gap-5 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.area}, {listing.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                    <span className="font-semibold text-white">{listing.averageRating.toFixed(1)}</span>
                    <span>({listing.totalReviews} {listing.totalReviews === 1 ? 'review' : 'reviews'})</span>
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 shrink-0 backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 shrink-0 backdrop-blur-sm"
                  onClick={() => {
                    if (!isAuthenticated) { setLocation('/login'); return; }
                    if (listing) saveMutation.mutate({ listingId: listing.id });
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button asChild className="flex-1 md:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold gap-2">
                  <a href={`tel:${listing.phone}`}>
                    <Phone className="w-4 h-4" />
                    Call Now
                  </a>
                </Button>
                {listing.whatsapp && (
                  <Button asChild className="flex-1 md:flex-none bg-[#25D366] text-white hover:bg-[#20bd5a] font-semibold gap-2">
                    <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-lg font-semibold mb-3 tracking-tight">About</h2>
              <p className="text-muted-foreground leading-relaxed">{listing.description}</p>
            </section>

            {listing.features.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 tracking-tight">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map(f => (
                    <span key={f} className="text-sm bg-muted/60 px-3 py-1.5 rounded-md text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {menu && menu.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 tracking-tight">Menu</h2>
                <div className="space-y-6">
                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                      <div className="border border-border rounded-lg divide-y divide-border">
                        {items?.map(item => (
                          <div key={item.id} className="px-4 py-3.5 flex justify-between items-start gap-4">
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                            </div>
                            {item.price && <span className="text-sm font-semibold text-primary shrink-0">GHS {item.price}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reviews && reviews.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 tracking-tight">Reviews</h2>
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{review.userName || 'Guest'}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-secondary text-secondary" />
                          <span className="text-sm font-semibold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <div className="border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Location & Hours</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{listing.address}</p>
                    {listing.landmark && <p className="text-muted-foreground mt-0.5">Near {listing.landmark}</p>}
                    <p className="text-muted-foreground">{listing.area}, {listing.city}</p>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full gap-2 font-medium">
                  <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </Button>
                
                <div className="flex gap-3">
                  <Clock className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="w-full">
                    {Object.entries(listing.openingHours || {}).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between py-1">
                        <span className="capitalize text-muted-foreground">{day}</span>
                        <span className="font-medium">
                          {typeof hours === 'string' ? (hours === 'closed' ? 'Closed' : hours) : (hours?.open ? `${hours.open} - ${hours.close}` : 'Closed')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {(listing.acceptsReservations || listing.acceptsOrders) && (
              <div className="border border-border rounded-lg p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Services</h3>
                <div className="space-y-2">
                  {listing.acceptsReservations && (
                    <Button className="w-full font-semibold gap-2" onClick={() => { if (!isAuthenticated) setLocation('/login'); }}>
                      Book a Table
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {listing.acceptsOrders && (
                    <Button variant="outline" className="w-full font-semibold gap-2" onClick={() => { if (!isAuthenticated) setLocation('/login'); }}>
                      Order Delivery / Pickup
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {listing.cuisineType && listing.cuisineType.length > 0 && (
              <div className="border border-border rounded-lg p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Cuisine</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.cuisineType.map((c: string) => (
                    <span key={c} className="text-sm bg-primary/5 text-primary px-3 py-1 rounded-md capitalize">{c.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
