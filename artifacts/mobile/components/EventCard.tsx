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

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[slug]", params: { slug: event.listingSlug } })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.dateBlock}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={styles.dateDay}>{day}</Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.eventMeta}>
          <Feather name="map-pin" size={11} color={colors.secondary} />
          <Text style={[styles.eventVenue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {event.listingName}
          </Text>
        </View>
        <View style={styles.eventMeta}>
          <Feather name="clock" size={11} color={colors.mutedForeground} />
          <Text style={[styles.eventTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{time}</Text>
          <Text style={[styles.eventDot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.eventLoc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {event.listingArea}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 270,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 14,
    flexDirection: "row",
    shadowColor: "#1a2b1f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  dateBlock: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#24503a",
  },
  dateMonth: { fontSize: 10, fontWeight: "700", letterSpacing: 1, color: "rgba(255,255,255,0.7)" },
  dateDay: { fontSize: 24, fontWeight: "800", marginTop: -2, color: "#fff" },
  eventContent: { flex: 1, padding: 12, justifyContent: "center", gap: 4 },
  eventTitle: { fontSize: 14, letterSpacing: -0.2 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  eventVenue: { fontSize: 12, flex: 1 },
  eventTime: { fontSize: 11 },
  eventDot: { fontSize: 10 },
  eventLoc: { fontSize: 11, flex: 1 },
});
