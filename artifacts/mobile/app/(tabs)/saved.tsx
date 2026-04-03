import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Platform, Image } from "react-native";
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
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "0A" }]}>
          <Feather name="heart" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Save your favorites</Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Log in to save restaurants and access them anytime</Text>
        <Pressable
          onPress={() => router.push("/auth/login")}
          style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={[styles.btnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Log in</Text>
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
            style={({ pressed }) => [
              styles.savedItem,
              {
                backgroundColor: colors.card,
                opacity: pressed ? 0.95 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View style={[styles.savedIcon, { backgroundColor: colors.primary + "0D" }]}>
              <Feather name="heart" size={16} color={colors.primary} />
            </View>
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
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name="heart" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No saved places yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Tap the heart icon on any listing to save it here</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyIconWrap: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 19, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  btn: { paddingHorizontal: 36, paddingVertical: 14, marginTop: 8, borderRadius: 12 },
  btnText: { fontSize: 15 },
  savedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 14,
    gap: 14,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savedIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  savedName: { fontSize: 15, marginBottom: 2, letterSpacing: -0.2 },
  savedMeta: { fontSize: 13 },
});
