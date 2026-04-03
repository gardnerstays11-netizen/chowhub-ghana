import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

interface ListingCardProps {
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
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: listing.slug } })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.muted }]}>
        {listing.coverPhoto ? (
          <Image source={{ uri: listing.coverPhoto }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={24} color={colors.mutedForeground} />
          </View>
        )}
        {listing.isFeatured && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FEATURED</Text>
          </View>
        )}
        <View style={[styles.ratingOverlay]}>
          <Feather name="star" size={11} color="#fbbf24" />
          <Text style={styles.ratingOverlayText}>{listing.averageRating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
          {listing.name}
        </Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {listing.area}, {listing.city}
          </Text>
        </View>
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tagText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {listing.category.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tagText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {listing.priceRange}
            </Text>
          </View>
          {listing.cuisineType && listing.cuisineType.length > 0 && (
            <View style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]} numberOfLines={1}>
                {listing.cuisineType[0].replace(/_/g, " ")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: { aspectRatio: 16 / 9, position: "relative" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(201, 138, 21, 0.92)",
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.8 },
  ratingOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingOverlayText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  content: { padding: 14, gap: 6 },
  name: { fontSize: 16, letterSpacing: -0.3 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: { fontSize: 13 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, textTransform: "capitalize" },
});
