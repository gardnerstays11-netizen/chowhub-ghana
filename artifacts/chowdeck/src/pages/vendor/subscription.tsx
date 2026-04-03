import VendorLayout from "@/components/VendorLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Crown, Check, Loader2, Zap, Shield, BarChart3 } from "lucide-react";

interface SubscriptionPackage {
  id: string;
  name: string;
  slug: string;
  price: string;
  billingCycle: string;
  maxPhotos: number;
  maxMenuItems: number;
  isFeaturedIncluded: boolean;
  prioritySupport: boolean;
  analyticsAccess: string;
}

export default function VendorSubscription() {
  const { vendor, isVendorAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/subscription-packages", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPackages(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubscribe = async (pkg: SubscriptionPackage) => {
    if (!vendor || !token) return;
    setSubscribing(pkg.slug);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch("/api/payments/initialize-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendorId: vendor.id,
          packageSlug: pkg.slug,
          amount: parseFloat(pkg.price),
          email: vendor.email,
          callbackUrl: `${baseUrl}/payment/verify`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start subscription", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const analyticsLabel: Record<string, string> = {
    basic: "Basic Stats",
    standard: "Standard Analytics",
    advanced: "Advanced Analytics",
    full: "Full Analytics Suite",
  };

  if (!isVendorAuthenticated) return null;

  return (
    <VendorLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--app-font-display)' }}>Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Upgrade your plan to unlock more features and grow your business.</p>
        </div>

        {vendor && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="font-semibold text-lg capitalize flex items-center gap-2">
                {vendor.plan === 'free' ? 'Free' : vendor.plan}
                {vendor.plan !== 'free' && <Crown className="w-4 h-4 text-secondary" />}
              </p>
            </div>
            {vendor.planExpiresAt && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="font-medium text-sm">{new Date(vendor.planExpiresAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-muted-foreground">No subscription plans available at this time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => {
              const isCurrent = vendor?.plan === pkg.slug;
              const isFree = parseFloat(pkg.price) === 0;

              return (
                <Card key={pkg.id} className={`border-border/50 relative overflow-hidden ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  {isCurrent && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg">Current</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold">
                          {isFree ? 'Free' : `GHS ${parseFloat(pkg.price).toFixed(0)}`}
                        </span>
                        {!isFree && <span className="text-muted-foreground text-sm">/{pkg.billingCycle}</span>}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span>Up to {pkg.maxPhotos} photos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span>Up to {pkg.maxMenuItems} menu items</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {pkg.isFeaturedIncluded ? (
                          <>
                            <Zap className="w-4 h-4 text-secondary shrink-0" />
                            <span className="font-medium">Featured listing included</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">No featured placement</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {pkg.prioritySupport ? (
                          <>
                            <Shield className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium">Priority support</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Standard support</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                        <span>{analyticsLabel[pkg.analyticsAccess] || pkg.analyticsAccess}</span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : isFree ? (
                      <Button variant="outline" className="w-full" disabled>
                        Free Tier
                      </Button>
                    ) : (
                      <Button
                        className="w-full font-semibold"
                        onClick={() => handleSubscribe(pkg)}
                        disabled={subscribing === pkg.slug}
                      >
                        {subscribing === pkg.slug ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          `Upgrade to ${pkg.name}`
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
