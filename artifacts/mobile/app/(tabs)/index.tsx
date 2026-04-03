import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, RefreshControl, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetFeaturedListings, useGetRecentListings, useGetNearbyListings, useGetPopularListings, useGetTrendingListings, useGetUpcomingEvents, useGetPartners, useGetTopRatedListings, useSearchListings } from "@workspace/api-client-react";
import { DiscoverCard } from "@/components/DiscoverCard";
import { EventCard } from "@/components/EventCard";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORIES = [
  { key: "chop_bar", label: "Chop Bars", icon: "home" as const },
  { key: "fine_dining", label: "Fine Dining", icon: "star" as const },
  { key: "cafe_bakery", label: "Cafes", icon: "coffee" as const },
  { key: "bar_grill", label: "Bars & Grills", icon: "sunset" as const },
  { key: "street_food", label: "Street Food", icon: "truck" as const },
  { key: "seafood", label: "Seafood", icon: "anchor" as const },
  { key: "restaurant", label: "Restaurants", icon: "grid" as const },
];

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

function SectionHeader({ icon, iconColor, title, subtitle, onSeeAll }: { icon: string; iconColor?: string; title: string; subtitle?: string; onSeeAll?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: (iconColor || colors.primary) + "15" }]}>
          <Feather name={icon as any} size={15} color={iconColor || colors.primary} />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{title}</Text>
          {subtitle && <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{subtitle}</Text>}
        </View>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>See all</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

function HorizontalCarousel({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
      {children}
    </ScrollView>
  );
}

function QuickStatBanner() {
  const colors = useColors();
  return (
    <View style={[styles.statBanner, { backgroundColor: colors.primary + "08" }]}>
      <View style={styles.statItem}>
        <Feather name="map-pin" size={16} color={colors.primary} />
        <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>50+</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Restaurants</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <Feather name="star" size={16} color="#f59e0b" />
        <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>4.5+</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Avg Rating</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <Feather name="map" size={16} color={colors.primary} />
        <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>10+</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Cities</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const isWeb = Platform.OS === "web";

  const { coords } = useGeolocation();
  const { data: featured, isLoading: fl, refetch: rf } = useGetFeaturedListings();
  const { data: recent, refetch: rr } = useGetRecentListings({ limit: 10 });
  const { data: popular, refetch: rp } = useGetPopularListings({ limit: 10 });
  const { data: trending, refetch: rt } = useGetTrendingListings({ limit: 10 });
  const { data: topRated, refetch: rtr } = useGetTopRatedListings({ limit: 10 });
  const { data: events, refetch: re } = useGetUpcomingEvents({ limit: 6 });
  const { data: partners } = useGetPartners();
  const { data: nearby, refetch: rn } = useGetNearbyListings(
    { lat: coords?.lat || 0, lng: coords?.lng || 0, radius: 10, limit: 8 },
    { query: { enabled: !!coords } as any }
  );
  const { data: quickBites } = useSearchListings({ category: "street_food", limit: 8 });
  const { data: cafes } = useSearchListings({ category: "cafe_bakery", limit: 8 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rf(), rr(), rp(), rt(), rtr(), re(), coords ? rn() : Promise.resolve()]);
    setRefreshing(false);
  }, [rf, rr, rp, rt, rtr, re, rn, coords]);

  const loading = fl && !featured;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}
    >
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: isWeb ? 67 + 16 : insets.top + 12 }]}>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
          Discover great food{"\n"}across Ghana
        </Text>
        <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
          From chop bars to fine dining
        </Text>
        <Pressable
          onPress={() => router.push("/search")}
          style={[styles.searchBar, { backgroundColor: "#ffffff" }]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Search restaurants, dishes, cuisines...
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => router.push({ pathname: "/search", params: { category: cat.key } })}
            style={({ pressed }) => [
              styles.categoryChip,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.categoryIconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Feather name={cat.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.categoryLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <QuickStatBanner />

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {coords && nearby && nearby.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="navigation"
            title="Near You"
            subtitle="Best spots close to your location"
            onSeeAll={() => router.push("/search")}
          />
          <HorizontalCarousel>
            {nearby.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="standard" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {featured && featured.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="award"
            iconColor={colors.secondary as string}
            title="Featured Picks"
            subtitle="Hand-picked by our team"
            onSeeAll={() => router.push({ pathname: "/search", params: { sort: "featured" } })}
          />
          <HorizontalCarousel>
            {featured.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="wide" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {topRated && topRated.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="star"
            iconColor="#f59e0b"
            title="Top Rated"
            subtitle="Highest rated spots in Ghana"
            onSeeAll={() => router.push({ pathname: "/search", params: { sort: "highest_rated" } })}
          />
          <HorizontalCarousel>
            {topRated.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="standard" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {popular && popular.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="trending-up"
            iconColor="#e74c3c"
            title="Popular Joints"
            subtitle="Most ordered this month"
            onSeeAll={() => router.push({ pathname: "/search", params: { sort: "most_reviewed" } })}
          />
          <HorizontalCarousel>
            {popular.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="standard" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {trending && trending.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="zap"
            iconColor="#f39c12"
            title="Trending Food Spots"
            subtitle="Buzzing with recent activity"
            onSeeAll={() => router.push({ pathname: "/search", params: { sort: "highest_rated" } })}
          />
          <HorizontalCarousel>
            {trending.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="compact" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {quickBites?.listings && quickBites.listings.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="truck"
            iconColor="#10b981"
            title="Quick Bites"
            subtitle="Street food & fast eats"
            onSeeAll={() => router.push({ pathname: "/search", params: { category: "street_food" } })}
          />
          <HorizontalCarousel>
            {quickBites.listings.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="compact" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {cafes?.listings && cafes.listings.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="coffee"
            iconColor="#8b5cf6"
            title="Cafes & Bakeries"
            subtitle="Coffee, pastries & more"
            onSeeAll={() => router.push({ pathname: "/search", params: { category: "cafe_bakery" } })}
          />
          <HorizontalCarousel>
            {cafes.listings.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="standard" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {events && events.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="calendar"
            iconColor="#8e44ad"
            title="Upcoming Events"
            subtitle="Don't miss what's happening"
          />
          <HorizontalCarousel>
            {events.map((e: any) => (
              <EventCard key={e.id} event={e} />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {recent && recent.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            icon="clock"
            title="Recently Added"
            subtitle="Fresh on ChowHub"
            onSeeAll={() => router.push({ pathname: "/search", params: { sort: "newest" } })}
          />
          <HorizontalCarousel>
            {recent.map((l: any) => (
              <DiscoverCard key={l.id} listing={l} variant="standard" />
            ))}
          </HorizontalCarousel>
        </View>
      )}

      {partners && partners.length > 0 && (
        <View style={[styles.section, styles.partnersSection]}>
          <View style={styles.partnersTitleWrap}>
            <Text style={[styles.partnersTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Our Partners</Text>
            <Text style={[styles.partnersSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Trusted by leading organizations</Text>
          </View>
          <View style={styles.partnersRow}>
            {partners.map((p: any) => (
              <View key={p.id} style={[styles.partnerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {p.logoUrl ? (
                  <Image source={{ uri: p.logoUrl }} style={styles.partnerLogo} resizeMode="contain" />
                ) : (
                  <View style={[styles.partnerLogoFallback, { backgroundColor: colors.muted }]}>
                    <Feather name="briefcase" size={18} color={colors.mutedForeground} />
                  </View>
                )}
                <Text style={[styles.partnerName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  heroTitle: { fontSize: 26, lineHeight: 32, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, marginBottom: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  searchPlaceholder: { fontSize: 14 },

  categoryRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  categoryChip: { alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, minWidth: 80 },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  categoryLabel: { fontSize: 11 },

  statBanner: { flexDirection: "row", marginHorizontal: 20, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, marginBottom: 4, alignItems: "center", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 4 },
  statNum: { fontSize: 18 },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 32 },

  section: { marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17 },
  sectionSub: { fontSize: 11, marginTop: 1 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 12 },

  carouselContent: { paddingHorizontal: 20, paddingBottom: 4 },

  loadingWrap: { paddingTop: 60, alignItems: "center" },

  partnersSection: { borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)", marginTop: 12, paddingTop: 8 },
  partnersTitleWrap: { alignItems: "center", paddingTop: 16, paddingBottom: 12 },
  partnersTitle: { fontSize: 17 },
  partnersSub: { fontSize: 11, marginTop: 2 },
  partnersRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10, justifyContent: "center", paddingBottom: 8 },
  partnerCard: { width: 90, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "center", gap: 6 },
  partnerLogo: { width: 40, height: 40 },
  partnerLogoFallback: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  partnerName: { fontSize: 10, textAlign: "center" },
});
