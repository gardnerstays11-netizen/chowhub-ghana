import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetVendorListing, useGetVendorMenu, useGetVendorReservations, useGetVendorOrders } from "@workspace/api-client-react";
import { useRouter } from "expo-router";

export default function VendorDashboard() {
  const colors = useColors();
  const { vendor, isAuthenticated, mode } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const isVendor = isAuthenticated && mode === "vendor";
  const { data: listing, isLoading } = useGetVendorListing({ query: { enabled: isVendor } as any });
  const { data: menu } = useGetVendorMenu({ query: { enabled: isVendor } as any });
  const { data: reservations } = useGetVendorReservations(undefined, { query: { enabled: isVendor } as any });
  const { data: orders } = useGetVendorOrders(undefined, { query: { enabled: isVendor } as any });

  if (!isAuthenticated || mode !== "vendor") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Please log in as a vendor</Text>
        <Pressable onPress={() => router.push("/vendor/login")} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Vendor Login</Text>
        </Pressable>
      </View>
    );
  }

  const StatCard = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Feather name={icon as any} size={20} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: isWeb ? 34 : 40 }}>
      <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Dashboard</Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{vendor?.businessName}</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard icon="list" label="Menu Items" value={menu?.length || 0} />
            <StatCard icon="calendar" label="Reservations" value={reservations?.length || 0} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="shopping-bag" label="Orders" value={orders?.length || 0} />
            <StatCard icon="star" label="Rating" value={listing?.averageRating?.toFixed(1) || "—"} />
          </View>

          {listing && (
            <View style={[styles.listingInfo, { borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.listingName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{listing.name}</Text>
              <Text style={[styles.listingMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.area}, {listing.city} · {listing.status || "Active"}</Text>
            </View>
          )}

          <View style={[styles.menuSection, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.menuHead}>
              <Text style={[styles.menuTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Menu Items</Text>
              <Text style={[styles.menuCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{menu?.length || 0} items</Text>
            </View>
            {menu && menu.length > 0 ? menu.slice(0, 5).map((item: any) => (
              <View key={item.id} style={[styles.menuRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.menuItemName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                <Text style={[styles.menuItemPrice, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{item.price ? `GHS ${item.price}` : "—"}</Text>
              </View>
            )) : (
              <Text style={[styles.emptyMenu, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>No menu items yet</Text>
            )}
          </View>

          {reservations && reservations.length > 0 && (
            <View style={[styles.menuSection, { borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.menuTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", padding: 16 }]}>Recent Reservations</Text>
              {reservations.slice(0, 5).map((r: any) => (
                <View key={r.id} style={[styles.menuRow, { borderTopColor: colors.border }]}>
                  <View>
                    <Text style={[styles.menuItemName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{r.customerName || "Guest"}</Text>
                    <Text style={[{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.date} · {r.partySize} guests</Text>
                  </View>
                  <Text style={[{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium", textTransform: "capitalize" }]}>{r.status}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  heading: { fontSize: 22, marginBottom: 2 },
  subheading: { fontSize: 14, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 16, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  listingInfo: { borderWidth: 1, padding: 16, marginBottom: 16 },
  listingName: { fontSize: 16, marginBottom: 4 },
  listingMeta: { fontSize: 13 },
  menuSection: { borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  menuHead: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  menuTitle: { fontSize: 16 },
  menuCount: { fontSize: 13 },
  menuRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  menuItemName: { fontSize: 14 },
  menuItemPrice: { fontSize: 14 },
  emptyMenu: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 13 },
  emptyText: { fontSize: 15 },
  btn: { paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  btnText: { fontSize: 15 },
});
