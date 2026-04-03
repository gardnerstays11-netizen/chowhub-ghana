import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRouter } from "expo-router";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    eventDate: string;
    endDate?: string | null;
    category?: string;
    listingName: string;
    listingSlug: string;
    listingCity: string;
    listingArea: string;
    imageUrl?: string | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const colors = useColors();
  const router = useRouter();
  const date = new Date(event.eventDate);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = date.getDate();
  const time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const categoryIcon: Record<string, string> = {
    music: "music",
    food: "coffee",
    special: "award",
    general: "calendar",
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: event.listingSlug } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[styles.dateBlock, { backgroundColor: colors.primary }]}>
        <Text style={[styles.dateMonth, { color: colors.primaryForeground }]}>{month}</Text>
        <Text style={[styles.dateDay, { color: colors.primaryForeground }]}>{day}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>{event.title}</Text>
        <View style={styles.eventMeta}>
          <Feather name={(categoryIcon[event.category || "general"] || "calendar") as any} size={11} color={colors.secondary} />
          <Text style={[styles.eventVenue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{event.listingName}</Text>
        </View>
        <View style={styles.eventMeta}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.eventTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{time}</Text>
          <Text style={[styles.eventDot, { color: colors.mutedForeground }]}>·</Text>
          <Feather name="map-pin" size={11} color={colors.mutedForeground} />
          <Text style={[styles.eventLoc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>{event.listingArea}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 260, borderRadius: 12, borderWidth: 1, overflow: "hidden", marginRight: 12, flexDirection: "row" },
  dateBlock: { width: 56, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  dateMonth: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  dateDay: { fontSize: 22, fontWeight: "800", marginTop: -2 },
  eventContent: { flex: 1, padding: 10, justifyContent: "center", gap: 3 },
  eventTitle: { fontSize: 13 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  eventVenue: { fontSize: 11, flex: 1 },
  eventTime: { fontSize: 10 },
  eventDot: { fontSize: 10 },
  eventLoc: { fontSize: 10, flex: 1 },
});
