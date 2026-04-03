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

  const MenuItem = ({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color?: string }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <Feather name={icon as any} size={18} color={color || colors.foreground} />
      <Text style={[styles.menuLabel, { color: color || colors.foreground, fontFamily: "Inter_500Medium" }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: isWeb ? 67 + 16 : 16, paddingBottom: isWeb ? 34 : 100 }}>
      {isAuthenticated && user ? (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{user.email}</Text>
          </View>
        </View>
      ) : isAuthenticated && vendor ? (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Feather name="briefcase" size={20} color={colors.secondaryForeground} />
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{vendor.businessName}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{vendor.email}</Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Account</Text>
        {!isAuthenticated ? (
          <>
            <MenuItem icon="log-in" label="Log in" onPress={() => router.push("/auth/login")} />
            <MenuItem icon="user-plus" label="Sign up" onPress={() => router.push("/auth/register")} />
          </>
        ) : (
          <>
            <MenuItem icon="clock" label="My Reservations" onPress={() => router.push("/user/reservations")} />
            <MenuItem icon="shopping-bag" label="My Orders" onPress={() => router.push("/user/orders")} />
            <MenuItem icon="star" label="My Reviews" onPress={() => router.push("/user/reviews")} />
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Vendor Portal</Text>
        {mode === "vendor" && isAuthenticated ? (
          <MenuItem icon="layout" label="Vendor Dashboard" onPress={() => router.push("/vendor/dashboard")} />
        ) : (
          <>
            <MenuItem icon="log-in" label="Vendor Login" onPress={() => router.push("/vendor/login")} />
            <MenuItem icon="plus-circle" label="Register Restaurant" onPress={() => router.push("/vendor/register")} />
          </>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>Admin</Text>
        {mode === "admin" && isAuthenticated ? (
          <MenuItem icon="shield" label="Admin Dashboard" onPress={() => router.push("/admin/dashboard")} />
        ) : (
          <MenuItem icon="shield" label="Admin Login" onPress={() => router.push("/admin/login")} />
        )}
      </View>

      {isAuthenticated && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <MenuItem icon="log-out" label="Log out" onPress={handleLogout} color={colors.destructive} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18 },
  userName: { fontSize: 16 },
  userEmail: { fontSize: 13 },
  section: { borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  sectionLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  menuLabel: { flex: 1, fontSize: 15 },
});
