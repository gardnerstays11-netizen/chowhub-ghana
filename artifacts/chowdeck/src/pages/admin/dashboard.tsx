import { useAuth } from "@/hooks/use-auth";
import { useGetAdminStats, useGetAdminVendors, useApproveVendor, useRejectVendor } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Users, Store, MapPin, CheckCircle, XCircle, LogOut } from "lucide-react";
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
