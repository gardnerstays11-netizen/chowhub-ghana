import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, Platform, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetFeaturedListings, useGetRecentListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data: featured, isLoading: fl, refetch: rf } = useGetFeaturedListings();
  const { data: recent, isLoading: rl, refetch: rr } = useGetRecentListings({ limit: 10 });
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rf(), rr()]);
    setRefreshing(false);
  }, [rf, rr]);

  const isWeb = Platform.OS === "web";

  const sections: Array<{ key: string; listing?: any }> = [
    { key: "header" },
    { key: "featured_title" },
    ...(featured || []).map((l: any) => ({ key: `f_${l.id}`, listing: l })),
    { key: "recent_title" },
    ...(recent || []).map((l: any) => ({ key: `r_${l.id}`, listing: l })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}
        renderItem={({ item }) => {
          if (item.key === "header") {
            return (
              <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: isWeb ? 67 + 16 : 16 }]}>
                <Text style={[styles.heroTitle, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                  Find great food{"\n"}across Ghana
                </Text>
                <Pressable
                  onPress={() => router.push("/search")}
                  style={[styles.searchBar, { backgroundColor: "#ffffff" }]}
                >
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    Restaurant, cuisine, or dish...
                  </Text>
                </Pressable>
              </View>
            );
          }
          if (item.key === "featured_title") {
            return (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Featured places</Text>
              </View>
            );
          }
          if (item.key === "recent_title") {
            return (
              <View style={[styles.sectionHeader, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Recently added</Text>
              </View>
            );
          }
          if (item.listing) {
            return (
              <View style={styles.cardWrapper}>
                <ListingCard listing={item.listing} />
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          fl || rl ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 28, lineHeight: 34, marginBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8 },
  searchPlaceholder: { fontSize: 14 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 20 },
  cardWrapper: { paddingHorizontal: 20 },
  loading: { paddingTop: 60, alignItems: "center" },
});
