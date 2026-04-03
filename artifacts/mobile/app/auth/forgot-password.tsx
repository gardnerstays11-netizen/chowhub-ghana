import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { getApiUrl } from "@/lib/apiUrl";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: isWeb ? 67 + 40 : 40, paddingBottom: 60 }}
      bounces={false}
    >
      {sent ? (
        <View style={styles.sentContainer}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            If an account exists with {email}, we've sent a password reset link.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 24 }]}>
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Back to Login</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Forgot password?</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Enter your email and we'll send a reset link.</Text>

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
            {error ? (
              <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            ) : null}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !email}
              style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Send Reset Link</Text>
              )}
            </Pressable>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.link, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Back to <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Login</Text>
            </Text>
          </Pressable>
        </>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  sentContainer: { alignItems: "center", paddingTop: 40 },
  title: { fontSize: 24, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28, textAlign: "center" },
  form: { gap: 4 },
  label: { fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, height: 44, paddingHorizontal: 14, fontSize: 14 },
  error: { fontSize: 13, marginTop: 4 },
  btn: { height: 44, alignItems: "center", justifyContent: "center", marginTop: 20 },
  btnText: { fontSize: 15 },
  link: { textAlign: "center", fontSize: 14, marginTop: 20 },
});
