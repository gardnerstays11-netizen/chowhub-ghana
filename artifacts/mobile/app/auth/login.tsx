import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colors = useColors();
  const { loginUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useLoginUser();

  const handleLogin = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mutation.mutate(
      { data: { email, password } },
      {
        onSuccess: async (res) => {
          await loginUser(res.token, res.user as any);
          router.back();
        },
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: isWeb ? 67 + 40 : 40 }]}>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Log in to your account</Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
        />
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
        />
        {mutation.isError && (
          <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>Invalid email or password</Text>
        )}
        <Pressable
          onPress={handleLogin}
          disabled={mutation.isPending || !email || !password}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: mutation.isPending ? 0.7 : 1 }]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Log in</Text>
          )}
        </Pressable>
      </View>
      <Pressable onPress={() => router.replace("/auth/register")}>
        <Text style={[styles.link, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Don't have an account? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign up</Text>
        </Text>
      </Pressable>
    </View>
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
  link: { textAlign: "center", fontSize: 14, marginTop: 20 },
});
