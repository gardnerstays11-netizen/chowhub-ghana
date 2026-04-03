import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function RegisterScreen() {
  const colors = useColors();
  const { loginUser } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === "web";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Accra");
  const mutation = useRegisterUser();

  const handleRegister = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mutation.mutate(
      { data: { name, email, phone, password, city } },
      {
        onSuccess: async (res) => {
          await loginUser(res.token, res.user as any);
          router.back();
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
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Create account</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Join ChowHub to save spots and book tables</Text>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Full Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Kwame Mensah" placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />

        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />

        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="+233..." placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />

        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Password</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Min 6 characters" placeholderTextColor={colors.mutedForeground} secureTextEntry style={[styles.input, { borderColor: colors.border, color: colors.foreground, borderRadius: colors.radius, fontFamily: "Inter_400Regular" }]} />

        {mutation.isError && (
          <Text style={[styles.error, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>Registration failed. Try again.</Text>
        )}
        <Pressable
          onPress={handleRegister}
          disabled={mutation.isPending || !name || !email || !password || !phone}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: mutation.isPending ? 0.7 : 1 }]}
        >
          {mutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.btnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>Sign Up</Text>}
        </Pressable>
      </View>
      <Pressable onPress={() => router.replace("/auth/login")}>
        <Text style={[styles.link, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Already have an account? <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Log in</Text>
        </Text>
      </Pressable>
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
  link: { textAlign: "center", fontSize: 14, marginTop: 20 },
});
