import { useAuth } from "@/hooks/use-auth";
import { useGetAdminStats, useGetAdminVendors, useApproveVendor, useRejectVendor, useGetSearchAnalytics } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Users, Store, MapPin, CheckCircle, XCircle, Search, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAdminVendorsQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminDashboard() {
  const { isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetAdminStats({ query: { enabled: isAdminAuthenticated } });
  const { data: pendingVendors } = useGetAdminVendors({ status: 'pending' }, { query: { enabled: isAdminAuthenticated } });
  const { data: analytics } = useGetSearchAnalytics({ days: 30 }, { query: { enabled: isAdminAuthenticated } as any });
  
  const approveVendor = useApproveVendor();
  const rejectVendor = useRejectVendor();

  if (!isAdminAuthenticated) return null;

  const handleApprove = (id: string) => {
    approveVendor.mutate({ vendorId: id }, {
      onSuccess: () => {
        toast({ title: "Vendor Approved" });
        queryClient.invalidateQueries({ queryKey: getGetAdminVendorsQueryKey({ status: 'pending' }) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to approve vendor", variant: "destructive" });
      }
    });
  };

  const handleReject = (id: string) => {
    rejectVendor.mutate({ vendorId: id }, {
      onSuccess: () => {
        toast({ title: "Vendor Rejected" });
        queryClient.invalidateQueries({ queryKey: getGetAdminVendorsQueryKey({ status: 'pending' }) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to reject vendor", variant: "destructive" });
      }
    });
  };

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Vendors" value={stats?.totalVendors || 0} icon={<Store className="w-4 h-4" />} color="blue" />
        <StatCard label="Active Listings" value={stats?.totalListings || 0} icon={<MapPin className="w-4 h-4" />} color="emerald" />
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={<Users className="w-4 h-4" />} color="violet" />
        <StatCard label="Pending Approvals" value={stats?.pendingVendors || 0} icon={<XCircle className="w-4 h-4" />} color="amber" highlight />
      </div>

      {analytics && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" /> Search Analytics (30 days)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <MiniStat label="Total Searches" value={analytics.stats.totalSearches} icon={<Search className="w-3.5 h-3.5 text-blue-500" />} />
            <MiniStat label="Unique Queries" value={analytics.stats.uniqueQueries} icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />} />
            <MiniStat label="Unique Searchers" value={analytics.stats.uniqueUsers} icon={<Users className="w-3.5 h-3.5 text-violet-500" />} />
            <MiniStat label="Zero Results" value={analytics.stats.zeroResultSearches} icon={<XCircle className="w-3.5 h-3.5 text-red-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DataList
              title="Top Searches"
              items={analytics.topSearches.slice(0, 8).map((s, i) => ({
                rank: i + 1,
                label: `"${s.query}"`,
                meta: `${s.count} searches · ~${s.avgResults} results`
              }))}
            />
            <DataList
              title="Top Categories"
              items={analytics.topCategories.slice(0, 6).map((c, i) => ({
                rank: i + 1,
                label: (c.category || "").replace(/_/g, " "),
                meta: `${c.count}`,
                capitalize: true
              }))}
            />
            <DataList
              title="Top Cities"
              items={analytics.topCities.slice(0, 6).map((c, i) => ({
                rank: i + 1,
                label: c.city,
                meta: `${c.count}`
              }))}
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">Pending Vendor Applications</h2>
        {pendingVendors?.length ? (
          <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50/80 text-zinc-500 text-xs font-medium uppercase tracking-wider border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Business Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Applied</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pendingVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-900">{vendor.businessName}</td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      <div>{vendor.email}</div>
                      <div className="text-xs">{vendor.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">{format(new Date(vendor.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs" onClick={() => handleReject(vendor.id)}>
                          Reject
                        </Button>
                        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 text-xs" onClick={() => handleApprove(vendor.id)}>
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-zinc-200 p-10 text-center">
            <CheckCircle className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">All caught up</h3>
            <p className="text-xs text-zinc-500">No pending vendor applications.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, icon, color, highlight }: { label: string; value: number; icon: React.ReactNode; color: string; highlight?: boolean }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const borderMap: Record<string, string> = {
    blue: "border-l-blue-500",
    emerald: "border-l-emerald-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
  };

  return (
    <div className={`bg-white rounded-xl border border-zinc-200/80 border-l-4 ${borderMap[color]} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</span>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      </div>
      <h3 className={`text-2xl font-bold ${highlight ? 'text-amber-600' : 'text-zinc-900'}`}>{value}</h3>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-zinc-200/80 p-4">
      <div className="flex items-center gap-2 mb-1.5">{icon}<p className="text-xs font-medium text-zinc-500">{label}</p></div>
      <h3 className="text-lg font-bold text-zinc-900">{value.toLocaleString()}</h3>
    </div>
  );
}

function DataList({ title, items }: { title: string; items: { rank: number; label: string; meta: string; capitalize?: boolean }[] }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="divide-y divide-zinc-50 max-h-56 overflow-y-auto">
        {items.length > 0 ? items.map((item) => (
          <div key={item.rank} className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-zinc-300 font-mono w-4 text-right">{item.rank}</span>
              <span className={`text-sm font-medium text-zinc-800 ${item.capitalize ? 'capitalize' : ''}`}>{item.label}</span>
            </div>
            <span className="text-xs text-zinc-400">{item.meta}</span>
          </div>
        )) : (
          <div className="px-4 py-6 text-center text-xs text-zinc-400">No data yet</div>
        )}
      </div>
    </div>
  );
}
