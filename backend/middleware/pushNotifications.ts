import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

// Best-effort — a failed/invalid push token should never break the caller's
// own request (e.g. a rider advancing a job stage). Swallow errors here.
export async function sendPushNotification(
  token: string | null | undefined,
  message: Omit<ExpoPushMessage, "to">,
): Promise<void> {
  if (!token || !Expo.isExpoPushToken(token)) return;

  try {
    await expo.sendPushNotificationsAsync([{ to: token, ...message }]);
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}
