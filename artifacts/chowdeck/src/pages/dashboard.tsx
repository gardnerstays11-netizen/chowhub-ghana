import { MainLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetMyReservations, useGetMyOrders, useGetSavedPlaces, useGetMyReviews, useUpdateUserProfile } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ListingCard } from "@/components/listing-card";
import { Star, Camera, Loader2, CreditCard, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  unpaid: "bg-gray-100 text-gray-600 border-gray-200",
};

const orderStatusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  confirmed: "default",
  preparing: "secondary",
  ready: "secondary",
  pending: "outline",
  cancelled: "destructive",
};

export default function Dashboard() {
  const { user, isAuthenticated, token, updateUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: reservations } = useGetMyReservations({ query: { enabled: isAuthenticated } });
  const { data: orders, refetch: refetchOrders } = useGetMyOrders({ query: { enabled: isAuthenticated, refetchInterval: 15000 } });
  const { data: savedPlaces } = useGetSavedPlaces({ query: { enabled: isAuthenticated } });
  const { data: reviews } = useGetMyReviews({ query: { enabled: isAuthenticated } });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const res = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      const avatarUrl = `/api/storage/objects/${objectPath.replace(/^\/objects\//, "")}`;

      const updateRes = await fetch("/api/auth/me/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!updateRes.ok) throw new Error("Failed to save avatar");

      updateUser({ avatarUrl });
    } catch {
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Manage your dining experiences in {user.city}.</p>
        </div>

        <Tabs defaultValue="reservations" className="space-y-8">
          <TabsList className="bg-card border border-border/50 h-auto p-1 overflow-x-auto flex w-full justify-start rounded-xl">
            <TabsTrigger value="reservations" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">My Reservations</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">My Orders</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Saved Places</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">My Reviews</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg px-6 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-4 outline-none">
            {reservations?.length ? (
              <div className="grid gap-4">
                {reservations.map(res => (
                  <Card key={res.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg">{res.listingName}</h3>
                        <p className="text-muted-foreground">
                          {format(new Date(res.date), "MMM d, yyyy")} at {res.time} &bull; Party of {res.partySize}
                        </p>
                        {res.occasion && <p className="text-sm text-muted-foreground mt-1">Occasion: {res.occasion}</p>}
                      </div>
                      <Badge variant={res.status === 'confirmed' ? 'default' : res.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">
                        {res.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No reservations yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 outline-none">
            {orders?.length ? (
              <div className="grid gap-4">
                {orders.map((order: any) => (
                  <Card key={order.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{order.listingName}</h3>
                          <p className="text-muted-foreground">
                            {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")} &bull; {order.orderType.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={orderStatusColors[order.status] || 'secondary'} className="capitalize">
                            {order.status}
                          </Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${paymentStatusColors[order.paymentStatus || 'unpaid']}`}>
                            {order.paymentStatus === 'paid' ? (
                              <><CreditCard className="w-3 h-3" /> Paid</>
                            ) : order.paymentStatus === 'pending' ? (
                              <><Clock className="w-3 h-3" /> Payment Pending</>
                            ) : (
                              'Pay on Arrival'
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <ul className="space-y-2">
                          {order.items.map((item: any, i: number) => (
                            <li key={i} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              {item.price && <span className="font-medium">GHS {(item.price * item.quantity).toFixed(2)}</span>}
                            </li>
                          ))}
                        </ul>
                        {order.totalAmount && (
                          <div className="border-t mt-3 pt-3 flex justify-between text-sm font-semibold">
                            <span>Total</span>
                            <span>GHS {parseFloat(order.totalAmount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      {order.paymentChannel && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Paid via {order.paymentChannel}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No orders yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="outline-none">
            {savedPlaces?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPlaces.map(saved => saved.listing && (
                  <ListingCard key={saved.id} listing={saved.listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No saved places yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 outline-none">
            {reviews?.reviews?.length ? (
              <div className="grid gap-4">
                {reviews.reviews.map(review => (
                  <Card key={review.id} className="border-border/50 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{review.listingName}</h3>
                          <p className="text-sm text-muted-foreground">{format(new Date(review.createdAt), "MMM d, yyyy")} &bull; Visited for {review.visitedFor}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-md">
                          <Star className="w-4 h-4 fill-secondary text-secondary" />
                          <span className="font-bold text-secondary-foreground">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-muted-foreground">No reviews written yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="outline-none">
            <Card className="max-w-xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group shrink-0"
                    disabled={uploading}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div>
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="grid gap-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p className="text-lg font-medium">{user.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
