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

  const width = variant === "wide" ? 260 : variant === "compact" ? 150 : 200;
  const imageAspect = variant === "wide" ? 2.2 : variant === "compact" ? 1.2 : 1.5;

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: listing.slug } })}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[styles.imageContainer, { aspectRatio: imageAspect, backgroundColor: colors.muted }]}>
        {listing.coverPhoto ? (
          <Image source={{ uri: listing.coverPhoto }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={20} color={colors.mutedForeground} />
          </View>
        )}
        {listing.isFeatured && (
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>Featured</Text>
          </View>
        )}
        {listing.distance != null && (
          <View style={[styles.distanceBadge, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
            <Feather name="navigation" size={9} color="#fff" />
            <Text style={styles.distanceText}>{listing.distance} km</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{listing.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingRow}>
            <Feather name="star" size={10} color={colors.secondary} />
            <Text style={[styles.ratingText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{listing.averageRating.toFixed(1)}</Text>
          </View>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.category, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {listing.category.replace(/_/g, " ")}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={10} color={colors.mutedForeground} />
          <Text style={[styles.location, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{listing.area}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginRight: 12 },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, left: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  distanceBadge: { position: "absolute", bottom: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 3 },
  distanceText: { fontSize: 9, color: "#fff", fontWeight: "600" },
  content: { padding: 10 },
  name: { fontSize: 13, marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 11 },
  dot: { fontSize: 10 },
  category: { fontSize: 11, textTransform: "capitalize", flex: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  location: { fontSize: 11 },
});
