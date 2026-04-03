import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetVendorEvents, useGetVendorListing, useCreateVendorEvent, useUpdateVendorEvent, useDeleteVendorEvent } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { useState } from "react";

const EVENT_CATEGORIES = ["music", "food", "special", "general"];

interface EventFormData {
  title: string;
  description: string;
  eventDate: string;
  endDate: string;
  category: string;
  imageUrl: string;
}

const emptyForm: EventFormData = { title: "", description: "", eventDate: "", endDate: "", category: "general", imageUrl: "" };

export default function VendorEventsScreen() {
  const colors = useColors();
  const { isAuthenticated, mode } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const isVendor = isAuthenticated && mode === "vendor";
  const { data: listing } = useGetVendorListing({ query: { enabled: isVendor } as any });
  const { data: events, isLoading, refetch } = useGetVendorEvents({ query: { enabled: isVendor } as any });
  const createMut = useCreateVendorEvent();
  const updateMut = useUpdateVendorEvent();
  const deleteMut = useDeleteVendorEvent();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);

  if (!isAuthenticated || mode !== "vendor") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Please log in as a vendor</Text>
      </View>
    );
  }

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

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
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert("Error", "Event title is required"); return; }
    if (!form.eventDate) { Alert.alert("Error", "Event date is required"); return; }
    if (!listing?.id) { Alert.alert("Error", "No listing found"); return; }

    const parsedStart = new Date(form.eventDate);
    if (isNaN(parsedStart.getTime())) { Alert.alert("Error", "Invalid start date format. Use YYYY-MM-DDTHH:MM"); return; }
    let parsedEnd: Date | null = null;
    if (form.endDate) {
      parsedEnd = new Date(form.endDate);
      if (isNaN(parsedEnd.getTime())) { Alert.alert("Error", "Invalid end date format"); return; }
      if (parsedEnd <= parsedStart) { Alert.alert("Error", "End date must be after start date"); return; }
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
      } else {
        await createMut.mutateAsync({ data: payload });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save event");
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Event", `Remove "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteMut.mutateAsync({ id });
            refetch();
          } catch { Alert.alert("Error", "Failed to delete"); }
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const isPast = (iso: string) => new Date(iso) < new Date();

  const saving = createMut.isPending || updateMut.isPending;

  const catIcon: Record<string, string> = { music: "music", food: "coffee", special: "award", general: "calendar" };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Events</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{events?.length || 0} events</Text>
        </View>
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={[styles.addBtnText, { fontFamily: "Inter_600SemiBold" }]}>New Event</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {editingId ? "Edit Event" : "Create Event"}
          </Text>

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Title</Text>
          <TextInput
            value={form.title}
            onChangeText={t => setForm(f => ({ ...f, title: t }))}
            placeholder="e.g. Live Highlife Music Night"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          />

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Description</Text>
          <TextInput
            value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))}
            placeholder="Tell people what to expect"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.textArea, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Start Date & Time</Text>
              <TextInput
                value={form.eventDate}
                onChangeText={t => setForm(f => ({ ...f, eventDate: t }))}
                placeholder="2026-04-15T19:00"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>End Date & Time</Text>
              <TextInput
                value={form.endDate}
                onChangeText={t => setForm(f => ({ ...f, endDate: t }))}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Category</Text>
          <View style={styles.catRow}>
            {EVENT_CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                onPress={() => setForm(f => ({ ...f, category: cat }))}
                style={[styles.catChip, { backgroundColor: form.category === cat ? colors.primary : colors.muted }]}
              >
                <Feather name={(catIcon[cat] || "calendar") as any} size={12} color={form.category === cat ? "#fff" : colors.foreground} />
                <Text style={[styles.catText, { color: form.category === cat ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Image URL</Text>
          <TextInput
            value={form.imageUrl}
            onChangeText={t => setForm(f => ({ ...f, imageUrl: t }))}
            placeholder="https://..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          />

          <View style={styles.formActions}>
            <Pressable onPress={() => { setShowForm(false); setEditingId(null); }} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || saving ? 0.8 : 1 }]}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>{editingId ? "Update" : "Create Event"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : !events || events.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "0A" }]}>
            <Feather name="calendar" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No events yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Create events to attract more customers</Text>
        </View>
      ) : (
        events.map((e: any) => (
          <View key={e.id} style={[styles.eventCard, { backgroundColor: colors.card, opacity: isPast(e.eventDate) ? 0.6 : 1 }]}>
            <View style={[styles.eventDateBlock, { backgroundColor: isPast(e.eventDate) ? colors.muted : colors.primary }]}>
              <Text style={[styles.eventMonth, { color: isPast(e.eventDate) ? colors.mutedForeground : "rgba(255,255,255,0.7)" }]}>
                {new Date(e.eventDate).toLocaleString("en-US", { month: "short" }).toUpperCase()}
              </Text>
              <Text style={[styles.eventDay, { color: isPast(e.eventDate) ? colors.foreground : "#fff" }]}>
                {new Date(e.eventDate).getDate()}
              </Text>
            </View>
            <View style={styles.eventBody}>
              <View style={styles.eventTitleRow}>
                <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{e.title}</Text>
                {isPast(e.eventDate) && (
                  <View style={[styles.pastBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.pastText, { color: colors.mutedForeground }]}>Past</Text>
                  </View>
                )}
              </View>
              {e.description ? (
                <Text style={[styles.eventDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{e.description}</Text>
              ) : null}
              <View style={styles.eventMeta}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[styles.eventTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {formatDate(e.eventDate)} · {formatTime(e.eventDate)}
                </Text>
              </View>
              <View style={styles.eventActions}>
                <Pressable onPress={() => openEdit(e)} style={({ pressed }) => [styles.eventActionBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 }]}>
                  <Feather name="edit-2" size={13} color={colors.primary} />
                  <Text style={[styles.eventActionText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(e.id, e.title)} style={({ pressed }) => [styles.eventActionBtn, { backgroundColor: "#fef2f2", opacity: pressed ? 0.7 : 1 }]}>
                  <Feather name="trash-2" size={13} color="#c93434" />
                  <Text style={[styles.eventActionText, { color: "#c93434", fontFamily: "Inter_500Medium" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  heading: { fontSize: 22, letterSpacing: -0.3 },
  subheading: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontSize: 13, color: "#fff" },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: { fontSize: 17, marginBottom: 12, letterSpacing: -0.2 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 14 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  catText: { fontSize: 12 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancelText: { fontSize: 14 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveBtnText: { fontSize: 14, color: "#fff" },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18 },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  eventCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventDateBlock: { width: 60, alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  eventMonth: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  eventDay: { fontSize: 24, fontWeight: "800", marginTop: -2 },
  eventBody: { flex: 1, padding: 14, gap: 4 },
  eventTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventTitle: { fontSize: 15, flex: 1, letterSpacing: -0.2 },
  pastBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  pastText: { fontSize: 9, fontWeight: "600" },
  eventDesc: { fontSize: 12, lineHeight: 18 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  eventTime: { fontSize: 11 },
  eventActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  eventActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  eventActionText: { fontSize: 11 },
});
