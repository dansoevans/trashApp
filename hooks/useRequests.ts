// hooks/useRequests.ts
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

// Type
export type Request = {
  id: string;
  address: string;
  type: string;
  weight: number;
  pickupAt: string; // ISO
  status: "pending" | "completed";
  createdAt: string;
};

const STORAGE_KEY = "trashaway.requests";

export default function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRequests(JSON.parse(raw));
      } catch (e) {
        console.warn("failed to load requests", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (newList: Request[]) => {
    setRequests(() => newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn("failed to save requests", e);
    }
  };

  const addRequest = async (payload: Omit<Request, "id" | "status" | "createdAt">) => {
    const item: Request = {
      ...payload,
      id: uuidv4(),
      status: "pending",
      createdAt: new Date().toISOString(),
    } as Request;
    const next = [item, ...requests];
    await persist(next);
  };

  const removeRequest = async (id: string) => {
    const next = requests.filter((r) => r.id !== id);
    await persist(next);
  };

  const markCompleted = async (id: string) => {
      const next = requests.map((r) => (r.id === id ? { ...r, status: "completed" as "completed" } : r));
      await persist(next);
  };

  return { requests, loading, addRequest, removeRequest, markCompleted };
}
