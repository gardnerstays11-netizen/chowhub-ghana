import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLoginVendor } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function VendorLoginScreen() {
  const colors = useColors();
  const { loginVendor } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useLoginVendor();

  const handleLogin = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mutation.mutate(
      { data: { email, password } },
      {
        onSuccess: async (res) => {
          await loginVendor(res.token, res.vendor as any);
          router.replace("/vendor/dashboard");
        },
      }
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: isWeb ? 67 + 40 : 40, paddingBottom: 60 }}
      bounces={false}
    >
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Vendor Portal</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Manage your restaurant listing</Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="vendor@example.com" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor={colors.mutedForeground} secureTextEntry style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />
        {mutation.isError && <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>Invalid credentials</Text>}
        <Pressable onPress={handleLogin} disabled={mutation.isPending || !email || !password} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: mutation.isPending ? 0.7 : 1 }]}>
          {mutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Log in</Text>}
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  form: { gap: 4 },
  label: { fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, height: 44, paddingHorizontal: 14, fontSize: 14 },
  error: { fontSize: 13, marginTop: 4 },
  btn: { height: 44, alignItems: "center", justifyContent: "center", marginTop: 20 },
  btnText: { fontSize: 15 },
});
