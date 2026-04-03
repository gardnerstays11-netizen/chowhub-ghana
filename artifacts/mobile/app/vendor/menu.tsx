import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform, Alert, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetVendorMenu, useAddVendorMenuItem, useUpdateVendorMenuItem, useDeleteVendorMenuItem } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { useState } from "react";

const MENU_CATEGORIES = ["Starters", "Main Course", "Soups", "Sides", "Drinks", "Desserts", "Specials"];

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
}

const emptyForm: MenuFormData = { name: "", description: "", price: "", category: "Main Course", isAvailable: true, isPopular: false };

export default function VendorMenuScreen() {
  const colors = useColors();
  const { isAuthenticated, mode } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const { data: menu, isLoading, refetch } = useGetVendorMenu({ query: { enabled: isAuthenticated && mode === "vendor" } as any });
  const addMut = useAddVendorMenuItem();
  const updateMut = useUpdateVendorMenuItem();
  const deleteMut = useDeleteVendorMenuItem();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(emptyForm);

  if (!isAuthenticated || mode !== "vendor") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Please log in as a vendor</Text>
      </View>
    );
  }

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price?.toString() || "",
      category: item.category || "Main Course",
      isAvailable: item.isAvailable ?? true,
      isPopular: item.isPopular ?? false,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert("Error", "Item name is required"); return; }

    const parsedPrice = form.price ? parseFloat(form.price) : null;
    if (form.price && (isNaN(parsedPrice!) || parsedPrice! < 0)) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

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
      } else {
        await addMut.mutateAsync({ data: payload });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      refetch();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save");
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete Item", `Remove "${name}" from menu?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteMut.mutateAsync({ itemId: id });
            refetch();
          } catch { Alert.alert("Error", "Failed to delete"); }
        },
      },
    ]);
  };

  const grouped = (menu || []).reduce((acc: any, item: any) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const saving = addMut.isPending || updateMut.isPending;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Menu</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{menu?.length || 0} items</Text>
        </View>
        <Pressable
          onPress={openAddForm}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={[styles.addBtnText, { fontFamily: "Inter_600SemiBold" }]}>Add Item</Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {editingId ? "Edit Item" : "New Menu Item"}
          </Text>

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Name</Text>
          <TextInput
            value={form.name}
            onChangeText={t => setForm(f => ({ ...f, name: t }))}
            placeholder="e.g. Jollof Rice"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          />

          <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Description</Text>
          <TextInput
            value={form.description}
            onChangeText={t => setForm(f => ({ ...f, description: t }))}
            placeholder="Brief description"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.textArea, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            multiline
            numberOfLines={3}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Price (GHS)</Text>
              <TextInput
                value={form.price}
                onChangeText={t => setForm(f => ({ ...f, price: t }))}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {MENU_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => setForm(f => ({ ...f, category: cat }))}
                    style={[styles.catChip, {
                      backgroundColor: form.category === cat ? colors.primary : colors.muted,
                    }]}
                  >
                    <Text style={[styles.catChipText, {
                      color: form.category === cat ? "#fff" : colors.foreground,
                      fontFamily: "Inter_500Medium",
                    }]}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchItem}>
              <Text style={[styles.switchLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Available</Text>
              <Switch
                value={form.isAvailable}
                onValueChange={v => setForm(f => ({ ...f, isAvailable: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View style={styles.switchItem}>
              <Text style={[styles.switchLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Popular</Text>
              <Switch
                value={form.isPopular}
                onValueChange={v => setForm(f => ({ ...f, isPopular: v }))}
                trackColor={{ true: "#d4941a" }}
              />
            </View>
          </View>

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
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>{editingId ? "Update" : "Add Item"}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : Object.keys(grouped).length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "0A" }]}>
            <Feather name="book-open" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No menu items yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Add items to show your menu to customers</Text>
        </View>
      ) : (
        Object.entries(grouped).map(([cat, items]: [string, any]) => (
          <View key={cat} style={[styles.categorySection, { backgroundColor: colors.card }]}>
            <Text style={[styles.catHeader, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{cat}</Text>
            {items.map((item: any, idx: number) => (
              <View key={item.id} style={[styles.menuItem, idx < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.itemTitleRow}>
                    <Text style={[styles.itemName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.name}</Text>
                    {item.isPopular && (
                      <View style={[styles.popularBadge, { backgroundColor: "#fef9ee" }]}>
                        <Feather name="trending-up" size={9} color="#d4941a" />
                        <Text style={styles.popularText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={[styles.itemDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                      {item.price ? `GHS ${item.price.toFixed(2)}` : "—"}
                    </Text>
                    {!item.isAvailable && (
                      <View style={[styles.unavailBadge, { backgroundColor: "#fef2f2" }]}>
                        <Text style={styles.unavailText}>Unavailable</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Pressable onPress={() => openEditForm(item)} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.7 : 1 }]}>
                    <Feather name="edit-2" size={14} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id, item.name)} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { backgroundColor: "#fef2f2", opacity: pressed ? 0.7 : 1 }]}>
                    <Feather name="trash-2" size={14} color="#c93434" />
                  </Pressable>
                </View>
              </View>
            ))}
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
  formTitle: { fontSize: 17, marginBottom: 16, letterSpacing: -0.2 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 14 },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6, marginTop: 4 },
  catChipText: { fontSize: 12 },
  switchRow: { flexDirection: "row", gap: 24, marginTop: 16 },
  switchItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  switchLabel: { fontSize: 13 },
  formActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancelText: { fontSize: 14 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveBtnText: { fontSize: 14, color: "#fff" },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18 },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  categorySection: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  catHeader: { fontSize: 14, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, letterSpacing: 0.3, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName: { fontSize: 15, letterSpacing: -0.2 },
  popularBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  popularText: { fontSize: 9, color: "#92680e", fontWeight: "600" },
  itemDesc: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  itemMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  itemPrice: { fontSize: 15 },
  unavailBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  unavailText: { fontSize: 9, color: "#c93434", fontWeight: "600" },
  itemActions: { flexDirection: "column", gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
