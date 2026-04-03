import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, RefreshControl, ActivityIndicator, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useState, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchListings } from "@workspace/api-client-react";
import { PlaceCard } from "@/components/PlaceCard";

const PLACE_TYPES = [
  { key: "all", label: "All Places", icon: "grid" },
  { key: "fine_dining", label: "Fine Dining", icon: "award" },
  { key: "restaurant", label: "Restaurants", icon: "home" },
  { key: "bar_grill", label: "Bars & Lounges", icon: "sunset" },
  { key: "cafe_bakery", label: "Cafés", icon: "coffee" },
  { key: "seafood", label: "Seafood", icon: "anchor" },
];

export default function PlacesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const queryParams = useMemo(() => ({
    accepts_reservations: "true" as any,
    ...(activeType !== "all" ? { category: activeType } : {}),
    ...(search.trim() ? { q: search.trim() } : {}),
    limit: 30,
    sort: "highest_rated" as any,
  }), [activeType, search]);

  const { data, isLoading, refetch } = useSearchListings(queryParams);

  const listings = data?.listings || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const featured = useMemo(() => listings.filter((l: any) => l.isFeatured), [listings]);
  const rest = useMemo(() => listings.filter((l: any) => !l.isFeatured), [listings]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: isWeb ? 20 : insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Places</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Find & reserve a spot</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.primary + "12" }]}>
            <Feather name="map-pin" size={18} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search lounges, restaurants, bars..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {PLACE_TYPES.map((type) => {
            const active = activeType === type.key;
            return (
              <Pressable
                key={type.key}
                onPress={() => setActiveType(type.key)}
                style={[
                  styles.typeChip,
                  { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
                ]}
              >
                <Feather name={type.icon as any} size={13} color={active ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.typeLabel, { color: active ? "#fff" : colors.foreground, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Finding places...</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "10" }]}>
            <Feather name="map" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>No places found</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Try a different search or category
          </Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: isWeb ? 40 : 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            featured.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: "#fef3e2" }]}>
                    <Feather name="award" size={14} color="#c98a15" />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Top Picks</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                  {featured.map((listing: any) => (
                    <View key={listing.id} style={{ width: 280 }}>
                      <PlaceCard listing={listing} variant="full" />
                    </View>
                  ))}
                </ScrollView>
                {rest.length > 0 && (
                  <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "12" }]}>
                      <Feather name="list" size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>All Places</Text>
                  </View>
                )}
              </View>
            ) : null
          }
          renderItem={({ item }: { item: any }) => (
            <View style={styles.listItem}>
              <PlaceCard listing={item} variant="compact" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  typeRow: {
    gap: 8,
    paddingVertical: 2,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionWrap: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  featuredRow: {
    gap: 14,
  },
  listItem: {
    marginBottom: 10,
  },
});
