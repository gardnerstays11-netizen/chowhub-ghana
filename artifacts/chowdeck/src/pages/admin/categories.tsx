import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, GripVertical, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/AdminLayout";

const API_BASE = (import.meta.env.BASE_URL?.replace(/\/$/, "") || "") + "/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  active: boolean;
}

const ICON_OPTIONS = [
  "utensils", "wine", "coffee", "flame", "shopping-bag",
  "fish", "store", "zap", "pizza", "cake", "beer", "leaf",
];

export default function AdminCategories() {
  const { isAdminAuthenticated, token: adminToken } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("utensils");
  const [sortOrder, setSortOrder] = useState(0);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) setCategories(await res.json());
    } catch {
      toast({ title: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) fetchCategories();
  }, [isAdminAuthenticated]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setIcon("utensils");
    setSortOrder(0);
    setEditingId(null);
    setShowForm(false);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, ""));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Name and slug are required", variant: "destructive" });
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_BASE}/admin/categories/${editingId}`
      : `${API_BASE}/admin/categories`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim(), icon, sortOrder }),
      });

      if (res.ok) {
        toast({ title: editingId ? "Category updated" : "Category created" });
        resetForm();
        fetchCategories();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save category", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        toast({ title: "Category deleted" });
        fetchCategories();
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ active: !cat.active }),
      });
      if (res.ok) fetchCategories();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setSortOrder(cat.sortOrder);
    setShowForm(true);
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-zinc-500">Manage listing categories displayed on the platform</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-2 border-amber-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-lg">{editingId ? "Edit Category" : "New Category"}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Name</label>
                <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Fine Dining" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Slug</label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. fine_dining" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${icon === ic ? "bg-emerald-100 border-emerald-500 text-emerald-800" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Sort Order</label>
                <Input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="gap-2">
                <Check className="w-4 h-4" />
                {editingId ? "Update" : "Create"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-zinc-400 py-8 text-center">Loading...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-400">
            <p className="text-lg font-medium mb-2">No categories yet</p>
            <p className="text-sm">Add your first category to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map(cat => (
            <Card key={cat.id} className={`transition-colors ${!cat.active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{cat.name}</span>
                    <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">{cat.slug}</span>
                    <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded border">{cat.icon}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Sort order: {cat.sortOrder}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(cat)} className="h-8 w-8 p-0">
                    {cat.active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-zinc-400" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(cat)} className="h-8 w-8 p-0">
                    <Pencil className="w-4 h-4 text-zinc-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4 text-red-500" />
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
