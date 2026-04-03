import { useAuth } from "@/hooks/use-auth";
import { useGetSiteSettings, useUpdateSiteSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Store, MapPin, Users, LogOut, Save, Image, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestUploadUrl, getGetSiteSettingsQueryKey } from "@workspace/api-client-react";

export default function AdminSettings() {
  const { isAdminAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "analytics" | "social">("general");
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: settings } = useGetSiteSettings({ query: { enabled: isAdminAuthenticated } as any });
  const updateMut = useUpdateSiteSettings();
  const uploadUrlMut = useRequestUploadUrl();

  useEffect(() => {
    if (settings) {
      setForm(settings as Record<string, string>);
    }
  }, [settings]);

  if (!isAdminAuthenticated) return null;

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    updateMut.mutate({ data: form as any }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      updateField(field, `${base}/api${result.objectPath}`);
      toast({ title: "Image uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const tabs = [
    { key: "general" as const, label: "General", icon: "🏠" },
    { key: "seo" as const, label: "SEO & Meta", icon: "🔍" },
    { key: "analytics" as const, label: "Analytics", icon: "📊" },
    { key: "social" as const, label: "Social & Contact", icon: "🌐" },
  ];

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
          <Link href="/admin/subscriptions" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            Subscriptions
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-white font-medium">
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Site Settings</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage your site content, branding, SEO, and analytics</p>
          </div>
          <Button onClick={handleSave} disabled={!dirty || updateMut.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {updateMut.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="p-8">
          <div className="flex gap-2 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Site Identity</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Site Name</label>
                    <Input value={form.site_name || ""} onChange={e => updateField("site_name", e.target.value)} placeholder="ChowHub Ghana" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Tagline</label>
                    <Input value={form.site_tagline || ""} onChange={e => updateField("site_tagline", e.target.value)} placeholder="Discover Great Food Across Ghana" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Site Description</label>
                    <textarea
                      className="w-full min-h-[80px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
                      value={form.site_description || ""}
                      onChange={e => updateField("site_description", e.target.value)}
                      placeholder="Brief description of your platform..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Branding</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Site Logo</label>
                    <div className="flex items-center gap-4">
                      {form.site_logo_url ? (
                        <img src={form.site_logo_url} alt="Logo" className="h-12 object-contain border rounded-md px-2 py-1" />
                      ) : (
                        <div className="h-12 w-24 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center">
                          <span className="text-xs text-zinc-400">No logo</span>
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "site_logo_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors">
                          <Upload className="w-4 h-4" /> Upload Logo
                        </span>
                      </label>
                      {form.site_logo_url && (
                        <Button variant="ghost" size="sm" onClick={() => updateField("site_logo_url", "")}>Remove</Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Favicon</label>
                    <div className="flex items-center gap-4">
                      {form.site_favicon_url ? (
                        <img src={form.site_favicon_url} alt="Favicon" className="h-8 w-8 object-contain border rounded" />
                      ) : (
                        <div className="h-8 w-8 border-2 border-dashed border-zinc-200 rounded flex items-center justify-center">
                          <span className="text-[8px] text-zinc-400">ICO</span>
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "site_favicon_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors">
                          <Upload className="w-4 h-4" /> Upload Favicon
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1 block">Primary Color</label>
                      <Input value={form.primary_color || ""} onChange={e => updateField("primary_color", e.target.value)} placeholder="hsl(152 45% 22%)" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1 block">Secondary Color</label>
                      <Input value={form.secondary_color || ""} onChange={e => updateField("secondary_color", e.target.value)} placeholder="hsl(38 75% 50%)" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Footer Text</label>
                    <Input value={form.footer_text || ""} onChange={e => updateField("footer_text", e.target.value)} placeholder="© 2025 ChowHub Ghana. All rights reserved." />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Meta Tags</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Meta Title</label>
                    <Input value={form.meta_title || ""} onChange={e => updateField("meta_title", e.target.value)} placeholder="ChowHub Ghana — Food & Dining Discovery" />
                    <p className="text-xs text-zinc-400 mt-1">{(form.meta_title || "").length}/60 characters recommended</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Meta Description</label>
                    <textarea
                      className="w-full min-h-[80px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
                      value={form.meta_description || ""}
                      onChange={e => updateField("meta_description", e.target.value)}
                      placeholder="Discover the best restaurants..."
                    />
                    <p className="text-xs text-zinc-400 mt-1">{(form.meta_description || "").length}/160 characters recommended</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Meta Keywords</label>
                    <Input value={form.meta_keywords || ""} onChange={e => updateField("meta_keywords", e.target.value)} placeholder="Ghana food, restaurants, chop bar..." />
                    <p className="text-xs text-zinc-400 mt-1">Comma-separated keywords</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Open Graph / Social Sharing</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">OG Image</label>
                    <div className="flex items-center gap-4">
                      {form.og_image_url ? (
                        <img src={form.og_image_url} alt="OG" className="h-16 object-contain border rounded-md" />
                      ) : (
                        <div className="h-16 w-28 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center">
                          <span className="text-xs text-zinc-400">No image</span>
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "og_image_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors">
                          <Upload className="w-4 h-4" /> Upload OG Image
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Recommended: 1200x630px</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Custom Head Scripts</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Custom &lt;head&gt; HTML</label>
                    <textarea
                      className="w-full min-h-[120px] border border-zinc-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
                      value={form.custom_head_scripts || ""}
                      onChange={e => updateField("custom_head_scripts", e.target.value)}
                      placeholder={"<!-- Custom scripts, structured data, etc. -->\n<script>...</script>"}
                    />
                    <p className="text-xs text-zinc-400 mt-1">Injected into the &lt;head&gt; of every page. Use for schema markup, custom fonts, etc.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Google Analytics</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Measurement ID</label>
                    <Input value={form.google_analytics_id || ""} onChange={e => updateField("google_analytics_id", e.target.value)} placeholder="G-XXXXXXXXXX" />
                    <p className="text-xs text-zinc-400 mt-1">Enter your Google Analytics 4 Measurement ID (starts with G-)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Google Tag Manager</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Container ID</label>
                    <Input value={form.google_tag_manager_id || ""} onChange={e => updateField("google_tag_manager_id", e.target.value)} placeholder="GTM-XXXXXXX" />
                    <p className="text-xs text-zinc-400 mt-1">Enter your GTM Container ID (starts with GTM-)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Facebook Pixel</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Pixel ID</label>
                    <Input value={form.facebook_pixel_id || ""} onChange={e => updateField("facebook_pixel_id", e.target.value)} placeholder="123456789012345" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Hotjar</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Site ID</label>
                    <Input value={form.hotjar_id || ""} onChange={e => updateField("hotjar_id", e.target.value)} placeholder="1234567" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Contact Information</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Contact Email</label>
                    <Input value={form.contact_email || ""} onChange={e => updateField("contact_email", e.target.value)} placeholder="hello@chowhub.gh" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Contact Phone</label>
                    <Input value={form.contact_phone || ""} onChange={e => updateField("contact_phone", e.target.value)} placeholder="+233 XX XXX XXXX" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Social Media Links</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Twitter / X</label>
                    <Input value={form.social_twitter || ""} onChange={e => updateField("social_twitter", e.target.value)} placeholder="https://twitter.com/chowhubgh" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Instagram</label>
                    <Input value={form.social_instagram || ""} onChange={e => updateField("social_instagram", e.target.value)} placeholder="https://instagram.com/chowhubgh" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Facebook</label>
                    <Input value={form.social_facebook || ""} onChange={e => updateField("social_facebook", e.target.value)} placeholder="https://facebook.com/chowhubgh" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">TikTok</label>
                    <Input value={form.social_tiktok || ""} onChange={e => updateField("social_tiktok", e.target.value)} placeholder="https://tiktok.com/@chowhubgh" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">YouTube</label>
                    <Input value={form.social_youtube || ""} onChange={e => updateField("social_youtube", e.target.value)} placeholder="https://youtube.com/@chowhubgh" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
