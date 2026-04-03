import { View, Text, StyleSheet, ScrollView, Image, Pressable, Linking, ActivityIndicator, Platform, Alert, TextInput, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetListingBySlug, useGetListingMenu, useGetListingReviews, useCreateOrder } from "@workspace/api-client-react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ListingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { isAuthenticated, mode } = useAuth();

  const { data: listing, isLoading } = useGetListingBySlug(slug || "", { query: { enabled: !!slug } as any });
  const { data: menu } = useGetListingMenu(listing?.id || "", { query: { enabled: !!listing?.id } as any });
  const { data: reviewsData } = useGetListingReviews(listing?.id || "", {}, { query: { enabled: !!listing?.id } as any });
  const reviews = reviewsData?.reviews;
  const createOrderMut = useCreateOrder();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderType, setOrderType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const addToCart = (item: any) => {
    if (!item.price) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const getItemQty = (id: string) => cart.find(c => c.id === id)?.quantity || 0;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || mode !== "user") {
      Alert.alert("Login Required", "Please log in to place an order", [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }

    if (cart.length === 0) return;
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      Alert.alert("Error", "Please enter a delivery address");
      return;
    }

    try {
      await createOrderMut.mutateAsync({
        data: {
          listingId: listing!.id,
          items: cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
          orderType,
          deliveryAddress: orderType === "delivery" ? deliveryAddress.trim() : null,
          note: note.trim() || null,
        },
      });
      setCart([]);
      setShowCheckout(false);
      setNote("");
      setDeliveryAddress("");
      Alert.alert("Order Placed!", "Your order has been sent to the restaurant. They will prepare it shortly.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to place order");
    }
  };

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

  const availableMenu = (menu || []).filter((m: any) => m.isAvailable !== false);
  const menuCategories = [...new Set(availableMenu.map((m: any) => m.category || "Other"))];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: cartCount > 0 ? 100 : (isWeb ? 34 : 40) }}>
        <View style={[styles.heroImage, { backgroundColor: colors.muted }]}>
          {listing.photos && listing.photos.length > 0 ? (
            <Image source={{ uri: listing.photos[0].url }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={40} color={colors.mutedForeground} />
            </View>
          )}
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

          {availableMenu.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              <View style={styles.menuHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 2 }]}>Menu</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {availableMenu.length} items · Tap to add to order
                  </Text>
                </View>
              </View>

              {menuCategories.map((cat, catIdx) => {
                const items = availableMenu.filter((m: any) => (m.category || "Other") === cat);
                return (
                  <View key={cat}>
                    {menuCategories.length > 1 && (
                      <Text style={[styles.menuCatLabel, { color: colors.primary, fontFamily: "Inter_600SemiBold", backgroundColor: colors.primary + "08" }]}>{cat}</Text>
                    )}
                    {items.map((item: any, idx: number) => {
                      const qty = getItemQty(item.id);
                      return (
                        <View key={item.id} style={[styles.menuRow, idx < items.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.menuNameRow}>
                              <Text style={[styles.menuName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                              {item.isPopular && (
                                <View style={[styles.popBadge, { backgroundColor: "#fef9ee" }]}>
                                  <Text style={styles.popText}>Popular</Text>
                                </View>
                              )}
                            </View>
                            {item.description ? <Text style={[styles.menuDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>{item.description}</Text> : null}
                            {item.price && (
                              <Text style={[styles.menuPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>GHS {item.price.toFixed(2)}</Text>
                            )}
                          </View>
                          {item.price ? (
                            qty > 0 ? (
                              <View style={styles.qtyControl}>
                                <Pressable onPress={() => updateQuantity(item.id, -1)} style={[styles.qtyBtn, { backgroundColor: colors.muted }]}>
                                  <Feather name="minus" size={14} color={colors.foreground} />
                                </Pressable>
                                <Text style={[styles.qtyNum, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{qty}</Text>
                                <Pressable onPress={() => updateQuantity(item.id, 1)} style={[styles.qtyBtn, { backgroundColor: colors.primary }]}>
                                  <Feather name="plus" size={14} color="#fff" />
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable
                                onPress={() => addToCart(item)}
                                style={({ pressed }) => [styles.addCartBtn, { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 }]}
                              >
                                <Feather name="plus" size={14} color={colors.primary} />
                                <Text style={[styles.addCartText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Add</Text>
                              </Pressable>
                            )
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
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
                    <Text style={[styles.hoursTime, { color: isClosed ? colors.mutedForeground : colors.foreground, fontFamily: "Inter_400Regular" }]}>
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

      {cartCount > 0 && (
        <View style={[styles.cartBar, { backgroundColor: colors.card, paddingBottom: Math.max(16, insets.bottom) }]}>
          <Pressable
            onPress={() => setShowCheckout(true)}
            style={({ pressed }) => [styles.cartBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={[styles.cartBtnText, { fontFamily: "Inter_600SemiBold" }]}>View Order</Text>
            <Text style={[styles.cartTotal, { fontFamily: "Inter_700Bold" }]}>GHS {cartTotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={showCheckout} animationType="slide" transparent onRequestClose={() => setShowCheckout(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.checkoutSheet, { backgroundColor: colors.card }]}>
            <View style={styles.checkoutHeader}>
              <Text style={[styles.checkoutTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Your Order</Text>
              <Pressable onPress={() => setShowCheckout(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView style={styles.checkoutBody} showsVerticalScrollIndicator={false}>
              {cart.map(item => (
                <View key={item.id} style={[styles.checkoutItem, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkoutItemName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{item.name}</Text>
                    <Text style={[styles.checkoutItemPrice, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>GHS {item.price.toFixed(2)} each</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <Pressable onPress={() => updateQuantity(item.id, -1)} style={[styles.qtyBtn, { backgroundColor: colors.muted }]}>
                      <Feather name="minus" size={14} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyNum, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{item.quantity}</Text>
                    <Pressable onPress={() => updateQuantity(item.id, 1)} style={[styles.qtyBtn, { backgroundColor: colors.primary }]}>
                      <Feather name="plus" size={14} color="#fff" />
                    </Pressable>
                  </View>
                  <Text style={[styles.checkoutLineTotal, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    GHS {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}

              <View style={styles.orderTypeSection}>
                <Text style={[styles.orderTypeLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Order Type</Text>
                <View style={styles.orderTypeRow}>
                  <Pressable
                    onPress={() => setOrderType("pickup")}
                    style={[styles.orderTypeBtn, { backgroundColor: orderType === "pickup" ? colors.primary : colors.muted }]}
                  >
                    <Feather name="shopping-bag" size={16} color={orderType === "pickup" ? "#fff" : colors.foreground} />
                    <Text style={[styles.orderTypeText, { color: orderType === "pickup" ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>Pickup</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setOrderType("delivery")}
                    style={[styles.orderTypeBtn, { backgroundColor: orderType === "delivery" ? colors.primary : colors.muted }]}
                  >
                    <Feather name="truck" size={16} color={orderType === "delivery" ? "#fff" : colors.foreground} />
                    <Text style={[styles.orderTypeText, { color: orderType === "delivery" ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium" }]}>Delivery</Text>
                  </Pressable>
                </View>
              </View>

              {orderType === "delivery" && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Delivery Address</Text>
                  <TextInput
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Enter delivery address"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Note (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Special instructions"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.fieldInput, { backgroundColor: colors.muted, color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={[styles.checkoutFooter, { borderTopColor: colors.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Total</Text>
                <Text style={[styles.totalAmount, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>GHS {cartTotal.toFixed(2)}</Text>
              </View>
              <Pressable
                onPress={handlePlaceOrder}
                disabled={createOrderMut.isPending}
                style={({ pressed }) => [styles.placeOrderBtn, { backgroundColor: colors.primary, opacity: pressed || createOrderMut.isPending ? 0.8 : 1 }]}
              >
                {createOrderMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.placeOrderText, { fontFamily: "Inter_600SemiBold" }]}>Place Order</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  ratingChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
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
  menuHeader: { marginBottom: 8 },
  menuSubtitle: { fontSize: 12 },
  menuCatLabel: { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  menuNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuName: { fontSize: 14, letterSpacing: -0.1 },
  popBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  popText: { fontSize: 9, color: "#92680e", fontWeight: "600" },
  menuDesc: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  menuPrice: { fontSize: 15, marginTop: 5 },
  addCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addCartText: { fontSize: 13 },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 15, minWidth: 20, textAlign: "center" },
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

  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },
  cartBadge: { backgroundColor: "rgba(255,255,255,0.25)", width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cartBtnText: { color: "#fff", fontSize: 16, flex: 1, textAlign: "center" },
  cartTotal: { color: "#fff", fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  checkoutSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", overflow: "hidden" },
  checkoutHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  checkoutTitle: { fontSize: 20, letterSpacing: -0.3 },
  checkoutBody: { paddingHorizontal: 20, maxHeight: 400 },
  checkoutItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  checkoutItemName: { fontSize: 14 },
  checkoutItemPrice: { fontSize: 12, marginTop: 2 },
  checkoutLineTotal: { fontSize: 14, minWidth: 70, textAlign: "right" },
  orderTypeSection: { marginTop: 20 },
  orderTypeLabel: { fontSize: 15, marginBottom: 10 },
  orderTypeRow: { flexDirection: "row", gap: 12 },
  orderTypeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  orderTypeText: { fontSize: 14 },
  fieldGroup: { marginTop: 16 },
  fieldLabel: { fontSize: 13, marginBottom: 6 },
  fieldInput: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, fontSize: 14 },
  checkoutFooter: { padding: 20, borderTopWidth: 1, gap: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15 },
  totalAmount: { fontSize: 22, letterSpacing: -0.5 },
  placeOrderBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  placeOrderText: { color: "#fff", fontSize: 16 },
});
