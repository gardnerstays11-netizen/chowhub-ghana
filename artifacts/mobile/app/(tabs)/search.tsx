import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSearchListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const isWeb = Platform.OS === "web";

  const { data, isLoading } = useSearchListings({ q: query, limit: 30 });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: isWeb ? 67 + 8 : 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Feather name="x" size={16} color={colors.mutedForeground} onPress={() => setQuery("")} />
          )}
        </View>
      </View>
      <FlatList
        data={data?.listings || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 34 : 100 }}
        renderItem={({ item }: { item: any }) => <ListingCard listing={item} />}
        ListHeaderComponent={
          <Text style={[styles.resultCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {isLoading ? "Searching..." : `${data?.total || 0} places found`}
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Feather name="search" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {query ? "No places found" : "Search for restaurants"}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 40 },
  input: { flex: 1, fontSize: 14, height: 40 },
  resultCount: { fontSize: 13, marginBottom: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
