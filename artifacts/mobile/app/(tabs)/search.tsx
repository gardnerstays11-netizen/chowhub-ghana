import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, Platform, Pressable, Keyboard } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSearchListings, useGetListingAutocomplete, useLogSearch } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CATEGORIES = [
  { label: "All", value: "", icon: "grid" as const },
  { label: "Chop Bars", value: "chop_bar", icon: "home" as const },
  { label: "Fine Dining", value: "fine_dining", icon: "star" as const },
  { label: "Cafes", value: "cafe_bakery", icon: "coffee" as const },
  { label: "Street Food", value: "street_food", icon: "truck" as const },
  { label: "Bars & Grills", value: "bar_grill", icon: "sunset" as const },
  { label: "Seafood", value: "seafood", icon: "anchor" as const },
];

const SORT_OPTIONS = [
  { label: "Relevant", value: "" },
  { label: "Top Rated", value: "highest_rated" },
  { label: "Most Reviewed", value: "most_reviewed" },
  { label: "Newest", value: "newest" },
];

const RECENT_SEARCHES_KEY = "chowhub_recent_searches";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(params.category || "");
  const [selectedSort, setSelectedSort] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const isWeb = Platform.OS === "web";
  const logSearchMut = useLogSearch();
  const searchLoggedRef = useRef<string>("");

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (params.category) setSelectedCategory(params.category);
  }, [params.category]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* empty */ }
  };

  const saveSearch = async (q: string) => {
    if (!q.trim() || q.length < 2) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch { /* empty */ }
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch { /* empty */ }
  };

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
    sort: selectedSort || undefined,
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
    setShowRecent(false);
    router.push(`/listing/${slug}` as any);
  };

  const handleSearchSubmit = () => {
    setShowAutocomplete(false);
    setShowRecent(false);
    if (query.trim()) saveSearch(query.trim());
    Keyboard.dismiss();
  };

  const handleRecentPress = (q: string) => {
    setQuery(q);
    setDebouncedQuery(q);
    setShowRecent(false);
    setShowAutocomplete(false);
  };

  const hasResults = (data?.listings?.length || 0) > 0;
  const showEmptySearch = !query && !selectedCategory && !isLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.card, paddingTop: isWeb ? 67 + 12 : 12 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.muted }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); setShowAutocomplete(true); setShowRecent(false); }}
            onFocus={() => {
              if (query.length >= 2) setShowAutocomplete(true);
              else if (recentSearches.length > 0) setShowRecent(true);
            }}
            placeholder="Search restaurants, dishes, cuisines..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(""); setDebouncedQuery(""); setShowAutocomplete(false); }} hitSlop={8}>
              <View style={[styles.clearBtn, { backgroundColor: colors.mutedForeground + "20" }]}>
                <Feather name="x" size={12} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.filtersRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.value || "all"}
            contentContainerStyle={{ gap: 8 }}
            style={{ flex: 1 }}
            renderItem={({ item }) => {
              const active = selectedCategory === item.value;
              return (
                <Pressable
                  onPress={() => setSelectedCategory(prev => prev === item.value ? "" : item.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : "transparent",
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather name={item.icon} size={12} color={active ? "#fff" : colors.mutedForeground} style={{ marginRight: 5 }} />
                  <Text style={[styles.chipText, {
                    color: active ? "#fff" : colors.foreground,
                    fontFamily: active ? "Inter_600SemiBold" : "Inter_500Medium",
                  }]}>{item.label}</Text>
                </Pressable>
              );
            }}
          />

          <Pressable
            onPress={() => setShowSortOptions(!showSortOptions)}
            style={({ pressed }) => [
              styles.sortBtn,
              {
                borderColor: selectedSort ? colors.primary : colors.border,
                backgroundColor: selectedSort ? colors.primary + "0A" : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="sliders" size={14} color={selectedSort ? colors.primary : colors.mutedForeground} />
          </Pressable>
        </View>

        {showSortOptions && (
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(opt => {
              const active = selectedSort === opt.value;
              return (
                <Pressable
                  key={opt.value || "default"}
                  onPress={() => { setSelectedSort(opt.value); setShowSortOptions(false); }}
                  style={[styles.sortChip, {
                    backgroundColor: active ? colors.primary : "transparent",
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.chipText, {
                    color: active ? "#fff" : colors.foreground,
                    fontFamily: "Inter_500Medium",
                  }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {showRecent && recentSearches.length > 0 && !query && (
        <View style={[styles.recentPanel, { backgroundColor: colors.card }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Recent Searches</Text>
            <Pressable onPress={clearRecentSearches} hitSlop={8}>
              <Text style={[styles.clearText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>Clear</Text>
            </Pressable>
          </View>
          {recentSearches.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => handleRecentPress(s)}
              style={({ pressed }) => [styles.recentItem, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.recentIconWrap, { backgroundColor: colors.muted }]}>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.recentText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{s}</Text>
              <Feather name="arrow-up-left" size={14} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}

      {showAutocomplete && suggestions && suggestions.length > 0 && (
        <View style={[styles.autocomplete, { backgroundColor: colors.card }]}>
          {suggestions.map((s: any) => (
            <Pressable
              key={s.id}
              onPress={() => handleSuggestionPress(s.slug)}
              style={({ pressed }) => [styles.autoItem, { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.autoIconWrap, { backgroundColor: colors.primary + "0D" }]}>
                <Feather name="map-pin" size={13} color={colors.primary} />
              </View>
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
        numColumns={1}
        contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : 100 }}
        renderItem={({ item }: { item: any }) => <ListingCard listing={item} />}
        onScrollBeginDrag={() => { setShowAutocomplete(false); setShowRecent(false); }}
        ListHeaderComponent={
          <View style={styles.resultHeader}>
            <Text style={[styles.resultCount, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {isLoading ? "Searching..." : `${data?.total || 0} places found`}
            </Text>
            {selectedSort && (
              <Pressable
                onPress={() => setSelectedSort("")}
                style={[styles.activeSortBadge, { backgroundColor: colors.primary + "0D" }]}
              >
                <Text style={[styles.activeSortText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  {SORT_OPTIONS.find(o => o.value === selectedSort)?.label}
                </Text>
                <Feather name="x" size={12} color={colors.primary} />
              </Pressable>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : showEmptySearch ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "0A" }]}>
                <Feather name="compass" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                Explore ChowHub
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Search for restaurants, dishes, or cuisines.{"\n"}Use categories to filter by type.
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: "#fef9ee" }]}>
                <Feather name="search" size={36} color="#d4941a" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                No places found
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Try a different search term or category
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 46, borderRadius: 14 },
  input: { flex: 1, fontSize: 15, height: 46 },
  clearBtn: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  filtersRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12 },
  chip: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  chipText: { fontSize: 12 },
  sortBtn: { borderWidth: 1, padding: 9, borderRadius: 10 },
  sortRow: { flexDirection: "row", gap: 8, paddingTop: 10 },
  sortChip: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  resultCount: { fontSize: 13 },
  activeSortBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  activeSortText: { fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 19, letterSpacing: -0.3 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  autocomplete: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  autoItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  autoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  autoName: { fontSize: 14 },
  autoMeta: { fontSize: 12, textTransform: "capitalize", marginTop: 1 },
  recentPanel: { paddingHorizontal: 16, paddingVertical: 14 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  recentTitle: { fontSize: 14 },
  clearText: { fontSize: 13 },
  recentItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  recentIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  recentText: { flex: 1, fontSize: 14 },
});
