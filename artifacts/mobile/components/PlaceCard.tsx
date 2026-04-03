import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

interface PlaceCardProps {
  listing: {
    id: string;
    slug: string;
    name: string;
    category: string;
    diningStyle?: string;
    city: string;
    area: string;
    averageRating: number;
    priceRange: string;
    coverPhoto?: string | null;
    isFeatured?: boolean;
    distance?: number | null;
    features?: string[];
  };
  variant?: "full" | "compact";
}

const STYLE_LABELS: Record<string, string> = {
  casual: "Casual Dining",
  fine_dining: "Fine Dining",
  lounge: "Lounge",
  bar: "Bar & Lounge",
  cafe: "Café",
  buffet: "Buffet",
  brunch: "Brunch Spot",
};

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "home",
  fine_dining: "award",
  bar_grill: "sunset",
  lounge: "moon",
  cafe_bakery: "coffee",
  chop_bar: "home",
  seafood: "anchor",
};

export function PlaceCard({ listing, variant = "full" }: PlaceCardProps) {
  const colors = useColors();
  const router = useRouter();

  const styleLabel = STYLE_LABELS[listing.diningStyle || ""] || listing.category.replace(/_/g, " ");
  const catIcon = CATEGORY_ICONS[listing.category] || "map-pin";

  if (variant === "compact") {
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: listing.slug } })}
        style={({ pressed }) => [
          styles.compactCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={[styles.compactImage, { backgroundColor: colors.muted }]}>
          {listing.coverPhoto ? (
            <Image source={{ uri: listing.coverPhoto }} style={StyleSheet.absoluteFill} />
          ) : (
            <Feather name={catIcon as any} size={24} color={colors.mutedForeground} />
          )}
        </View>
        <View style={styles.compactContent}>
          <Text style={[styles.compactName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
            {listing.name}
          </Text>
          <Text style={[styles.compactMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {styleLabel} · {listing.area}
          </Text>
          <View style={styles.compactBottom}>
            <View style={[styles.ratingPill, { backgroundColor: "#fef9ee" }]}>
              <Feather name="star" size={9} color="#d4941a" />
              <Text style={[styles.ratingText, { fontFamily: "Inter_600SemiBold" }]}>{listing.averageRating.toFixed(1)}</Text>
            </View>
            <Text style={[styles.priceText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{listing.priceRange}</Text>
          </View>
        </View>
        <View style={[styles.reserveBadge, { backgroundColor: colors.primary + "12" }]}>
          <Feather name="calendar" size={12} color={colors.primary} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: listing.slug } })}
      style={({ pressed }) => [
        styles.fullCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.fullImage, { backgroundColor: colors.muted }]}>
        {listing.coverPhoto ? (
          <Image source={{ uri: listing.coverPhoto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <Feather name={catIcon as any} size={32} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.imageOverlay} />
        {listing.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>TOP PICK</Text>
          </View>
        )}
        {listing.distance != null && (
          <View style={styles.distanceBadge}>
            <Feather name="navigation" size={9} color="#fff" />
            <Text style={styles.distanceText}>{listing.distance} km</Text>
          </View>
        )}
        <View style={[styles.reserveTag, { backgroundColor: colors.primary }]}>
          <Feather name="calendar" size={10} color="#fff" />
          <Text style={styles.reserveTagText}>Reserve</Text>
        </View>
      </View>
      <View style={styles.fullContent}>
        <Text style={[styles.fullName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
          {listing.name}
        </Text>
        <View style={styles.fullMetaRow}>
          <View style={[styles.ratingPill, { backgroundColor: "#fef9ee" }]}>
            <Feather name="star" size={10} color="#d4941a" />
            <Text style={[styles.ratingText, { color: "#92680e", fontFamily: "Inter_600SemiBold" }]}>
              {listing.averageRating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.styleBadgeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {styleLabel}
          </Text>
          <Text style={{ color: colors.border }}>·</Text>
          <Text style={[styles.priceText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>{listing.priceRange}</Text>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.locationText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {listing.area}, {listing.city}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  fullImage: {
    width: "100%",
    aspectRatio: 1.8,
    position: "relative",
    overflow: "hidden",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  featuredBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#c98a15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  distanceBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  reserveTag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reserveTagText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  fullContent: {
    padding: 14,
    gap: 6,
  },
  fullName: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  fullMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    color: "#92680e",
  },
  styleBadgeText: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    gap: 12,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  compactContent: {
    flex: 1,
    gap: 2,
  },
  compactName: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  compactMeta: {
    fontSize: 12,
  },
  compactBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  reserveBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
