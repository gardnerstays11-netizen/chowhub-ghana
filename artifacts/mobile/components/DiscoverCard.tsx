import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

interface DiscoverCardProps {
  listing: {
    id: string;
    slug: string;
    name: string;
    category: string;
    city: string;
    area: string;
    averageRating: number;
    priceRange: string;
    coverPhoto?: string | null;
    isFeatured?: boolean;
    cuisineType?: string[];
    distance?: number | null;
  };
  variant?: "standard" | "wide" | "compact";
}

export function DiscoverCard({ listing, variant = "standard" }: DiscoverCardProps) {
  const colors = useColors();
  const router = useRouter();

  const width = variant === "wide" ? 280 : variant === "compact" ? 160 : 210;
  const imageAspect = variant === "wide" ? 2 : variant === "compact" ? 1.15 : 1.35;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: listing.slug } })}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: colors.card,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.imageContainer, { aspectRatio: imageAspect, backgroundColor: colors.muted }]}>
        {listing.coverPhoto ? (
          <Image source={{ uri: listing.coverPhoto }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={22} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.imageOverlay} />
        {listing.isFeatured && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FEATURED</Text>
          </View>
        )}
        {listing.distance != null && (
          <View style={styles.distanceBadge}>
            <Feather name="navigation" size={9} color="#fff" />
            <Text style={styles.distanceText}>{listing.distance} km</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
          {listing.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.ratingPill, { backgroundColor: "#fef9ee" }]}>
            <Feather name="star" size={10} color="#d4941a" />
            <Text style={[styles.ratingText, { color: "#92680e", fontFamily: "Inter_600SemiBold" }]}>
              {listing.averageRating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.category, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {listing.category.replace(/_/g, " ")}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={10} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {listing.area}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 14,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "transparent",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(201, 138, 21, 0.92)",
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.8 },
  distanceBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  distanceText: { fontSize: 9, color: "#fff", fontWeight: "600" },
  content: { padding: 12, gap: 4 },
  name: { fontSize: 14, letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: { fontSize: 11 },
  category: { fontSize: 11, textTransform: "capitalize", flex: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 11 },
});
