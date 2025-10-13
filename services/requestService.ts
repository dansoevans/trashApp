// services/requestService.ts
import { db } from "../Firebase/firebaseConfig";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

const requestsRef = collection(db, "requests");

export const getBookedTimes = async (date: string) => {
  const q = query(requestsRef, where("date", "==", date));
  const snapshot = await getDocs(q);
  const bookedTimes = snapshot.docs.map((doc) => doc.data().time);
  return bookedTimes;
};

export const submitRequest = async (data: {
  name: string;
  phone: string;
  wasteType: string;
  address: string;
  date: string;
  time: string;
}) => {
  // Check if selected slot already exists
  const q = query(
    requestsRef,
    where("date", "==", data.date),
    where("time", "==", data.time)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    throw new Error("That time slot is already booked. Please choose another.");
  }

  const docRef = await addDoc(requestsRef, {
    ...data,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};
