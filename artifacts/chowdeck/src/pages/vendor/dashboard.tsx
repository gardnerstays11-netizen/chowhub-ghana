import { useAuth } from "@/hooks/use-auth";
import { useGetVendorStats, useGetVendorReservations, useGetVendorOrders, useGetVendorListing, useUpdateReservationStatus, useUpdateOrderStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { LogOut, Calendar, ShoppingBag, UtensilsCrossed, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetVendorReservationsQueryKey, getGetVendorOrdersQueryKey } from "@workspace/api-client-react";

export default function VendorDashboard() {
  const { vendor, isVendorAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isVendorAuthenticated) {
      setLocation("/vendor/login");
    }
  }, [isVendorAuthenticated, setLocation]);

  const { data: stats } = useGetVendorStats({ query: { enabled: isVendorAuthenticated } });
  const { data: reservations } = useGetVendorReservations({}, { query: { enabled: isVendorAuthenticated } });
  const { data: orders } = useGetVendorOrders({}, { query: { enabled: isVendorAuthenticated } });
  const { data: listing } = useGetVendorListing({ query: { enabled: isVendorAuthenticated, retry: false } });

  const updateReservation = useUpdateReservationStatus();
  const updateOrder = useUpdateOrderStatus();

  if (!isVendorAuthenticated || !vendor) return null;

  if (vendor.status === 'pending') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-border/50 shadow-lg">
          <div className="w-16 h-16 bg-secondary/20 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-4">Application Pending</h2>
          <p className="text-muted-foreground mb-8">
            Your application for {vendor.businessName} is currently under review by the ChowHub team. We'll notify you once approved.
          </p>
          <Button variant="outline" onClick={logout} className="rounded-full px-8">Logout</Button>
        </Card>
      </div>
    );
  }

  const handleUpdateReservation = (id: string, status: "confirmed" | "declined") => {
    updateReservation.mutate({ reservationId: id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Reservation ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetVendorReservationsQueryKey() });
      }
    });
  };

  const handleUpdateOrder = (id: string, status: "confirmed" | "rejected" | "completed") => {
    updateOrder.mutate({ orderId: id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Order ${status}` });
        queryClient.invalidateQueries({ queryKey: getGetVendorOrdersQueryKey() });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-card border-b border-border/50 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vendor/dashboard" className="font-serif text-xl font-bold text-primary flex items-center gap-2">
              <span className="text-secondary">Chow</span>Hub <span className="text-muted-foreground text-sm font-sans font-normal ml-2">Vendor Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium">{vendor.businessName}</span>
            <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation("/vendor/login"); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!listing && (
          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-secondary-foreground mb-1">Complete your listing profile</h3>
              <p className="text-secondary-foreground/80">Add details, photos, and menus to make your restaurant visible to customers.</p>
            </div>
            <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold shrink-0">
              <Link href="/vendor/onboarding">Start Setup</Link>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Today's Reservations</p>
                  <h3 className="text-3xl font-bold">{stats?.totalReservationsToday || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Today's Orders</p>
                  <h3 className="text-3xl font-bold">{stats?.totalOrdersToday || 0}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Actions</p>
                  <h3 className="text-3xl font-bold">{(stats?.pendingReservations || 0) + (stats?.pendingOrders || 0)}</h3>
                </div>
                <div className="p-3 bg-destructive/10 rounded-xl text-destructive">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Rating</p>
                  <h3 className="text-3xl font-bold">{stats?.averageRating.toFixed(1) || "0.0"}</h3>
                </div>
                <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
                  <Star className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reservations" className="space-y-6">
          <TabsList className="bg-card border border-border/50 h-auto p-1 rounded-xl">
            <TabsTrigger value="reservations" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Reservations
              {stats?.pendingReservations ? <Badge className="ml-2 bg-destructive">{stats.pendingReservations}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Orders
              {stats?.pendingOrders ? <Badge className="ml-2 bg-destructive">{stats.pendingOrders}</Badge> : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-4">
            {reservations?.length ? (
              <div className="grid gap-4">
                {reservations.map(res => (
                  <Card key={res.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg">{res.userName}</h3>
                          <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">
                            {res.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {format(new Date(res.date), "MMM d, yyyy")} at {res.time} • Party of {res.partySize} • Phone: {res.userPhone}
                        </p>
                        {res.specialRequests && <p className="text-sm mt-2 p-3 bg-muted/30 rounded-lg">"{res.specialRequests}"</p>}
                      </div>
                      
                      {res.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleUpdateReservation(res.id, 'declined')}>Decline</Button>
                          <Button className="bg-primary text-primary-foreground" onClick={() => handleUpdateReservation(res.id, 'confirmed')}>Confirm</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No reservations found.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {orders?.length ? (
              <div className="grid gap-4">
                {orders.map(order => (
                  <Card key={order.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-6 flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{order.userName}</h3>
                          <Badge variant="outline" className="capitalize">{order.orderType.replace('_', ' ')}</Badge>
                          <Badge variant={order.status === 'completed' ? 'default' : order.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Phone: {order.userPhone} {order.deliveryAddress && `• Address: ${order.deliveryAddress}`}</p>
                        
                        <div className="bg-muted/30 rounded-xl p-4">
                          <ul className="space-y-2">
                            {order.items.map((item, i) => (
                              <li key={i} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                {item.price && <span className="font-medium">GHS {(item.price * item.quantity).toFixed(2)}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {order.note && <p className="text-sm mt-3 text-muted-foreground">Note: {order.note}</p>}
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0 lg:w-40">
                        {order.status === 'pending' && (
                          <>
                            <Button className="bg-primary w-full" onClick={() => handleUpdateOrder(order.id, 'confirmed')}>Accept Order</Button>
                            <Button variant="outline" className="text-destructive w-full" onClick={() => handleUpdateOrder(order.id, 'rejected')}>Reject</Button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <Button className="bg-secondary text-secondary-foreground w-full" onClick={() => handleUpdateOrder(order.id, 'completed')}>Mark Completed</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Simple fallback for icon
function Clock(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
