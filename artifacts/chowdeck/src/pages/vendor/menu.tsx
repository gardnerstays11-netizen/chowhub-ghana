import VendorLayout from "@/components/VendorLayout";
import { useGetVendorMenu, useAddVendorMenuItem, useUpdateVendorMenuItem, useDeleteVendorMenuItem, getGetVendorMenuQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, TrendingUp } from "lucide-react";

const CATEGORIES = ["Starters", "Mains", "Soups", "Sides", "Drinks", "Desserts", "Breakfast", "Specials"];

interface MenuForm {
  name: string;
  description: string;
  price: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
}

const emptyForm: MenuForm = { name: "", description: "", price: "", category: "Mains", isAvailable: true, isPopular: false };

export default function VendorMenuPage() {
  const { isVendorAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menu, isLoading } = useGetVendorMenu({ query: { enabled: isVendorAuthenticated } });
  const addMut = useAddVendorMenuItem();
  const updateMut = useUpdateVendorMenuItem();
  const deleteMut = useDeleteVendorMenuItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price?.toString() || "",
      category: item.category || "Mains",
      isAvailable: item.isAvailable ?? true,
      isPopular: item.isPopular ?? false,
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Error", description: "Item name is required", variant: "destructive" }); return; }
    const parsedPrice = form.price ? parseFloat(form.price) : null;
    if (form.price && (isNaN(parsedPrice!) || parsedPrice! < 0)) { toast({ title: "Error", description: "Invalid price", variant: "destructive" }); return; }

    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parsedPrice,
      category: form.category,
      isAvailable: form.isAvailable,
      isPopular: form.isPopular,
    };

    try {
      if (editingId) {
        await updateMut.mutateAsync({ itemId: editingId, data: payload });
        toast({ title: "Updated", description: "Menu item updated" });
      } else {
        await addMut.mutateAsync({ data: payload });
        toast({ title: "Added", description: "Menu item added" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetVendorMenuQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from your menu?`)) return;
    try {
      await deleteMut.mutateAsync({ itemId: id });
      toast({ title: "Deleted", description: "Menu item removed" });
      queryClient.invalidateQueries({ queryKey: getGetVendorMenuQueryKey() });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const grouped = (menu || []).reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const saving = addMut.isPending || updateMut.isPending;

  return (
    <VendorLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Menu Management</h1>
          <p className="text-muted-foreground">{menu?.length || 0} items on your menu</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading menu...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">No menu items yet</h3>
            <p className="text-muted-foreground mb-6">Add items to showcase your menu to customers</p>
            <Button onClick={openAdd} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">{cat}</h2>
              <div className="grid gap-3">
                {items.map((item: any) => (
                  <Card key={item.id} className={`border-border/50 shadow-sm ${!item.isAvailable ? "opacity-60" : ""}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base">{item.name}</h3>
                          {item.isPopular && (
                            <Badge className="bg-secondary/20 text-secondary hover:bg-secondary/20 gap-1">
                              <TrendingUp className="w-3 h-3" /> Popular
                            </Badge>
                          )}
                          {!item.isAvailable && <Badge variant="outline" className="text-destructive border-destructive/30">Unavailable</Badge>}
                        </div>
                        {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{item.price ? `GHS ${item.price.toFixed(2)}` : "—"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id, item.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jollof Rice" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (GHS)</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isAvailable} onCheckedChange={v => setForm(f => ({ ...f, isAvailable: v }))} />
                <Label>Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isPopular} onCheckedChange={v => setForm(f => ({ ...f, isPopular: v }))} />
                <Label>Popular</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
