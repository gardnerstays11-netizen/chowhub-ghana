import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetMyOrders } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MyOrdersScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const isWeb = Platform.OS === "web";
  const { data, isLoading } = useGetMyOrders({ query: { enabled: isAuthenticated, refetchInterval: 15000 } as any });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'confirmed': case 'preparing': case 'ready': return colors.primary;
      case 'cancelled': return '#dc2626';
      default: return colors.mutedForeground;
    }
  };

  const getPaymentBadge = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case 'paid': return { label: 'Paid', color: '#16a34a', bg: '#dcfce7' };
      case 'pending': return { label: 'Payment Pending', color: '#ca8a04', bg: '#fef9c3' };
      default: return { label: 'Pay on Arrival', color: '#6b7280', bg: '#f3f4f6' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 40 }}
        renderItem={({ item }: { item: any }) => {
          const payment = getPaymentBadge(item.paymentStatus);
          return (
            <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold", flex: 1 }]} numberOfLines={1}>{item.listingName || "Order"}</Text>
                <Text style={[styles.status, { color: getStatusColor(item.status), fontFamily: "Inter_600SemiBold" }]}>{item.status}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {item.orderType?.replace('_', ' ')} {item.totalAmount ? `· GHS ${parseFloat(item.totalAmount).toFixed(2)}` : ''}
                </Text>
                <View style={[styles.paymentBadge, { backgroundColor: payment.bg }]}>
                  <Text style={[styles.paymentText, { color: payment.color, fontFamily: "Inter_500Medium" }]}>{payment.label}</Text>
                </View>
              </View>
              {item.items && item.items.length > 0 && (
                <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
                  {item.items.slice(0, 3).map((orderItem: any, idx: number) => (
                    <Text key={idx} style={[styles.orderItem, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {orderItem.quantity}x {orderItem.name}
                    </Text>
                  ))}
                  {item.items.length > 3 && (
                    <Text style={[styles.orderItem, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      +{item.items.length - 3} more items
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
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
  status: { fontSize: 12, textTransform: "capitalize" },
  meta: { fontSize: 13 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  paymentText: { fontSize: 11 },
  itemsList: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  orderItem: { fontSize: 13, marginBottom: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
