import { useAuth } from "@/hooks/use-auth";
import { useGetSiteSettings, useUpdateSiteSettings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestUploadUrl, getGetSiteSettingsQueryKey } from "@workspace/api-client-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSettings() {
  const { isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "analytics" | "social" | "onboarding" | "splash">("general");
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated) return;
  }, [isAdminAuthenticated]);

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
    { key: "onboarding" as const, label: "Onboarding", icon: "📱" },
    { key: "splash" as const, label: "Splash & App", icon: "🚀" },
    { key: "analytics" as const, label: "Analytics", icon: "📊" },
    { key: "social" as const, label: "Social & Contact", icon: "🌐" },
  ];

  return (
    <AdminLayout title="Site Settings">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-zinc-500">Manage your site content, branding, SEO, and analytics</p>
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

          {activeTab === "onboarding" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Onboarding Step 1</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Title</label>
                    <Input value={form.onboarding_step1_title || ""} onChange={e => updateField("onboarding_step1_title", e.target.value)} placeholder="Discover Ghana's Best Eats" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Subtitle</label>
                    <textarea className="w-full min-h-[60px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1" value={form.onboarding_step1_subtitle || ""} onChange={e => updateField("onboarding_step1_subtitle", e.target.value)} placeholder="From sizzling street food to fine dining..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Image</label>
                    <div className="flex items-center gap-4">
                      {form.onboarding_step1_image ? (
                        <img src={form.onboarding_step1_image} alt="Step 1" className="h-20 object-cover border rounded-md" />
                      ) : (
                        <div className="h-20 w-28 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center"><span className="text-xs text-zinc-400">No image</span></div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "onboarding_step1_image")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors"><Upload className="w-4 h-4" /> Upload</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Onboarding Step 2</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Title</label>
                    <Input value={form.onboarding_step2_title || ""} onChange={e => updateField("onboarding_step2_title", e.target.value)} placeholder="Find Places Near You" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Subtitle</label>
                    <textarea className="w-full min-h-[60px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1" value={form.onboarding_step2_subtitle || ""} onChange={e => updateField("onboarding_step2_subtitle", e.target.value)} placeholder="Use your location to discover what's cooking nearby..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Image</label>
                    <div className="flex items-center gap-4">
                      {form.onboarding_step2_image ? (
                        <img src={form.onboarding_step2_image} alt="Step 2" className="h-20 object-cover border rounded-md" />
                      ) : (
                        <div className="h-20 w-28 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center"><span className="text-xs text-zinc-400">No image</span></div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "onboarding_step2_image")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors"><Upload className="w-4 h-4" /> Upload</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Onboarding Step 3</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Title</label>
                    <Input value={form.onboarding_step3_title || ""} onChange={e => updateField("onboarding_step3_title", e.target.value)} placeholder="Join the Food Community" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Subtitle</label>
                    <textarea className="w-full min-h-[60px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1" value={form.onboarding_step3_subtitle || ""} onChange={e => updateField("onboarding_step3_subtitle", e.target.value)} placeholder="Save your favourites, leave reviews..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Image</label>
                    <div className="flex items-center gap-4">
                      {form.onboarding_step3_image ? (
                        <img src={form.onboarding_step3_image} alt="Step 3" className="h-20 object-cover border rounded-md" />
                      ) : (
                        <div className="h-20 w-28 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center"><span className="text-xs text-zinc-400">No image</span></div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "onboarding_step3_image")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors"><Upload className="w-4 h-4" /> Upload</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Notification Prompt</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Enable Button Text</label>
                    <Input value={form.onboarding_notif_btn_text || ""} onChange={e => updateField("onboarding_notif_btn_text", e.target.value)} placeholder="Enable Notifications" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Skip Button Text</label>
                    <Input value={form.onboarding_notif_skip_text || ""} onChange={e => updateField("onboarding_notif_skip_text", e.target.value)} placeholder="Maybe Later" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "splash" && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">Splash Screen</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Splash Image</label>
                    <div className="flex items-center gap-4">
                      {form.splash_image_url ? (
                        <img src={form.splash_image_url} alt="Splash" className="h-24 object-contain border rounded-md" />
                      ) : (
                        <div className="h-24 w-24 border-2 border-dashed border-zinc-200 rounded-md flex items-center justify-center"><span className="text-xs text-zinc-400">No image</span></div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "splash_image_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors"><Upload className="w-4 h-4" /> Upload Splash</span>
                      </label>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Recommended: 1284x2778px (PNG). Shown while the app loads.</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">Splash Background Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={form.splash_bg_color || "#f8f6f2"} onChange={e => updateField("splash_bg_color", e.target.value)} className="h-9 w-14 rounded border border-zinc-200 cursor-pointer" />
                      <Input value={form.splash_bg_color || ""} onChange={e => updateField("splash_bg_color", e.target.value)} placeholder="#f8f6f2" className="max-w-[140px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">App Icon</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">App Icon</label>
                    <div className="flex items-center gap-4">
                      {form.app_icon_url ? (
                        <img src={form.app_icon_url} alt="App Icon" className="h-16 w-16 object-contain border rounded-xl" />
                      ) : (
                        <div className="h-16 w-16 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center"><span className="text-xs text-zinc-400">Icon</span></div>
                      )}
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, "app_icon_url")} />
                        <span className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-md text-sm font-medium text-zinc-700 transition-colors"><Upload className="w-4 h-4" /> Upload Icon</span>
                      </label>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">Recommended: 1024x1024px (PNG). Used as the app icon on home screen.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900">App Store Details</h3>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">App Name</label>
                    <Input value={form.app_name || ""} onChange={e => updateField("app_name", e.target.value)} placeholder="ChowHub" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">App Subtitle</label>
                    <Input value={form.app_subtitle || ""} onChange={e => updateField("app_subtitle", e.target.value)} placeholder="Discover Great Food in Ghana" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1 block">App Store Description</label>
                    <textarea className="w-full min-h-[100px] border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1" value={form.app_store_description || ""} onChange={e => updateField("app_store_description", e.target.value)} placeholder="Find the best restaurants, chop bars, and street food across Ghana..." />
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
    </AdminLayout>
  );
}
