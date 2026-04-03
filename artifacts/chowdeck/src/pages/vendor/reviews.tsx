import VendorLayout from "@/components/VendorLayout";
import { useGetVendorReviews, useGetVendorStats } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Star, MessageSquare } from "lucide-react";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-secondary text-secondary" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function SubRating({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 fill-secondary text-secondary" />
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export default function VendorReviewsPage() {
  const { isVendorAuthenticated } = useAuth();
  const { data: reviews, isLoading } = useGetVendorReviews({ query: { enabled: isVendorAuthenticated } });
  const { data: stats } = useGetVendorStats({ query: { enabled: isVendorAuthenticated } });

  return (
    <VendorLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Customer Reviews</h1>
          <p className="text-muted-foreground">{reviews?.length || 0} reviews</p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-xl">
            <Star className="w-5 h-5 fill-secondary text-secondary" />
            <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">/ 5</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading reviews...</div>
      ) : !reviews || reviews.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">Reviews from your customers will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((r: any) => (
            <Card key={r.id} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(r.userName || "G")[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold">{r.userName || "Guest"}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={r.rating} />
                    <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20">{r.rating}/5</Badge>
                  </div>
                </div>

                {r.comment && <p className="text-foreground mb-4">{r.comment}</p>}

                {(r.foodRating || r.serviceRating || r.ambienceRating || r.valueRating) && (
                  <div className="flex flex-wrap gap-4 pt-3 border-t border-border/50">
                    <SubRating label="Food" value={r.foodRating} />
                    <SubRating label="Service" value={r.serviceRating} />
                    <SubRating label="Ambience" value={r.ambienceRating} />
                    <SubRating label="Value" value={r.valueRating} />
                  </div>
                )}

                {r.visitedFor && (
                  <div className="mt-3">
                    <Badge variant="outline" className="capitalize">{r.visitedFor.replace(/_/g, " ")}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </VendorLayout>
  );
}
