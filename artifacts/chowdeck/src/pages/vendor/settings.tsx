import VendorLayout from "@/components/VendorLayout";
import { useAuth } from "@/hooks/use-auth";
import { useGetVendorListing, useUpdateVendorListing } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetVendorListingQueryKey } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Calendar, ShoppingBag, AlertCircle } from "lucide-react";

export default function VendorSettings() {
  const { isVendorAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useGetVendorListing({ query: { enabled: isVendorAuthenticated, retry: false } });
  const updateListing = useUpdateVendorListing();

  const [acceptsReservations, setAcceptsReservations] = useState(false);
  const [acceptsOrders, setAcceptsOrders] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (listing) {
      setAcceptsReservations(listing.acceptsReservations ?? false);
      setAcceptsOrders(listing.acceptsOrders ?? false);
    }
  }, [listing]);

  const handleToggle = (field: 'reservations' | 'orders') => {
    if (field === 'reservations') {
      setAcceptsReservations(prev => !prev);
    } else {
      setAcceptsOrders(prev => !prev);
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    updateListing.mutate({
      data: { acceptsReservations, acceptsOrders }
    }, {
      onSuccess: () => {
        toast({ title: "Settings updated" });
        queryClient.invalidateQueries({ queryKey: getGetVendorListingQueryKey() });
        setHasChanges(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
      }
    });
  };

  if (!isVendorAuthenticated) return null;

  return (
    <VendorLayout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--app-font-display)' }}>Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your listing preferences and service options.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-24 bg-muted animate-pulse rounded-lg"></div>
          </div>
        ) : !listing ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No listing found</h3>
              <p className="text-sm text-muted-foreground">Complete your listing setup first to manage settings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Accept Table Reservations</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow customers to pre-book tables at your restaurant</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('reservations')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${acceptsReservations ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${acceptsReservations ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {acceptsReservations && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                      Customers will see a "Book a Table" button on your listing page. You can manage incoming reservations from your Dashboard.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Accept Orders</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow customers to place delivery or pickup orders</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('orders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${acceptsOrders ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${acceptsOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {acceptsOrders && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                      Customers will see an "Order Delivery / Pickup" button on your listing. Incoming orders appear in your Dashboard.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasChanges && (
              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={updateListing.isPending} className="font-semibold px-8">
                  {updateListing.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
