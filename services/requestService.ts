// services/requestService.ts
import { db } from "@/Firebase/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";

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

export async function submitRequest(req: RequestData) {
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
    createdAt: Timestamp.now(),
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
