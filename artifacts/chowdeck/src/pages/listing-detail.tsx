import { MainLayout } from "@/components/layout";
import { useGetListingBySlug, useGetListingMenu, useGetListingReviews, useCreateReservation, useCreateOrder, useSaveListing, useUnsaveListing, useInitializePayment } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Clock, Phone, MessageCircle, Heart, Share2, Navigation, ChevronRight, Plus, Minus, ShoppingBag, X, CreditCard, Loader2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/use-page-meta";

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ListingDetail() {
  const { slug } = useParams();
  const { isAuthenticated, user, token } = useAuth();
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
  const createOrder = useCreateOrder();
  const createReservation = useCreateReservation();
  const initPayment = useInitializePayment();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'paystack'>('whatsapp');
  const [isOrdering, setIsOrdering] = useState(false);

  const [showReservation, setShowReservation] = useState(false);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resPartySize, setResPartySize] = useState(2);
  const [resOccasion, setResOccasion] = useState('');

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = useCallback((item: { id: string; name: string; price?: string | null }) => {
    if (!item.price) return;
    const price = parseFloat(item.price);
    if (isNaN(price)) return;
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.menuItemId === menuItemId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : c;
        }
        return c;
      }).filter(c => !(c.menuItemId === menuItemId && c.quantity + delta <= 0));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  }, []);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user) {
      setLocation('/login');
      return;
    }
    if (cart.length === 0) return;
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      toast({ title: "Delivery address required", variant: "destructive" });
      return;
    }

    setIsOrdering(true);
    try {
      const orderData = {
        listingId: listing!.id,
        items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        note: orderNote || undefined,
        totalAmount: cartTotal,
      };

      const order = await createOrder.mutateAsync({ data: orderData } as any);

      if (paymentMethod === 'paystack') {
        const baseUrl = window.location.origin;
        const payRes = await initPayment.mutateAsync({
          data: {
            amount: cartTotal,
            email: user.email,
            paymentType: 'order',
            orderId: order.id,
            callbackUrl: `${baseUrl}/payment/verify`,
          }
        } as any);

        if ((payRes as any).authorization_url) {
          window.location.href = (payRes as any).authorization_url;
          return;
        }
      } else {
        const whatsappNumber = listing?.whatsapp?.replace(/[^0-9]/g, '') || '';
        const itemList = cart.map(c => `${c.quantity}x ${c.name} (GHS ${(c.price * c.quantity).toFixed(2)})`).join('\n');
        const msg = encodeURIComponent(
          `Hi! I'd like to place a ${orderType} order:\n\n${itemList}\n\nTotal: GHS ${cartTotal.toFixed(2)}\n${orderType === 'delivery' ? `Delivery to: ${deliveryAddress}\n` : ''}${orderNote ? `Note: ${orderNote}\n` : ''}\nOrder ID: ${order.id}`
        );
        if (whatsappNumber) {
          window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
        }
      }

      toast({ title: "Order placed!", description: `Your ${orderType} order has been submitted.` });
      setCart([]);
      setShowCart(false);
      setOrderNote('');
      setDeliveryAddress('');
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Failed to place order", variant: "destructive" });
    } finally {
      setIsOrdering(false);
    }
  };

  const handleReservation = async () => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }
    if (!resDate || !resTime) {
      toast({ title: "Date and time required", variant: "destructive" });
      return;
    }

    createReservation.mutate({
      data: {
        listingId: listing!.id,
        date: resDate,
        time: resTime,
        partySize: resPartySize,
        occasion: resOccasion || undefined,
      }
    } as any, {
      onSuccess: () => {
        toast({ title: "Reservation confirmed!", description: `Table for ${resPartySize} on ${resDate} at ${resTime}.` });
        setShowReservation(false);
        setResDate('');
        setResTime('');
        setResOccasion('');
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.response?.data?.error || "Failed to make reservation", variant: "destructive" });
      }
    });
  };

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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold tracking-tight">Menu</h2>
                  {listing.acceptsOrders && cartCount > 0 && (
                    <Button onClick={() => setShowCart(true)} className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      <ShoppingBag className="w-4 h-4" />
                      Cart ({cartCount}) — GHS {cartTotal.toFixed(2)}
                    </Button>
                  )}
                </div>
                <div className="space-y-6">
                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
                      <div className="border border-border rounded-lg divide-y divide-border">
                        {items?.map(item => {
                          const inCart = cart.find(c => c.menuItemId === item.id);
                          return (
                            <div key={item.id} className="px-4 py-3.5 flex justify-between items-center gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {item.price && <span className="text-sm font-semibold text-primary">GHS {item.price}</span>}
                                {listing.acceptsOrders && item.price && (
                                  inCart ? (
                                    <div className="flex items-center gap-1.5 bg-muted rounded-lg">
                                      <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-l-lg hover:bg-muted-foreground/10"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-sm font-semibold w-5 text-center">{inCart.quantity}</span>
                                      <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-r-lg hover:bg-muted-foreground/10"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg border border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
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

            {listing.acceptsReservations && (
              <div className="border border-border rounded-lg p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Book a Table</h3>
                {showReservation ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Date</label>
                      <Input type="date" value={resDate} onChange={e => setResDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Time</label>
                      <Input type="time" value={resTime} onChange={e => setResTime(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Party Size</label>
                      <div className="flex items-center gap-3 mt-1">
                        <button onClick={() => setResPartySize(Math.max(1, resPartySize - 1))} className="w-8 h-8 rounded-lg border flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        <span className="font-semibold text-lg w-6 text-center">{resPartySize}</span>
                        <button onClick={() => setResPartySize(resPartySize + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Occasion (optional)</label>
                      <Input value={resOccasion} onChange={e => setResOccasion(e.target.value)} placeholder="Birthday, Anniversary..." className="mt-1" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleReservation} className="flex-1 font-semibold" disabled={createReservation.isPending}>
                        {createReservation.isPending ? "Booking..." : "Confirm Booking"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowReservation(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button className="w-full font-semibold gap-2" onClick={() => {
                    if (!isAuthenticated) { setLocation('/login'); return; }
                    setShowReservation(true);
                  }}>
                    Book a Table
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {listing.acceptsOrders && (
              <div className="border border-border rounded-lg p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order</h3>
                <p className="text-sm text-muted-foreground mb-4">Browse the menu and add items to your cart to place an order.</p>
                {cartCount > 0 ? (
                  <Button className="w-full font-semibold gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => setShowCart(true)}>
                    <ShoppingBag className="w-4 h-4" />
                    View Cart ({cartCount}) — GHS {cartTotal.toFixed(2)}
                  </Button>
                ) : (
                  <p className="text-sm text-center text-muted-foreground/60 py-2">
                    Add items from the menu to get started
                  </p>
                )}
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

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowCart(false)}>
          <div className="bg-card w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">GHS {item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted rounded-lg">
                        <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-7 h-7 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-7 h-7 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <span className="text-sm font-semibold w-16 text-right">GHS {(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.menuItemId)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>GHS {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Order Type</label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setOrderType('delivery')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${orderType === 'delivery' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => setOrderType('pickup')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${orderType === 'pickup' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Delivery Address</label>
                  <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Enter your delivery address" className="mt-1.5" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Note (optional)</label>
                <Input value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Special instructions..." className="mt-1.5" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 ${paymentMethod === 'whatsapp' ? 'bg-[#25D366] text-white border-[#25D366]' : 'border-border hover:bg-muted'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paystack')}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium border flex items-center justify-center gap-2 ${paymentMethod === 'paystack' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Online
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-12 font-semibold text-base gap-2"
                onClick={handlePlaceOrder}
                disabled={isOrdering || cart.length === 0}
              >
                {isOrdering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === 'paystack' ? (
                  `Pay GHS ${cartTotal.toFixed(2)}`
                ) : (
                  `Place Order — GHS ${cartTotal.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
