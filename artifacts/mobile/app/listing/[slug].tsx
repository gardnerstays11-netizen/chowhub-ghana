import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetListingBySlug, useGetListingMenu, useGetListingReviews } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ListingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const { data: listing, isLoading } = useGetListingBySlug(slug || "", { query: { enabled: !!slug } as any });
  const { data: menu } = useGetListingMenu(listing?.id || "", { query: { enabled: !!listing?.id } as any });
  const { data: reviewsData } = useGetListingReviews(listing?.id || "", {}, { query: { enabled: !!listing?.id } as any });
  const reviews = reviewsData?.reviews;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.notFoundIcon, { backgroundColor: colors.muted }]}>
          <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.notFound, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Listing not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: isWeb ? 34 : 40 }}>
      <View style={[styles.heroImage, { backgroundColor: colors.muted }]}>
        {listing.photos && listing.photos.length > 0 ? (
          <Image source={{ uri: listing.photos[0].url }} style={styles.heroImg} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={40} color={colors.mutedForeground} />
          </View>
        )}
        <View style={styles.heroGradient} />
        {listing.isFeatured && (
          <View style={styles.featuredBadge}>
            <Feather name="award" size={11} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.category, { color: colors.secondary, fontFamily: "Inter_600SemiBold" }]}>
          {listing.category.replace(/_/g, " ")}
        </Text>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{listing.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.area}, {listing.city}</Text>
          </View>
          <View style={[styles.ratingChip, { backgroundColor: "#fef9ee" }]}>
            <Feather name="star" size={13} color="#d4941a" />
            <Text style={[styles.ratingNum, { fontFamily: "Inter_700Bold" }]}>{listing.averageRating.toFixed(1)}</Text>
            <Text style={[styles.ratingCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>({listing.totalReviews})</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {listing.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${listing.phone}`)}
              style={({ pressed }) => [styles.actionBtn, styles.callBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Feather name="phone" size={16} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>Call</Text>
            </Pressable>
          )}
          {listing.whatsapp && (
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/${listing.whatsapp!.replace(/[^0-9]/g, "")}`)}
              style={({ pressed }) => [styles.actionBtn, styles.waBtn, { opacity: pressed ? 0.9 : 1 }]}
            >
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>WhatsApp</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>About</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.description}</Text>
        </View>

        {listing.features && listing.features.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Features</Text>
            <View style={styles.featureWrap}>
              {listing.features.map((f: string) => (
                <View key={f} style={[styles.featureTag, { backgroundColor: colors.muted }]}>
                  <Feather name="check" size={11} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{f.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {menu && menu.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Menu</Text>
            {menu.map((item: any, index: number) => (
              <View key={item.id} style={[styles.menuRow, index < menu.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                  {item.description && <Text style={[styles.menuDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{item.description}</Text>}
                </View>
                {item.price && (
                  <View style={[styles.pricePill, { backgroundColor: colors.primary + "0A" }]}>
                    <Text style={[styles.menuPrice, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>GHS {item.price}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {listing.openingHours && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Opening Hours</Text>
            {Object.entries(listing.openingHours).map(([day, hours]: [string, any]) => {
              const isClosed = hours === "closed" || !hours?.open;
              return (
                <View key={day} style={styles.hoursRow}>
                  <Text style={[styles.hoursDay, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{day}</Text>
                  <Text style={[styles.hoursTime, {
                    color: isClosed ? colors.mutedForeground : colors.foreground,
                    fontFamily: "Inter_400Regular",
                  }]}>
                    {typeof hours === "string" ? (hours === "closed" ? "Closed" : hours) : hours?.open ? `${hours.open} - ${hours.close}` : "Closed"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {reviews && reviews.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Reviews</Text>
            {reviews.map((r: any, index: number) => (
              <View key={r.id} style={[styles.reviewItem, index < reviews.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.reviewHead}>
                  <View style={styles.reviewAuthorRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                        {(r.userName || "G")[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.reviewAuthor, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.userName || "Guest"}</Text>
                  </View>
                  <View style={[styles.reviewRating, { backgroundColor: "#fef9ee" }]}>
                    <Feather name="star" size={11} color="#d4941a" />
                    <Text style={[styles.reviewRatingText, { fontFamily: "Inter_600SemiBold" }]}>{r.rating}</Text>
                  </View>
                </View>
                <Text style={[styles.reviewText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  notFoundIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 15 },
  heroImage: { height: 260, position: "relative" },
  heroImg: { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201, 138, 21, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  featuredText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  body: { padding: 20 },
  category: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  title: { fontSize: 26, letterSpacing: -0.5, lineHeight: 32, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 14 },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ratingNum: { fontSize: 14, color: "#92680e" },
  ratingCount: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, flex: 1, justifyContent: "center" },
  callBtn: { backgroundColor: "#24503a" },
  waBtn: { backgroundColor: "#25D366" },
  actionText: { fontSize: 14 },
  sectionCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, marginBottom: 12, letterSpacing: -0.2 },
  desc: { fontSize: 14, lineHeight: 23 },
  featureWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  featureText: { fontSize: 12, textTransform: "capitalize" },
  menuRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, gap: 12 },
  menuName: { fontSize: 14, letterSpacing: -0.1 },
  menuDesc: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  pricePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  menuPrice: { fontSize: 14 },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  hoursDay: { fontSize: 13, textTransform: "capitalize" },
  hoursTime: { fontSize: 13 },
  reviewItem: { paddingVertical: 14 },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13 },
  reviewAuthor: { fontSize: 14 },
  reviewRating: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  reviewRatingText: { fontSize: 12, color: "#92680e" },
  reviewText: { fontSize: 13, lineHeight: 21, paddingLeft: 42 },
});
