import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetMyOrders } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MyOrdersScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const isWeb = Platform.OS === "web";
  const { data, isLoading } = useGetMyOrders({ query: { enabled: isAuthenticated } as any });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 40 }}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.listingName || "Order"}</Text>
              <Text style={[styles.status, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>{item.status}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.type} · GHS {item.totalAmount}</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
            <View style={styles.empty}>
              <Feather name="shopping-bag" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>No orders yet</Text>
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
  status: { fontSize: 13, textTransform: "capitalize" },
  meta: { fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
