import VendorLayout from "@/components/VendorLayout";
import { useGetVendorEvents, useCreateVendorEvent, useUpdateVendorEvent, useDeleteVendorEvent, useGetVendorListing, getGetVendorEventsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, Clock, Music, Coffee, Award } from "lucide-react";
import { format } from "date-fns";

const EVENT_CATEGORIES = [
  { value: "music", label: "Music", icon: Music },
  { value: "food", label: "Food", icon: Coffee },
  { value: "special", label: "Special", icon: Award },
  { value: "general", label: "General", icon: Calendar },
];

interface EventForm {
  title: string;
  description: string;
  eventDate: string;
  endDate: string;
  category: string;
  imageUrl: string;
}

const emptyForm: EventForm = { title: "", description: "", eventDate: "", endDate: "", category: "general", imageUrl: "" };

export default function VendorEventsPage() {
  const { isVendorAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listing } = useGetVendorListing({ query: { enabled: isVendorAuthenticated, retry: false } });
  const { data: events, isLoading } = useGetVendorEvents({ query: { enabled: isVendorAuthenticated } });
  const createMut = useCreateVendorEvent();
  const updateMut = useUpdateVendorEvent();
  const deleteMut = useDeleteVendorEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (e: any) => {
    setForm({
      title: e.title,
      description: e.description || "",
      eventDate: e.eventDate?.slice(0, 16) || "",
      endDate: e.endDate?.slice(0, 16) || "",
      category: e.category || "general",
      imageUrl: e.imageUrl || "",
    });
    setEditingId(e.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Error", description: "Title is required", variant: "destructive" }); return; }
    if (!form.eventDate) { toast({ title: "Error", description: "Start date is required", variant: "destructive" }); return; }
    if (!listing?.id) { toast({ title: "Error", description: "No listing found. Create a listing first.", variant: "destructive" }); return; }

    const parsedStart = new Date(form.eventDate);
    if (isNaN(parsedStart.getTime())) { toast({ title: "Error", description: "Invalid start date", variant: "destructive" }); return; }
    let parsedEnd: Date | null = null;
    if (form.endDate) {
      parsedEnd = new Date(form.endDate);
      if (isNaN(parsedEnd.getTime())) { toast({ title: "Error", description: "Invalid end date", variant: "destructive" }); return; }
      if (parsedEnd <= parsedStart) { toast({ title: "Error", description: "End date must be after start date", variant: "destructive" }); return; }
    }

    const payload: any = {
      listingId: listing.id,
      title: form.title.trim(),
      description: form.description.trim(),
      eventDate: parsedStart.toISOString(),
      endDate: parsedEnd ? parsedEnd.toISOString() : null,
      category: form.category,
      imageUrl: form.imageUrl.trim() || null,
    };

    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Updated", description: "Event updated" });
      } else {
        await createMut.mutateAsync({ data: payload });
        toast({ title: "Created", description: "Event created" });
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getGetVendorEventsQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    try {
      await deleteMut.mutateAsync({ id });
      toast({ title: "Deleted", description: "Event removed" });
      queryClient.invalidateQueries({ queryKey: getGetVendorEventsQueryKey() });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const isPast = (d: string) => new Date(d) < new Date();
  const saving = createMut.isPending || updateMut.isPending;
  const catIcon: Record<string, any> = { music: Music, food: Coffee, special: Award, general: Calendar };

  return (
    <VendorLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Event Management</h1>
          <p className="text-muted-foreground">{events?.length || 0} events</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading events...</div>
      ) : !events || events.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-6">Create events to attract more customers and build excitement</p>
            <Button onClick={openAdd} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((e: any) => {
            const past = isPast(e.eventDate);
            const CatIcon = catIcon[e.category] || Calendar;
            return (
              <Card key={e.id} className={`border-border/50 shadow-sm ${past ? "opacity-50" : ""}`}>
                <CardContent className="p-0 flex">
                  <div className={`w-20 flex flex-col items-center justify-center py-4 shrink-0 ${past ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${past ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {format(new Date(e.eventDate), "MMM")}
                    </span>
                    <span className="text-2xl font-bold">{format(new Date(e.eventDate), "d")}</span>
                  </div>
                  <div className="flex-1 p-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base">{e.title}</h3>
                        <Badge variant="outline" className="gap-1 capitalize">
                          <CatIcon className="w-3 h-3" /> {e.category}
                        </Badge>
                        {past && <Badge variant="secondary">Past</Badge>}
                      </div>
                      {e.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{e.description}</p>}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(e.eventDate), "MMM d, yyyy 'at' h:mm a")}
                        {e.endDate && ` — ${format(new Date(e.endDate), "h:mm a")}`}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(e)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => handleDelete(e.id, e.title)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Live Highlife Music Night" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell people what to expect" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
              </div>
              <div>
                <Label>End Date & Time (optional)</Label>
                <Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <div className="flex gap-2 mt-1">
                {EVENT_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${form.category === cat.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  >
                    <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
