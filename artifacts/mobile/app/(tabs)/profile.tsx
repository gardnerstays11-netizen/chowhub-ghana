import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const colors = useColors();
  const { isAuthenticated, user, vendor, mode, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const handleLogout = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const MenuItem = ({ icon, label, onPress, color, isLast }: { icon: string; label: string; onPress: () => void; color?: string; isLast?: boolean }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.menuIconWrap, { backgroundColor: (color || colors.primary) + "0D" }]}>
        <Feather name={icon as any} size={16} color={color || colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: color || colors.foreground, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 20 : 20, paddingBottom: isWeb ? 34 : 100 }}>
      {isAuthenticated && user ? (
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{user.email}</Text>
          </View>
        </View>
      ) : isAuthenticated && vendor ? (
        <View style={[styles.userCard, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Feather name="briefcase" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{vendor.businessName}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{vendor.email}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Account</Text>
        {!isAuthenticated ? (
          <>
            <MenuItem icon="log-in" label="Log in" onPress={() => router.push("/auth/login")} />
            <MenuItem icon="user-plus" label="Sign up" onPress={() => router.push("/auth/register")} isLast />
          </>
        ) : (
          <>
            <MenuItem icon="clock" label="My Reservations" onPress={() => router.push("/user/reservations")} />
            <MenuItem icon="shopping-bag" label="My Orders" onPress={() => router.push("/user/orders")} />
            <MenuItem icon="star" label="My Reviews" onPress={() => router.push("/user/reviews")} isLast />
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Vendor Portal</Text>
        {mode === "vendor" && isAuthenticated ? (
          <MenuItem icon="layout" label="Vendor Dashboard" onPress={() => router.push("/vendor/dashboard")} isLast />
        ) : (
          <>
            <MenuItem icon="log-in" label="Vendor Login" onPress={() => router.push("/vendor/login")} />
            <MenuItem icon="plus-circle" label="Register Restaurant" onPress={() => router.push("/vendor/register")} isLast />
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Admin</Text>
        {mode === "admin" && isAuthenticated ? (
          <MenuItem icon="shield" label="Admin Dashboard" onPress={() => router.push("/admin/dashboard")} isLast />
        ) : (
          <MenuItem icon="shield" label="Admin Login" onPress={() => router.push("/admin/login")} isLast />
        )}
      </View>

      {isAuthenticated && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <MenuItem icon="log-out" label="Log out" onPress={handleLogout} color={colors.destructive} isLast />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18 },
  userName: { fontSize: 17, letterSpacing: -0.3 },
  userEmail: { fontSize: 13, marginTop: 2 },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15 },
});
