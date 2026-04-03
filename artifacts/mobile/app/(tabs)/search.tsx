import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, Platform, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSearchListings, useGetListingAutocomplete, useLogSearch } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const CATEGORIES = [
  { label: "Chop Bars", value: "chop_bar" },
  { label: "Fine Dining", value: "fine_dining" },
  { label: "Cafes", value: "cafe_bakery" },
  { label: "Street Food", value: "street_food" },
  { label: "Bars & Grills", value: "bar_grill" },
  { label: "Seafood", value: "seafood" },
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const isWeb = Platform.OS === "web";
  const logSearchMut = useLogSearch();
  const searchLoggedRef = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: suggestions } = useGetListingAutocomplete(
    { q: query, limit: 6 },
    { query: { enabled: query.length >= 2 && showAutocomplete } as any }
  );

  const { data, isLoading } = useSearchListings({
    q: debouncedQuery || undefined,
    category: selectedCategory || undefined,
    limit: 30,
  });

  const logCurrentSearch = useCallback(() => {
    if (debouncedQuery.length >= 2 && searchLoggedRef.current !== debouncedQuery) {
      searchLoggedRef.current = debouncedQuery;
      logSearchMut.mutate({
        data: {
          query: debouncedQuery,
          resultsCount: data?.total || 0,
          category: selectedCategory || null,
        },
      });
    }
  }, [debouncedQuery, data?.total, selectedCategory, logSearchMut]);

  useEffect(() => {
    if (data && debouncedQuery.length >= 2) logCurrentSearch();
  }, [data, debouncedQuery, logCurrentSearch]);

  const handleSuggestionPress = (slug: string) => {
    setShowAutocomplete(false);
    router.push(`/listing/${slug}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: isWeb ? 67 + 8 : 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); setShowAutocomplete(true); }}
            onFocus={() => query.length >= 2 && setShowAutocomplete(true)}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => setShowAutocomplete(false)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setDebouncedQuery(""); setShowAutocomplete(false); }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ gap: 8, paddingTop: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedCategory(prev => prev === item.value ? "" : item.value)}
              style={[
                styles.chip,
                {
                  borderColor: selectedCategory === item.value ? colors.primary : colors.border,
                  backgroundColor: selectedCategory === item.value ? colors.primary + "15" : "transparent",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.chipText, {
                color: selectedCategory === item.value ? colors.primary : colors.mutedForeground,
                fontFamily: selectedCategory === item.value ? "Inter_600SemiBold" : "Inter_400Regular",
              }]}>{item.label}</Text>
            </Pressable>
          )}
        />
      </View>

      {showAutocomplete && suggestions && suggestions.length > 0 && (
        <View style={[styles.autocomplete, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {suggestions.map((s: any) => (
            <Pressable
              key={s.id}
              onPress={() => handleSuggestionPress(s.slug)}
              style={[styles.autoItem, { borderBottomColor: colors.border }]}
            >
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.autoName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{s.name}</Text>
                <Text style={[styles.autoMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {s.category.replace(/_/g, " ")} · {s.area}, {s.city}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={data?.listings || []}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: isWeb ? 34 : 100 }}
        renderItem={({ item }: { item: any }) => <ListingCard listing={item} />}
        onScrollBeginDrag={() => setShowAutocomplete(false)}
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
  chip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { fontSize: 13 },
  resultCount: { fontSize: 13, marginBottom: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  autocomplete: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  autoItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  autoName: { fontSize: 14 },
  autoMeta: { fontSize: 12, textTransform: "capitalize" },
});
