import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetSavedPlaces } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SavedScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { data, isLoading } = useGetSavedPlaces({ query: { enabled: isAuthenticated } as any });

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: isWeb ? 67 : 0 }]}>
        <Feather name="heart" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Save your favorites</Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Log in to save restaurants</Text>
        <Pressable
          onPress={() => router.push("/auth/login")}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Log in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 100 }}
        renderItem={({ item }: { item: any }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: item.listing?.slug || "" } })}
            style={[styles.savedItem, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.savedName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.listing?.name || "Unknown"}</Text>
              <Text style={[styles.savedMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{item.listing?.area}, {item.listing?.city}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.center}>
              <Feather name="heart" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>No saved places yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 },
  emptyTitle: { fontSize: 18, marginTop: 4 },
  emptyDesc: { fontSize: 14 },
  btn: { paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  btnText: { fontSize: 15 },
  savedItem: { flexDirection: "row", alignItems: "center", padding: 16, borderWidth: 1, marginBottom: 10 },
  savedName: { fontSize: 15, marginBottom: 2 },
  savedMeta: { fontSize: 13 },
});
