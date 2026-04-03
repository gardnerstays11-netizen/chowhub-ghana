import VendorLayout from "@/components/VendorLayout";
import { useGetVendorPhotos, useDeleteVendorPhoto, useAddVendorPhoto, getGetVendorPhotosQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Image, Star } from "lucide-react";

export default function VendorPhotosPage() {
  const { isVendorAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useGetVendorPhotos({ query: { enabled: isVendorAuthenticated } });
  const addMut = useAddVendorPhoto();
  const deleteMut = useDeleteVendorPhoto();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isCover, setIsCover] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) { toast({ title: "Error", description: "Photo URL is required", variant: "destructive" }); return; }
    try {
      await addMut.mutateAsync({ data: { url: url.trim(), isCover, displayOrder: (photos?.length || 0) } });
      toast({ title: "Added", description: "Photo added" });
      setDialogOpen(false);
      setUrl("");
      setIsCover(false);
      queryClient.invalidateQueries({ queryKey: getGetVendorPhotosQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to add photo", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await deleteMut.mutateAsync({ photoId: id });
      toast({ title: "Deleted", description: "Photo removed" });
      queryClient.invalidateQueries({ queryKey: getGetVendorPhotosQueryKey() });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <VendorLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Photo Gallery</h1>
          <p className="text-muted-foreground">{photos?.length || 0} photos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Photo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading photos...</div>
      ) : !photos || photos.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">No photos yet</h3>
            <p className="text-muted-foreground mb-6">Add photos to showcase your restaurant and attract customers</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo: any) => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50">
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              {photo.isCover && (
                <div className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                  <Star className="w-3 h-3" /> Cover
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Photo URL</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            {url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                <img src={url} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isCover" checked={isCover} onChange={e => setIsCover(e.target.checked)} className="rounded" />
              <Label htmlFor="isCover">Set as cover photo</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleAdd} disabled={addMut.isPending}>
                {addMut.isPending ? "Adding..." : "Add Photo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );
}
