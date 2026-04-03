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
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
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
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{listing.name}</Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color={colors.secondary} />
            <Text style={[styles.rating, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{listing.averageRating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{listing.area}, {listing.city}</Text>
        </View>
        <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
          {listing.category.replace(/_/g, " ")} · {listing.priceRange}
          {listing.cuisineType && listing.cuisineType.length > 0 ? ` · ${listing.cuisineType.slice(0, 2).map(c => c.replace(/_/g, " ")).join(", ")}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, overflow: "hidden" as const, marginBottom: 12 },
  imageContainer: { aspectRatio: 3 / 2, position: "relative" as const },
  image: { width: "100%", height: "100%", resizeMode: "cover" as const },
  imagePlaceholder: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const },
  badge: { position: "absolute" as const, top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  content: { padding: 12 },
  titleRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 4 },
  name: { fontSize: 15, flex: 1, marginRight: 8 },
  ratingRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3 },
  rating: { fontSize: 13 },
  locationRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginBottom: 6 },
  location: { fontSize: 13 },
  meta: { fontSize: 12, textTransform: "capitalize" as const },
});
