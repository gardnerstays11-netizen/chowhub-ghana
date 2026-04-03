import { useAuth } from "@/hooks/use-auth";
import { useGetAdminPartners, useCreatePartner, useUpdatePartner, useDeletePartner, useRequestUploadUrl } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Store, MapPin, Users, LogOut, Trash2, Pencil, Plus, Upload, Image, ExternalLink, GripVertical, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPartners() {
  const { isAdminAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: partners } = useGetAdminPartners({ query: { enabled: isAdminAuthenticated } as any });
  const createMut = useCreatePartner();
  const updateMut = useUpdatePartner();
  const deleteMut = useDeletePartner();
  const uploadUrlMut = useRequestUploadUrl();

  if (!isAdminAuthenticated) return null;

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setWebsite("");
    setSortOrder(0);
    setLogoUrl("");
  };

  const handleEdit = (partner: any) => {
    setEditingId(partner.id);
    setName(partner.name);
    setWebsite(partner.website || "");
    setSortOrder(partner.sortOrder);
    setLogoUrl(partner.logoUrl);
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadUrlMut.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });

      await fetch(result.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      setLogoUrl(`${base}/api${result.objectPath}`);
      toast({ title: "Logo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!name || !logoUrl) {
      toast({ title: "Name and logo are required", variant: "destructive" });
      return;
    }

    if (editingId) {
      await updateMut.mutateAsync({
        partnerId: editingId,
        data: { name, logoUrl, website: website || null, sortOrder },
      });
      toast({ title: "Partner updated" });
    } else {
      await createMut.mutateAsync({
        data: { name, logoUrl, website: website || null, sortOrder },
      });
      toast({ title: "Partner added" });
    }

    queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this partner?")) return;
    await deleteMut.mutateAsync({ partnerId: id });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
    toast({ title: "Partner removed" });
  };

  const handleToggleActive = async (partner: any) => {
    await updateMut.mutateAsync({
      partnerId: partner.id,
      data: { active: !partner.active },
    });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
    toast({ title: partner.active ? "Partner hidden" : "Partner visible" });
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
          <Link href="/admin/partners" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-medium">
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

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Partner Logos</h1>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-2" /> Add Partner
          </Button>
        </header>

        <div className="p-8">
          {showForm && (
            <Card className="mb-8 border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 bg-white">
                <h3 className="text-lg font-bold text-zinc-900 mb-4">{editingId ? "Edit Partner" : "Add New Partner"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-600 mb-1 block">Partner Name *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ghana Tourism Authority" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 mb-1 block">Website</label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-600 mb-1 block">Sort Order</label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-zinc-600 mb-2 block">Logo *</label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="w-24 h-24 border border-zinc-200 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2">
                        <img src={logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center">
                        <Image className="w-8 h-8 text-zinc-300" />
                      </div>
                    )}
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-zinc-400 mt-1">PNG, JPG or SVG. Recommended: 200x200px</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSubmit} disabled={!name || !logoUrl || createMut.isPending || updateMut.isPending} className="bg-zinc-900 text-white hover:bg-zinc-800">
                    {editingId ? "Update Partner" : "Add Partner"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {partners && partners.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 w-20">Logo</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Website</th>
                    <th className="px-6 py-4 w-20 text-center">Order</th>
                    <th className="px-6 py-4 w-20 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {partners.map((partner: any) => (
                    <tr key={partner.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 border border-zinc-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                          <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900">{partner.name}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        {partner.website ? (
                          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-900 transition-colors">
                            {new URL(partner.website).hostname} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-center text-zinc-500">{partner.sortOrder}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${partner.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {partner.active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-900" onClick={() => handleToggleActive(partner)}>
                            {partner.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-900" onClick={() => handleEdit(partner)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(partner.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !showForm ? (
            <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-16 text-center">
              <Image className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 mb-2">No partners yet</h3>
              <p className="text-zinc-500 mb-6">Add partner logos that will be displayed in the "Meet Our Partners" section on the homepage.</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-zinc-900 text-white hover:bg-zinc-800">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Partner
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
