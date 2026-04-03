import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { registerForPushNotifications } from "@/lib/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_STEPS = [
  {
    image: require("@/assets/images/onboarding-discover.png"),
    title: "Discover Ghana's\nBest Eats",
    subtitle:
      "From sizzling street food to fine dining — explore restaurants, chop bars, and hidden gems across Ghana.",
    icon: "compass" as const,
  },
  {
    image: require("@/assets/images/onboarding-nearby.png"),
    title: "Find Places\nNear You",
    subtitle:
      "Use your location to discover what's cooking nearby. Filter by cuisine, price, occasion, and more.",
    icon: "map-pin" as const,
  },
  {
    image: require("@/assets/images/onboarding-community.png"),
    title: "Join the\nFood Community",
    subtitle:
      "Save your favourites, leave reviews, make reservations, and never miss a great meal again.",
    icon: "heart" as const,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("onboarding_complete", "true");
    router.replace("/(tabs)");
  };

  const handleEnableNotifications = async () => {
    setNotifLoading(true);
    try {
      await registerForPushNotifications();
    } catch {}
    setNotifLoading(false);
    await finishOnboarding();
  };

  const handleSkipNotifications = async () => {
    await finishOnboarding();
  };

  const goNext = () => {
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isLast = currentIndex === ONBOARDING_STEPS.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_STEPS}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.imageWrapper}>
              <Image source={item.image} style={styles.image} resizeMode="cover" />
              <View style={[styles.imageOverlay, { backgroundColor: colors.primary + "15" }]} />
            </View>

            <View style={styles.contentArea}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "12" }]}>
                <Feather name={item.icon} size={24} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {item.title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {item.subtitle}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {ONBOARDING_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {!isLast ? (
          <View style={styles.buttonRow}>
            <Pressable
              onPress={async () => {
                await AsyncStorage.setItem("onboarding_complete", "true");
                router.replace("/(tabs)");
              }}
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Skip
              </Text>
            </Pressable>

            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.nextBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.nextText, { fontFamily: "Inter_600SemiBold" }]}>Next</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.finalButtons}>
            <Pressable
              onPress={handleEnableNotifications}
              disabled={notifLoading}
              style={({ pressed }) => [
                styles.notifBtn,
                { backgroundColor: colors.primary, opacity: pressed || notifLoading ? 0.85 : 1 },
              ]}
            >
              {notifLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="bell" size={18} color="#fff" />
                  <Text style={[styles.notifBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                    Enable Notifications
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleSkipNotifications}
              style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1, alignSelf: "center" }]}
            >
              <Text style={[styles.skipNotifText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Maybe Later
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { flex: 1 },
  imageWrapper: {
    flex: 0.52,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  contentArea: {
    flex: 0.48,
    paddingHorizontal: 28,
    paddingTop: 28,
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
  },
  finalButtons: {
    gap: 10,
  },
  notifBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  notifBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  skipNotifText: {
    fontSize: 14,
    paddingVertical: 8,
  },
});
