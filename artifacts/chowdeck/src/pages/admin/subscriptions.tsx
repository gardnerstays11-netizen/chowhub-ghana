import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Store, MapPin, Users, LogOut, Image, Plus, Pencil, Trash2, Check, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

interface SubPackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  features: string[];
  maxPhotos: number;
  maxMenuItems: number;
  isFeaturedIncluded: boolean;
  prioritySupport: boolean;
  analyticsAccess: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyPackage: Omit<SubPackage, "id"> = {
  name: "", slug: "", description: "", price: 0, billingCycle: "monthly",
  features: [], maxPhotos: 5, maxMenuItems: 20, isFeaturedIncluded: false,
  prioritySupport: false, analyticsAccess: "basic", sortOrder: 0, isActive: true,
};

export default function AdminSubscriptions() {
  const { isAdminAuthenticated, logout, token: adminToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [packages, setPackages] = useState<SubPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Omit<SubPackage, "id">>(emptyPackage);
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/subscription-packages`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) setPackages(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdminAuthenticated) fetchPackages();
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) return null;

  const handleSave = async () => {
    try {
      const url = editingId
        ? `${API_BASE}/admin/subscription-packages/${editingId}`
        : `${API_BASE}/admin/subscription-packages`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: editingId ? "Package updated" : "Package created" });
        setEditingId(null);
        setShowCreate(false);
        setForm(emptyPackage);
        fetchPackages();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error saving package", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription package?")) return;
    try {
      await fetch(`${API_BASE}/admin/subscription-packages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      toast({ title: "Package deleted" });
      fetchPackages();
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  const startEdit = (pkg: SubPackage) => {
    setEditingId(pkg.id);
    setShowCreate(true);
    setForm({
      name: pkg.name, slug: pkg.slug, description: pkg.description,
      price: pkg.price, billingCycle: pkg.billingCycle, features: pkg.features,
      maxPhotos: pkg.maxPhotos, maxMenuItems: pkg.maxMenuItems,
      isFeaturedIncluded: pkg.isFeaturedIncluded, prioritySupport: pkg.prioritySupport,
      analyticsAccess: pkg.analyticsAccess, sortOrder: pkg.sortOrder, isActive: pkg.isActive,
    });
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput("");
    }
  };

  const removeFeature = (idx: number) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-64 bg-zinc-950 text-white shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="font-sans font-bold text-xl tracking-tight">ChowHub Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
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
          <Link href="/admin/subscriptions" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-medium">
            <Package className="w-5 h-5" />
            Subscriptions
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

      <main className="flex-1 min-h-screen">
        <div className="bg-white border-b border-zinc-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Subscription Packages</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage vendor subscription plans and pricing</p>
          </div>
          <Button onClick={() => { setShowCreate(true); setEditingId(null); setForm(emptyPackage); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Package
          </Button>
        </div>

        <div className="p-8">
          {showCreate && (
            <Card className="mb-8 border-2 border-amber-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">{editingId ? "Edit Package" : "New Package"}</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Package Name</label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Growth Plan" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Slug</label>
                    <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. growth" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none h-20"
                    placeholder="Brief description of the plan..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Price (GHS)</label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Billing Cycle</label>
                    <select value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Sort Order</label>
                    <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Max Photos</label>
                    <Input type="number" value={form.maxPhotos} onChange={e => setForm(f => ({ ...f, maxPhotos: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Max Menu Items</label>
                    <Input type="number" value={form.maxMenuItems} onChange={e => setForm(f => ({ ...f, maxMenuItems: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Analytics Access</label>
                    <select value={form.analyticsAccess} onChange={e => setForm(f => ({ ...f, analyticsAccess: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                      <option value="none">None</option>
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="advanced">Advanced</option>
                      <option value="full">Full</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isFeaturedIncluded} onChange={e => setForm(f => ({ ...f, isFeaturedIncluded: e.target.checked }))} className="rounded" />
                    Featured Badge Included
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.prioritySupport} onChange={e => setForm(f => ({ ...f, prioritySupport: e.target.checked }))} className="rounded" />
                    Priority Support
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700">Features</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                      placeholder="Add a feature..."
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-sm rounded-md">
                        {f}
                        <button onClick={() => removeFeature(i)} className="text-zinc-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="gap-2">
                    <Check className="w-4 h-4" />
                    {editingId ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCreate(false); setEditingId(null); setForm(emptyPackage); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">No subscription packages yet</p>
              <p className="text-zinc-400 text-sm mt-1">Create your first subscription plan above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {packages.map(pkg => (
                <Card key={pkg.id} className={`relative ${!pkg.isActive ? "opacity-60" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-zinc-900">{pkg.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {pkg.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(pkg)} className="p-1 text-zinc-400 hover:text-zinc-700">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="p-1 text-zinc-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-zinc-900">GHS {pkg.price.toFixed(2)}</span>
                      <span className="text-sm text-zinc-500">/{pkg.billingCycle}</span>
                    </div>

                    <p className="text-sm text-zinc-600 mb-4">{pkg.description}</p>

                    <div className="space-y-2 mb-4">
                      {(pkg.features as string[]).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                          <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 space-y-1 text-xs text-zinc-500">
                      <div className="flex justify-between">
                        <span>Photos</span>
                        <span className="font-medium">{pkg.maxPhotos >= 100 ? "Unlimited" : pkg.maxPhotos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Menu Items</span>
                        <span className="font-medium">{pkg.maxMenuItems >= 500 ? "Unlimited" : pkg.maxMenuItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Analytics</span>
                        <span className="font-medium capitalize">{pkg.analyticsAccess}</span>
                      </div>
                      {pkg.isFeaturedIncluded && (
                        <div className="flex justify-between">
                          <span>Featured Badge</span>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      )}
                      {pkg.prioritySupport && (
                        <div className="flex justify-between">
                          <span>Priority Support</span>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
