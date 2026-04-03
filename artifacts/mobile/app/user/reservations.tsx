import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetMyReservations } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MyReservationsScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const isWeb = Platform.OS === "web";
  const { data, isLoading } = useGetMyReservations({ query: { enabled: isAuthenticated, refetchInterval: 15000 } as any });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: '#16a34a', bg: '#dcfce7' };
      case 'declined': return { color: '#dc2626', bg: '#fef2f2' };
      default: return { color: '#ca8a04', bg: '#fef9c3' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 40 }}
        renderItem={({ item }: { item: any }) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold", flex: 1 }]} numberOfLines={1}>{item.listingName || "Restaurant"}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color, fontFamily: "Inter_600SemiBold" }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {item.date} at {item.time} &bull; {item.partySize} {item.partySize === 1 ? 'guest' : 'guests'}
              </Text>
              {item.occasion && (
                <Text style={[styles.occasion, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Occasion: {item.occasion}
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
            <View style={styles.empty}>
              <Feather name="calendar" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>No reservations yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: { borderWidth: 1, padding: 16, marginBottom: 10 },
  name: { fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, textTransform: "capitalize" },
  meta: { fontSize: 13 },
  occasion: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
