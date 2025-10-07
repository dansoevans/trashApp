// utils/sms.ts
import * as SMS from "expo-sms";
import { Platform } from "react-native";

/**
 * Attempts to send SMS. Behavior:
 * - Android: sometimes sends without UI (platform dependent)
 * - iOS: will typically open Messages composer and require user confirmation
 *
 * Returns: { success: boolean, result?: string }
 */
export async function sendAutoSMS(to: string | string[], body: string) {
  const recipients = Array.isArray(to) ? to : [to];
  try {
    const available = await SMS.isAvailableAsync();
    if (!available) {
      return { success: false, result: "unavailable" };
    }

    // sendSMSAsync returns { result: "sent" | "cancelled" | "unknown" }
    const res = await SMS.sendSMSAsync(recipients, body);

    // on some Android devices 'sent' will be returned; on iOS 'unknown' or 'cancelled' may appear
    return { success: res.result === "sent" || res.result === "unknown", result: res.result };
  } catch (err: any) {
    // iOS may throw due to restrictions; treat as failure
    console.warn("sendAutoSMS error", err);
    return { success: false, result: err?.message };
  }
}
