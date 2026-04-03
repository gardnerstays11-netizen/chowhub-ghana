import { useAuth } from "@/hooks/use-auth";
import { useGetAdminStats, useGetAdminVendors, useApproveVendor, useRejectVendor, useGetSearchAnalytics } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Users, Store, MapPin, CheckCircle, XCircle, LogOut, Search, TrendingUp, BarChart3, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAdminVendorsQueryKey } from "@workspace/api-client-react";

export default function AdminDashboard() {
  const { isAdminAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

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
      }
    });
  };

  const handleReject = (id: string) => {
    rejectVendor.mutate({ vendorId: id }, {
      onSuccess: () => {
        toast({ title: "Vendor Rejected" });
        queryClient.invalidateQueries({ queryKey: getGetAdminVendorsQueryKey({ status: 'pending' }) });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-zinc-950 text-white shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="font-sans font-bold text-xl tracking-tight">ChowHub Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Overview
          </Link>
          <Link href="/admin/partners" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <Image className="w-5 h-5" />
            Partners
          </Link>
          <Link href="/admin/vendors" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <Store className="w-5 h-5" />
            Vendors
          </Link>
          <Link href="/admin/listings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <MapPin className="w-5 h-5" />
            Listings
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <Users className="w-5 h-5" />
            Users
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Site Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => { logout(); setLocation("/admin/login"); }}>
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-zinc-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard Overview</h1>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-white">
                <p className="text-sm font-medium text-zinc-500 mb-2">Total Vendors</p>
                <h3 className="text-3xl font-bold text-zinc-900">{stats?.totalVendors || 0}</h3>
              </CardContent>
              <div className="h-1 bg-blue-500 w-full"></div>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-white">
                <p className="text-sm font-medium text-zinc-500 mb-2">Active Listings</p>
                <h3 className="text-3xl font-bold text-zinc-900">{stats?.totalListings || 0}</h3>
              </CardContent>
              <div className="h-1 bg-emerald-500 w-full"></div>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-white">
                <p className="text-sm font-medium text-zinc-500 mb-2">Total Users</p>
                <h3 className="text-3xl font-bold text-zinc-900">{stats?.totalUsers || 0}</h3>
              </CardContent>
              <div className="h-1 bg-purple-500 w-full"></div>
            </Card>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-zinc-900 text-white">
                <p className="text-sm font-medium text-zinc-400 mb-2">Pending Approvals</p>
                <h3 className="text-3xl font-bold">{stats?.pendingVendors || 0}</h3>
              </CardContent>
              <div className="h-1 bg-amber-500 w-full"></div>
            </Card>
          </div>

          {analytics && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Search Analytics (30 days)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-5 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-medium text-zinc-500">Total Searches</p>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">{analytics.stats.totalSearches.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-5 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-medium text-zinc-500">Unique Queries</p>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">{analytics.stats.uniqueQueries.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-5 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-4 h-4 text-purple-500" />
                      <p className="text-sm font-medium text-zinc-500">Unique Searchers</p>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">{analytics.stats.uniqueUsers.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-xl">
                  <CardContent className="p-5 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm font-medium text-zinc-500">Zero Results</p>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900">{analytics.stats.zeroResultSearches.toLocaleString()}</h3>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100">
                    <h3 className="font-semibold text-zinc-900">Top Searches</h3>
                  </div>
                  <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                    {analytics.topSearches.slice(0, 10).map((s, i) => (
                      <div key={i} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-mono w-5">{i + 1}</span>
                          <span className="text-sm font-medium text-zinc-900">"{s.query}"</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>{s.count} searches</span>
                          <span>~{s.avgResults} results</span>
                        </div>
                      </div>
                    ))}
                    {analytics.topSearches.length === 0 && (
                      <div className="px-6 py-8 text-center text-sm text-zinc-400">No search data yet</div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100">
                      <h3 className="font-semibold text-zinc-900">Top Categories</h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {analytics.topCategories.slice(0, 5).map((c, i) => (
                        <div key={i} className="px-6 py-3 flex items-center justify-between">
                          <span className="text-sm capitalize text-zinc-700">{(c.category || "").replace(/_/g, " ")}</span>
                          <span className="text-xs text-zinc-500">{c.count}</span>
                        </div>
                      ))}
                      {analytics.topCategories.length === 0 && (
                        <div className="px-6 py-4 text-center text-sm text-zinc-400">No data</div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100">
                      <h3 className="font-semibold text-zinc-900">Top Cities</h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {analytics.topCities.slice(0, 5).map((c, i) => (
                        <div key={i} className="px-6 py-3 flex items-center justify-between">
                          <span className="text-sm text-zinc-700">{c.city}</span>
                          <span className="text-xs text-zinc-500">{c.count}</span>
                        </div>
                      ))}
                      {analytics.topCities.length === 0 && (
                        <div className="px-6 py-4 text-center text-sm text-zinc-400">No data</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Pending Vendor Applications</h2>
            {pendingVendors?.length ? (
              <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4">Business Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Applied Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pendingVendors.map(vendor => (
                      <tr key={vendor.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-900">{vendor.businessName}</td>
                        <td className="px-6 py-4 text-zinc-500">
                          <div>{vendor.email}</div>
                          <div>{vendor.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">{format(new Date(vendor.createdAt), "MMM d, yyyy")}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={() => handleReject(vendor.id)}>
                              Reject
                            </Button>
                            <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => handleApprove(vendor.id)}>
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
              <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 mb-1">All caught up</h3>
                <p className="text-zinc-500">There are no pending vendor applications to review.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
