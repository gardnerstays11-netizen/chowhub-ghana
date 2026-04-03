import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetMyReviews } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";

export default function MyReviewsScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const isWeb = Platform.OS === "web";
  const { data, isLoading } = useGetMyReviews({ query: { enabled: isAuthenticated } as any });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 40 }}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.listingName || "Restaurant"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Feather name="star" size={12} color={colors.secondary} />
                <Text style={[{ fontSize: 13, color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.rating}</Text>
              </View>
            </View>
            <Text style={[styles.comment, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={3}>{item.comment}</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : (
            <View style={styles.empty}>
              <Feather name="star" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>No reviews yet</Text>
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
  comment: { fontSize: 13, lineHeight: 20 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
