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
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
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
      </View>

      <View style={styles.body}>
        <Text style={[styles.category, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {listing.category.replace(/_/g, " ")}
          {listing.isFeatured ? " · Featured" : ""}
        </Text>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{listing.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.area}, {listing.city}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="star" size={14} color={colors.secondary} />
            <Text style={[styles.metaText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{listing.averageRating.toFixed(1)}</Text>
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>({listing.totalReviews})</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {listing.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${listing.phone}`)}
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              <Feather name="phone" size={16} color={colors.primaryForeground} />
              <Text style={[styles.actionText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Call</Text>
            </Pressable>
          )}
          {listing.whatsapp && (
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/${listing.whatsapp!.replace(/[^0-9]/g, "")}`)}
              style={[styles.actionBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]}
            >
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={[styles.actionText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>WhatsApp</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>About</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{listing.description}</Text>
        </View>

        {listing.features && listing.features.length > 0 && (
          <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Features</Text>
            <View style={styles.featureWrap}>
              {listing.features.map((f: string) => (
                <View key={f} style={[styles.featureTag, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                  <Text style={[styles.featureText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{f.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {menu && menu.length > 0 && (
          <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Menu</Text>
            {menu.map((item: any) => (
              <View key={item.id} style={[styles.menuRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.menuName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                  {item.description && <Text style={[styles.menuDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{item.description}</Text>}
                </View>
                {item.price && <Text style={[styles.menuPrice, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>GHS {item.price}</Text>}
              </View>
            ))}
          </View>
        )}

        {listing.openingHours && (
          <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Opening Hours</Text>
            {Object.entries(listing.openingHours).map(([day, hours]: [string, any]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={[styles.hoursDay, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{day}</Text>
                <Text style={[styles.hoursTime, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {typeof hours === "string" ? (hours === "closed" ? "Closed" : hours) : hours?.open ? `${hours.open} - ${hours.close}` : "Closed"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {reviews && reviews.length > 0 && (
          <View style={[styles.sectionCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Reviews</Text>
            {reviews.map((r: any) => (
              <View key={r.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                <View style={styles.reviewHead}>
                  <Text style={[styles.reviewAuthor, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{r.userName || "Guest"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Feather name="star" size={12} color={colors.secondary} />
                    <Text style={[{ fontSize: 13, color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{r.rating}</Text>
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
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFound: { fontSize: 15 },
  heroImage: { height: 220 },
  heroImg: { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { padding: 20 },
  category: { fontSize: 12, textTransform: "capitalize", marginBottom: 4 },
  title: { fontSize: 24, marginBottom: 8 },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  actionText: { fontSize: 14 },
  sectionCard: { borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, marginBottom: 10 },
  desc: { fontSize: 14, lineHeight: 22 },
  featureWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureTag: { paddingHorizontal: 10, paddingVertical: 6 },
  featureText: { fontSize: 12, textTransform: "capitalize" },
  menuRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  menuName: { fontSize: 14 },
  menuDesc: { fontSize: 12, marginTop: 2 },
  menuPrice: { fontSize: 14 },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  hoursDay: { fontSize: 13, textTransform: "capitalize" },
  hoursTime: { fontSize: 13 },
  reviewItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  reviewAuthor: { fontSize: 14 },
  reviewText: { fontSize: 13, lineHeight: 20 },
});
