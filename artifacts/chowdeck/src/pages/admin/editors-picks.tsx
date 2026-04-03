import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

interface EditorsPick {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  listingIds: string[];
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export default function AdminEditorsPicks() {
  const { isAdminAuthenticated, token: adminToken } = useAuth();
  const { toast } = useToast();
  const [picks, setPicks] = useState<EditorsPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", description: "", coverImage: "", listingIds: "", sortOrder: 0, active: true });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` };

  const fetchPicks = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/editors-picks`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.ok) setPicks(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (isAdminAuthenticated) fetchPicks();
  }, [isAdminAuthenticated]);

  const resetForm = () => {
    setForm({ title: "", slug: "", description: "", coverImage: "", listingIds: "", sortOrder: 0, active: true });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const listingIds = form.listingIds.split(",").map(s => s.trim()).filter(Boolean);
    const body = { title: form.title, slug, description: form.description, coverImage: form.coverImage, listingIds, sortOrder: form.sortOrder, active: form.active };

    try {
      const url = editingId ? `${API_BASE}/admin/editors-picks/${editingId}` : `${API_BASE}/admin/editors-picks`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (res.ok) {
        toast({ title: "Success", description: editingId ? "Pick updated" : "Pick created" });
        resetForm();
        fetchPicks();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleEdit = (pick: EditorsPick) => {
    setEditingId(pick.id);
    setShowAdd(true);
    setForm({
      title: pick.title, slug: pick.slug, description: pick.description,
      coverImage: pick.coverImage, listingIds: (pick.listingIds || []).join(", "),
      sortOrder: pick.sortOrder, active: pick.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this editor's pick?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/editors-picks/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        toast({ title: "Deleted" });
        fetchPicks();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleActive = async (pick: EditorsPick) => {
    try {
      await fetch(`${API_BASE}/admin/editors-picks/${pick.id}`, {
        method: "PUT", headers, body: JSON.stringify({ active: !pick.active }),
      });
      fetchPicks();
    } catch {}
  };

  if (!isAdminAuthenticated) return null;

  return (
    <AdminLayout title="Editor's Picks">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">{picks.length} curated collections</p>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Pick
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6 border-primary/30">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{editingId ? "Edit Pick" : "New Pick"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Title</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Best Chop Bars in Accra" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">Slug</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated from title" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="A short description of this collection" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Cover Image URL</label>
              <Input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Listing IDs (comma-separated UUIDs)</label>
              <Input value={form.listingIds} onChange={e => setForm(f => ({ ...f, listingIds: e.target.value }))} placeholder="uuid1, uuid2, uuid3" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} className="w-20" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-primary text-primary-foreground">
                <Check className="w-4 h-4 mr-1" /> {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : picks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No editor's picks yet. Create your first curated collection.</div>
      ) : (
        <div className="space-y-3">
          {picks.map(pick => (
            <Card key={pick.id} className="border-border/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{pick.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${pick.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {pick.active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-muted-foreground">Order: {pick.sortOrder}</span>
                  </div>
                  {pick.description && <p className="text-sm text-muted-foreground mb-1">{pick.description}</p>}
                  <p className="text-xs text-muted-foreground">{(pick.listingIds || []).length} listings · /{pick.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(pick)} title={pick.active ? "Deactivate" : "Activate"}>
                    {pick.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(pick)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(pick.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
