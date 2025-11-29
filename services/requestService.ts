// services/requestService.ts
import { db } from "@/Firebase/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import {PickupRequest, RequestStatus} from "@/types";


export interface RequestData {
  userId: string;
  userName: string;
  address: string;
  phone: string;
  wasteType: string;
  date: string; // yyyy-mm-dd
  time: string; // e.g. "10:00 AM"
  status?: string;
  createdAt?: any;
}

export async function getBookedTimes(date: string): Promise<string[]> {
  try {
    const q = query(collection(db, "requests"), where("date", "==", date));
    const snap = await getDocs(q);
    const times: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.time) times.push(data.time);
    });
    return times;
  } catch (e) {
    console.error("getBookedTimes", e);
    return [];
  }
}

export async function submitRequest(req: {
  status: string;
  userId: any;
  userName: any;
  address: string;
  phone: string;
  wasteType: string;
  date: string;
  time: string;
  notes: string | null
}) {
  // ensure slot still available (caller should also check)
  const q = query(
      collection(db, "requests"),
      where("date", "==", req.date),
      where("time", "==", req.time)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Slot ${req.date} ${req.time} is already booked.`);
  }

  await addDoc(collection(db, "requests"), {
    ...req,
    status: req.status || "Pending",
    createdAt: serverTimestamp(),
  });
}

export async function getUserRequests(userId: string) {
  const q = query(
      collection(db, "requests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const out: any[] = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out;
}
/** Get a single request by id */
export async function getRequestById(requestId: string) {
  const ref = doc(db, "requests", requestId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null;
}

/** Update request fields (partial) */
export async function updateRequest(requestId: string, partial: Record<string, any>) {
  const ref = doc(db, "requests", requestId);
  await updateDoc(ref, {
    ...partial,
    updatedAt: serverTimestamp(),
  });
}

/** Cancel request (marks status and writes cancellation metadata) */
export async function cancelRequest(requestId: string, meta?: { cancelledBy?: string; cancelledAt?: string; reason?: string }) {
  const ref = doc(db, "requests", requestId);
  const payload: any = {
    status: "Cancelled",
    updatedAt: serverTimestamp(),
  };
  if (meta) {
    payload.cancelledBy = meta.cancelledBy;
    if (meta.cancelledAt) payload.cancelledAt = meta.cancelledAt;
    if (meta.reason) payload.cancelReason = meta.reason;
  }
  await updateDoc(ref, payload);
}

/** Notify collector via writing to notifications collection (collector app should listen) */
export async function notifyCollector(collectorId: string, payload: { title: string; body: string; requestId?: string }) {
  try {
    await addDoc(collection(db, "notifications"), {
      collectorId,
      title: payload.title,
      body: payload.body,
      requestId: payload.requestId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("notifyCollector failed", e);
  }
}
// Add these functions to your existing requestService.ts

export async function rescheduleRequest(
    requestId: string,
    newDate: string,
    newTime: string,
    reason?: string
): Promise<void> {
  try {
    if (!requestId || !newDate || !newTime) {
      throw new Error("Request ID, date, and time are required");
    }

    // Check new slot availability
    const bookedTimes = await getBookedTimes(newDate);
    if (bookedTimes.includes(newTime)) {
      throw new Error(`The time slot ${newTime} on ${newDate} is already booked.`);
    }

    // Update the request
    await updateRequest(requestId, {
      date: newDate,
      time: newTime,
      status: "Pending",
    });

    console.log(`Request ${requestId} rescheduled to ${newDate} ${newTime}`);
  } catch (error) {
    console.error("Error rescheduling request:", error);
    throw error;
  }
}

// Utility function to check if request can be cancelled
export function canCancelRequest(request: PickupRequest): boolean {
  const nonCancellableStatuses: RequestStatus[] = ["Completed", "InProgress"];
  return !nonCancellableStatuses.includes(request.status);
}

// Utility function to check if request can be edited
export function canEditRequest(request: PickupRequest): boolean {
  const nonEditableStatuses: RequestStatus[] = ["Completed", "InProgress", "Cancelled"];
  return !nonEditableStatuses.includes(request.status);
}

