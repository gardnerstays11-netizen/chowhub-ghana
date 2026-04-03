import VendorLayout from "@/components/VendorLayout";
import { useGetVendorStats } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Users, ShoppingBag, Calendar, TrendingUp, BarChart3 } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniBarChart({ data, valueKey, labelKey, color }: { data: any[]; valueKey: string; labelKey: string; color: string }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>;
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-14).map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
              {d[labelKey]}: {val}
            </div>
            <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max(pct, 4)}%` }} />
          </div>
        );
      })}
    </div>
  );
}

export default function VendorAnalyticsPage() {
  const { isVendorAuthenticated } = useAuth();
  const { data: stats, isLoading } = useGetVendorStats({ query: { enabled: isVendorAuthenticated } });

  if (isLoading) return <VendorLayout><div className="text-center py-20 text-muted-foreground">Loading analytics...</div></VendorLayout>;

  return (
    <VendorLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your restaurant's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Eye} label="Total Views" value={stats?.profileViews || 0} sub={`${stats?.uniqueProfileViews || 0} unique visitors`} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={TrendingUp} label="Views This Week" value={stats?.viewsThisWeek || 0} sub={`${stats?.viewsThisMonth || 0} this month`} color="bg-green-500/10 text-green-500" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.totalOrders || 0} sub={`${stats?.ordersThisWeek || 0} this week`} color="bg-primary/10 text-primary" />
        <StatCard icon={Calendar} label="Total Reservations" value={stats?.totalReservations || 0} sub={`${stats?.totalReservationsToday || 0} today`} color="bg-secondary/20 text-secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" /> Daily Views (Last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats?.dailyViews || []} valueKey="views" labelKey="date" color="bg-blue-500" />
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" /> Daily Orders (Last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={stats?.dailyOrders || []} valueKey="count" labelKey="date" color="bg-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
            <p className="text-3xl font-bold">{stats?.averageRating?.toFixed(1) || "0.0"}</p>
            <p className="text-xs text-muted-foreground">{stats?.totalReviews || 0} reviews</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Orders This Month</p>
            <p className="text-3xl font-bold">{stats?.ordersThisMonth || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.pendingOrders || 0} pending</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Unique Visitors</p>
            <p className="text-3xl font-bold">{stats?.uniqueProfileViews || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.profileViews || 0} total views</p>
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  );
}
