import { db, pushTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(userId: string, message: PushMessage) {
  const tokens = await db
    .select()
    .from(pushTokensTable)
    .where(eq(pushTokensTable.userId, userId));

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title: message.title,
    body: message.body,
    data: message.data || {},
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (result.data) {
      const invalidIndices: number[] = [];
      for (let i = 0; i < result.data.length; i++) {
        if (result.data[i].status === "error" &&
            (result.data[i].details?.error === "DeviceNotRegistered" ||
             result.data[i].details?.error === "InvalidCredentials")) {
          invalidIndices.push(i);
        }
      }

      for (const idx of invalidIndices) {
        await db.delete(pushTokensTable).where(eq(pushTokensTable.id, tokens[idx].id));
      }
    }
  } catch (err) {
    console.error("[PUSH] Failed to send notification:", err);
  }
}
