import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { getApiUrl } from "@/lib/apiUrl";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const isWeb = Platform.OS === "web";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!token) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: isWeb ? 67 + 40 : 40, paddingBottom: 60, alignItems: "center" }}
        bounces={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Invalid Link</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          This password reset link is invalid or has expired.
        </Text>
        <Pressable onPress={() => router.push("/auth/forgot-password")} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 24 }]}>
          <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Request a new link</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: isWeb ? 67 + 40 : 40, paddingBottom: 60 }}
      bounces={false}
    >
      {success ? (
        <View style={styles.sentContainer}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Password Reset!</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Your password has been updated. You can now log in with your new password.
          </Text>
          <Pressable onPress={() => router.replace("/auth/login")} style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, marginTop: 24 }]}>
            <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Go to Login</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Set new password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Enter your new password below.</Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>New Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
            />
            <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]}
            />
            {error ? (
              <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>{error}</Text>
            ) : null}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !password || !confirmPassword}
              style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Reset Password</Text>
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
