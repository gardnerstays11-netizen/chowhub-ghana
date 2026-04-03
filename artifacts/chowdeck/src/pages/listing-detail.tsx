import { MainLayout } from "@/components/layout";
import { useGetListingBySlug, useGetListingMenu, useGetListingReviews, useCreateReservation, useCreateOrder, useSaveListing, useUnsaveListing } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Phone, MessageCircle, Heart, Globe, Instagram, Facebook, Share2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const unsaveMutation = useUnsaveListing();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse flex flex-col gap-8">
            <div className="h-64 md:h-96 bg-muted rounded-3xl w-full"></div>
            <div className="h-12 bg-muted rounded-xl w-1/3"></div>
            <div className="h-8 bg-muted rounded-xl w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 h-64 bg-muted rounded-3xl"></div>
              <div className="h-64 bg-muted rounded-3xl"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!listing) return <MainLayout><div className="text-center py-20">Listing not found</div></MainLayout>;

  return (
    <MainLayout>
      {/* Hero Gallery */}
      <div className="relative h-64 md:h-96 w-full bg-muted overflow-hidden">
        {listing.photos && listing.photos.length > 0 ? (
          <img src={listing.photos[0].url} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/30 font-serif text-4xl font-bold">
            {listing.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="text-white">
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0">{listing.category.replace('_', ' ')}</Badge>
                {listing.isFeatured && <Badge className="bg-secondary text-secondary-foreground border-0">Featured</Badge>}
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-2">{listing.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.area}, {listing.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-secondary text-secondary" />
                  <span className="font-bold text-white">{listing.averageRating.toFixed(1)}</span>
                  <span className="text-white/70">({listing.totalReviews} reviews)</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shrink-0"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shrink-0"
                onClick={() => {
                  if (!isAuthenticated) { setLocation('/login'); return; }
                  if (listing) saveMutation.mutate({ listingId: listing.id });
                }}
              >
                <Heart className="w-5 h-5" />
              </Button>
              <Button asChild className="rounded-full flex-1 md:flex-none bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold gap-2">
                <a href={`tel:${listing.phone}`}>
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
              </Button>
              {listing.whatsapp && (
                <Button asChild className="rounded-full flex-1 md:flex-none bg-[#25D366] text-white hover:bg-[#20bd5a] font-bold gap-2">
                  <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-serif font-bold mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">{listing.description}</p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold mb-4">Features & Dining Style</h2>
              <div className="flex flex-wrap gap-2">
                {listing.features.map(f => (
                  <Badge key={f} variant="outline" className="bg-muted/30 border-border/50 py-1.5 px-3 text-sm">
                    {f}
                  </Badge>
                ))}
              </div>
            </section>

            {menu && menu.length > 0 && (
              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">Menu</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menu.map(item => (
                    <div key={item.id} className="p-4 border border-border/50 rounded-2xl bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg">{item.name}</h4>
                        {item.price && <span className="font-bold text-primary">GHS {item.price}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-xl mb-4">Location & Hours</h3>
              
              <div className="space-y-4">
                <div className="flex gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{listing.address}</p>
                    {listing.landmark && <p className="text-sm">Landmark: {listing.landmark}</p>}
                    <p className="text-sm">{listing.area}, {listing.city}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 text-muted-foreground">
                  <Clock className="w-5 h-5 shrink-0 text-primary" />
                  <div className="w-full">
                    {Object.entries(listing.openingHours || {}).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{day}</span>
                        <span className="font-medium text-foreground">
                          {typeof hours === 'string' ? (hours === 'closed' ? 'Closed' : hours) : (hours?.open ? `${hours.open} - ${hours.close}` : 'Closed')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {(listing.acceptsReservations || listing.acceptsOrders) && (
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                <h3 className="font-serif font-bold text-xl mb-4 text-primary">Services</h3>
                <div className="space-y-3">
                  {listing.acceptsReservations && (
                    <Button className="w-full rounded-full font-bold" onClick={() => !isAuthenticated && setLocation('/login')}>
                      Book a Table
                    </Button>
                  )}
                  {listing.acceptsOrders && (
                    <Button variant="outline" className="w-full rounded-full font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => !isAuthenticated && setLocation('/login')}>
                      Order Delivery/Pickup
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
