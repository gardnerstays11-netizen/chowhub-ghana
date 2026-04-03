import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Platform, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetFeaturedListings, useGetRecentListings, useGetNearbyListings, useGetPartners } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { coords, loading };
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const isWeb = Platform.OS === "web";

  const { coords } = useGeolocation();
  const { data: featured, isLoading: fl, refetch: rf } = useGetFeaturedListings();
  const { data: recent, isLoading: rl, refetch: rr } = useGetRecentListings({ limit: 10 });
  const { data: partners } = useGetPartners();
  const { data: nearby, refetch: rn } = useGetNearbyListings(
    { lat: coords?.lat || 0, lng: coords?.lng || 0, radius: 10, limit: 6 },
    { query: { enabled: !!coords } as any }
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rf(), rr(), coords ? rn() : Promise.resolve()]);
    setRefreshing(false);
  }, [rf, rr, rn, coords]);

  const sections: Array<{ key: string; listing?: any }> = [
    { key: "header" },
    ...(coords && nearby && nearby.length > 0 ? [
      { key: "nearby_title" },
      ...nearby.map((l: any) => ({ key: `n_${l.id}`, listing: l })),
    ] : []),
    { key: "featured_title" },
    ...(featured || []).map((l: any) => ({ key: `f_${l.id}`, listing: l })),
    { key: "recent_title" },
    ...(recent || []).map((l: any) => ({ key: `r_${l.id}`, listing: l })),
    ...(partners && partners.length > 0 ? [{ key: "partners_title" }] : []),
    ...(partners && partners.length > 0 ? [{ key: "partners_logos" }] : []),
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
          if (item.key === "nearby_title") {
            return (
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.nearbyIcon, { backgroundColor: colors.primary + "18" }]}>
                    <Feather name="navigation" size={14} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Near you</Text>
                    <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Restaurants close to your location</Text>
                  </View>
                </View>
              </View>
            );
          }
          if (item.key === "featured_title") {
            return (
              <View style={[styles.sectionHeader, nearby && nearby.length > 0 ? { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 } : {}]}>
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
          if (item.key === "partners_title") {
            return (
              <View style={[styles.sectionHeader, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, alignItems: "center" }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Meet Our Partners</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Trusted by leading organizations</Text>
              </View>
            );
          }
          if (item.key === "partners_logos" && partners) {
            return (
              <View style={styles.partnersRow}>
                {partners.map((p: any) => (
                  <View key={p.id} style={[styles.partnerCard, { borderColor: colors.border, borderRadius: colors.radius, backgroundColor: colors.card }]}>
                    <View style={styles.partnerLogoWrap}>
                      {p.logoUrl ? (
                        <View style={styles.partnerLogoFallback}>
                          <Feather name="image" size={20} color={colors.mutedForeground} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.partnerName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{p.name}</Text>
                  </View>
                ))}
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
  sectionSub: { fontSize: 12, marginTop: 1 },
  nearbyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardWrapper: { paddingHorizontal: 20 },
  loading: { paddingTop: 60, alignItems: "center" },
  partnersRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12, justifyContent: "center" },
  partnerCard: { width: 100, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  partnerLogoWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  partnerLogoFallback: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  partnerName: { fontSize: 11, textAlign: "center" },
});
