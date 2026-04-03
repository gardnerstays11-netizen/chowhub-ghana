import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAdminStats, useGetAdminVendors, useGetAdminListings, useApproveVendor, useRejectVendor } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

export default function AdminDashboard() {
  const colors = useColors();
  const { isAuthenticated, mode } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isWeb = Platform.OS === "web";

  const isAdmin = isAuthenticated && mode === "admin";
  const { data: stats, isLoading } = useGetAdminStats({ query: { enabled: isAdmin } as any });
  const { data: vendors } = useGetAdminVendors(undefined, { query: { enabled: isAdmin } as any });
  const { data: listings } = useGetAdminListings(undefined, { query: { enabled: isAdmin } as any });

  const approveMut = useApproveVendor();
  const rejectMut = useRejectVendor();

  if (!isAuthenticated || mode !== "admin") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shield" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Admin access required</Text>
        <Pressable onPress={() => router.push("/admin/login")} style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={[styles.actionBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Admin Login</Text>
        </Pressable>
      </View>
    );
  }

  const handleApprove = (vendorId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    approveMut.mutate(
      { vendorId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] }) }
    );
  };

  const handleReject = (vendorId: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rejectMut.mutate(
      { vendorId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] }) }
    );
  };

  const StatCard = ({ icon, label, value }: { icon: string; label: string; value: string | number }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Feather name={icon as any} size={20} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: isWeb ? 34 : 40 }}>
      <Text style={[styles.heading, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Admin Dashboard</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : stats ? (
        <>
          <View style={styles.statsRow}>
            <StatCard icon="users" label="Users" value={stats.totalUsers || 0} />
            <StatCard icon="briefcase" label="Vendors" value={stats.totalVendors || 0} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="map-pin" label="Listings" value={stats.totalListings || 0} />
            <StatCard icon="message-square" label="Reviews" value={stats.totalReviews || 0} />
          </View>
        </>
      ) : null}

      {vendors && vendors.length > 0 && (
        <View style={[styles.section, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Vendors</Text>
          {vendors.map((v: any) => (
            <View key={v.id} style={[styles.vendorRow, { borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vendorName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{v.businessName}</Text>
                <Text style={[styles.vendorMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{v.email} · {v.status}</Text>
              </View>
              {v.status === "pending" && (
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable onPress={() => handleApprove(v.id)} style={[styles.smallBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={14} color={colors.primaryForeground} />
                  </Pressable>
                  <Pressable onPress={() => handleReject(v.id)} style={[styles.smallBtn, { backgroundColor: colors.destructive }]}>
                    <Feather name="x" size={14} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {listings && (listings as any).listings && (listings as any).listings.length > 0 && (
        <View style={[styles.section, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Listings</Text>
          {(listings as any).listings.slice(0, 10).map((l: any) => (
            <View key={l.id} style={[styles.vendorRow, { borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vendorName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{l.name}</Text>
                <Text style={[styles.vendorMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{l.city} · {l.status || "active"}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  heading: { fontSize: 22, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 16, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 12 },
  section: { borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  sectionTitle: { fontSize: 16, padding: 16 },
  vendorRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  vendorName: { fontSize: 14, marginBottom: 2 },
  vendorMeta: { fontSize: 12 },
  smallBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15 },
  actionBtn: { paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  actionBtnText: { fontSize: 15 },
});
