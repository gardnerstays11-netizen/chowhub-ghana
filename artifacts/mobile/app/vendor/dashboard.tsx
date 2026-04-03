import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetVendorListing, useGetVendorMenu, useGetVendorReservations, useGetVendorOrders, useGetVendorStats } from "@workspace/api-client-react";
import { useRouter } from "expo-router";

const screenWidth = Dimensions.get("window").width;

function MiniChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const width = screenWidth - 80;
  const barWidth = Math.max(2, (width / data.length) - 2);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 1 }}>
      {data.map((val, i) => (
        <View
          key={i}
          style={{
            width: barWidth,
            height: Math.max(2, (val / max) * height),
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.7 + (i / data.length) * 0.3,
          }}
        />
      ))}
    </View>
  );
}

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
  const { data: stats } = useGetVendorStats({ query: { enabled: isVendor } as any });

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

  const s = stats as any;
  const dailyViewData = s?.dailyViews?.map((d: any) => d.views) || [];
  const dailyOrderData = s?.dailyOrders?.map((d: any) => d.count) || [];

  const StatCard = ({ icon, label, value, iconColor, subtitle }: { icon: string; label: string; value: string | number; iconColor?: string; subtitle?: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.statIconWrap, { backgroundColor: (iconColor || colors.primary) + "12" }]}>
        <Feather name={icon as any} size={18} color={iconColor || colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      {subtitle && <Text style={[styles.statSublabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: isWeb ? 34 : 40 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Dashboard</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{vendor?.businessName}</Text>
        </View>
        {listing && (
          <View style={[styles.statusBadge, { backgroundColor: listing.status === "active" ? "#dcfce7" : "#fef3c7", borderRadius: colors.radius }]}>
            <View style={[styles.statusDot, { backgroundColor: listing.status === "active" ? "#22c55e" : "#f59e0b" }]} />
            <Text style={[styles.statusText, { color: listing.status === "active" ? "#166534" : "#92400e", fontFamily: "Inter_500Medium" }]}>
              {listing.status || "Active"}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard icon="eye" label="Total Views" value={s?.profileViews || 0} iconColor="#6366f1" subtitle={`${s?.uniqueProfileViews || 0} unique`} />
            <StatCard icon="shopping-bag" label="Total Orders" value={s?.totalOrders || 0} iconColor="#f59e0b" subtitle={`${s?.totalOrdersToday || 0} today`} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="calendar" label="Reservations" value={s?.totalReservations || 0} iconColor="#10b981" subtitle={`${s?.pendingReservations || 0} pending`} />
            <StatCard icon="star" label="Rating" value={listing?.averageRating?.toFixed(1) || "—"} iconColor="#f59e0b" subtitle={`${s?.totalReviews || 0} reviews`} />
          </View>

          <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.analyticsTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Performance Overview</Text>
            <Text style={[styles.analyticsPeriod, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Last 30 days</Text>

            <View style={styles.performRow}>
              <View style={styles.performItem}>
                <Feather name="trending-up" size={14} color="#6366f1" />
                <Text style={[styles.performLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Views this week</Text>
                <Text style={[styles.performValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s?.viewsThisWeek || 0}</Text>
              </View>
              <View style={styles.performItem}>
                <Feather name="activity" size={14} color="#10b981" />
                <Text style={[styles.performLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Views this month</Text>
                <Text style={[styles.performValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s?.viewsThisMonth || 0}</Text>
              </View>
            </View>

            <View style={styles.performRow}>
              <View style={styles.performItem}>
                <Feather name="package" size={14} color="#f59e0b" />
                <Text style={[styles.performLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Orders this week</Text>
                <Text style={[styles.performValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s?.ordersThisWeek || 0}</Text>
              </View>
              <View style={styles.performItem}>
                <Feather name="shopping-bag" size={14} color="#e74c3c" />
                <Text style={[styles.performLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Orders this month</Text>
                <Text style={[styles.performValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{s?.ordersThisMonth || 0}</Text>
              </View>
            </View>
          </View>

          {dailyViewData.length > 2 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Profile Views</Text>
              <Text style={[styles.chartSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Daily views trend</Text>
              <MiniChart data={dailyViewData} color="#6366f1" height={50} />
            </View>
          )}

          {dailyOrderData.length > 2 && (
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Orders</Text>
              <Text style={[styles.chartSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Daily orders trend</Text>
              <MiniChart data={dailyOrderData} color="#f59e0b" height={50} />
            </View>
          )}

          {listing && (
            <View style={[styles.listingInfo, { borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.listingName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{listing.name}</Text>
              <Text style={[styles.listingMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.area}, {listing.city}</Text>
            </View>
          )}

          <View style={styles.quickActions}>
            <Pressable
              onPress={() => router.push("/vendor/menu")}
              style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.qaIcon, { backgroundColor: colors.primary + "12" }]}>
                <Feather name="book-open" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.qaLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Manage Menu</Text>
              <Text style={[styles.qaCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{menu?.length || 0} items</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/vendor/events")}
              style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.qaIcon, { backgroundColor: "#7c3aed12" }]}>
                <Feather name="calendar" size={18} color="#7c3aed" />
              </View>
              <Text style={[styles.qaLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Manage Events</Text>
              <Text style={[styles.qaCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Create & edit</Text>
            </Pressable>
          </View>

          <View style={[styles.menuSection, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.menuHead}>
              <Text style={[styles.menuTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Menu Items</Text>
              <Pressable onPress={() => router.push("/vendor/menu")} hitSlop={8}>
                <Text style={[styles.menuCount, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>View all →</Text>
              </Pressable>
            </View>
            {menu && menu.length > 0 ? menu.slice(0, 5).map((item: any) => (
              <View key={item.id} style={[styles.menuRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.menuItemName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                <Text style={[styles.menuItemPrice, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>{item.price ? `GHS ${item.price}` : "—"}</Text>
              </View>
            )) : (
              <Pressable onPress={() => router.push("/vendor/menu")} style={styles.addMenuPrompt}>
                <Feather name="plus-circle" size={16} color={colors.primary} />
                <Text style={[styles.addMenuText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Add your first menu item</Text>
              </Pressable>
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  heading: { fontSize: 22, marginBottom: 2 },
  subheading: { fontSize: 14 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  statSublabel: { fontSize: 10, marginTop: -2 },
  analyticsCard: { borderWidth: 1, padding: 16, marginBottom: 12 },
  analyticsTitle: { fontSize: 16, marginBottom: 2 },
  analyticsPeriod: { fontSize: 12, marginBottom: 16 },
  performRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  performItem: { flex: 1, flexDirection: "column", gap: 4 },
  performLabel: { fontSize: 11 },
  performValue: { fontSize: 18 },
  chartCard: { borderWidth: 1, padding: 16, marginBottom: 12 },
  chartTitle: { fontSize: 14, marginBottom: 2 },
  chartSubtitle: { fontSize: 11, marginBottom: 12 },
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
  quickActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  quickAction: { flex: 1, borderWidth: 1, padding: 16, alignItems: "center", gap: 8 },
  qaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  qaLabel: { fontSize: 13 },
  qaCount: { fontSize: 11 },
  addMenuPrompt: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  addMenuText: { fontSize: 13 },
  emptyMenu: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 13 },
  emptyText: { fontSize: 15 },
  btn: { paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  btnText: { fontSize: 15 },
});
