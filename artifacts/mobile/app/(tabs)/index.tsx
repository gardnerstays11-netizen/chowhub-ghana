import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, RefreshControl, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetFeaturedListings, useGetRecentListings, useGetNearbyListings, useGetPopularListings, useGetTrendingListings, useGetUpcomingEvents, useGetPartners, useGetTopRatedListings, useSearchListings } from "@workspace/api-client-react";
import { DiscoverCard } from "@/components/DiscoverCard";
import { EventCard } from "@/components/EventCard";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

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
        <View style={[styles.sectionIcon, { backgroundColor: (iconColor || colors.primary) + "12" }]}>
          <Feather name={icon as any} size={15} color={iconColor || colors.primary} />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{title}</Text>
          {subtitle && <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{subtitle}</Text>}
        </View>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8} style={({ pressed }) => [styles.seeAllBtn, { opacity: pressed ? 0.7 : 1 }]}>
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
    <View style={[styles.statBanner, { backgroundColor: colors.card }]}>
      <View style={styles.statItem}>
        <View style={[styles.statIconWrap, { backgroundColor: colors.primary + "10" }]}>
          <Feather name="map-pin" size={15} color={colors.primary} />
        </View>
        <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>50+</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Restaurants</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <View style={[styles.statIconWrap, { backgroundColor: "#fef9ee" }]}>
          <Feather name="star" size={15} color="#d4941a" />
        </View>
        <Text style={[styles.statNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>4.5+</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Avg Rating</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      <View style={styles.statItem}>
        <View style={[styles.statIconWrap, { backgroundColor: colors.primary + "10" }]}>
          <Feather name="map" size={15} color={colors.primary} />
        </View>
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
      <LinearGradient
        colors={["#1c4230", "#24503a", "#2d6248"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: isWeb ? 67 + 20 : insets.top + 16 }]}
      >
        <Text style={[styles.heroTitle, { fontFamily: "Inter_700Bold" }]}>
          Discover great food{"\n"}across Ghana
        </Text>
        <Text style={[styles.heroSubtitle, { fontFamily: "Inter_400Regular" }]}>
          From chop bars to fine dining
        </Text>
        <Pressable
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.searchBar, { opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={styles.searchIconWrap}>
            <Feather name="search" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.searchPlaceholder, { fontFamily: "Inter_400Regular" }]}>
            Search restaurants, dishes, cuisines...
          </Text>
        </Pressable>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => router.push({ pathname: "/search", params: { category: cat.key } })}
            style={({ pressed }) => [
              styles.categoryChip,
              { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.categoryIconWrap, { backgroundColor: colors.primary + "0D" }]}>
              <Feather name={cat.icon} size={17} color={colors.primary} />
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
            iconColor="#d4941a"
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
            iconColor="#c0392b"
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
            iconColor="#e67e22"
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
            iconColor="#059669"
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
            iconColor="#7c3aed"
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
            iconColor="#7c3aed"
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
        <View style={[styles.section, styles.partnersSection, { borderTopColor: colors.border }]}>
          <View style={styles.partnersTitleWrap}>
            <Text style={[styles.partnersTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Our Partners</Text>
            <Text style={[styles.partnersSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Trusted by leading organizations</Text>
          </View>
          <View style={styles.partnersRow}>
            {partners.map((p: any) => (
              <View key={p.id} style={[styles.partnerCard, { backgroundColor: colors.card }]}>
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
  hero: { paddingHorizontal: 24, paddingBottom: 24 },
  heroTitle: { fontSize: 28, lineHeight: 34, color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 18, letterSpacing: 0.1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(36,80,58,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: { fontSize: 14, color: "#999" },

  categoryRow: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 10 },
  categoryChip: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 84,
  },
  categoryIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryLabel: { fontSize: 11, letterSpacing: 0.1 },

  statBanner: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: { alignItems: "center", gap: 5 },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 20, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, letterSpacing: 0.3, textTransform: "uppercase" },
  statDivider: { width: 1, height: 40 },

  section: { marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, letterSpacing: -0.3 },
  sectionSub: { fontSize: 11, marginTop: 1 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13 },

  carouselContent: { paddingHorizontal: 20, paddingBottom: 4 },

  loadingWrap: { paddingTop: 60, alignItems: "center" },

  partnersSection: { borderTopWidth: 1, marginTop: 16, paddingTop: 8 },
  partnersTitleWrap: { alignItems: "center", paddingTop: 20, paddingBottom: 14 },
  partnersTitle: { fontSize: 17, letterSpacing: -0.3 },
  partnersSub: { fontSize: 12, marginTop: 3 },
  partnersRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12, justifyContent: "center", paddingBottom: 12 },
  partnerCard: {
    width: 90,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  partnerLogo: { width: 40, height: 40 },
  partnerLogoFallback: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  partnerName: { fontSize: 10, textAlign: "center" },
});
