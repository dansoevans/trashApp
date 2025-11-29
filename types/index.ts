// types/index.ts
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    location?: {
        latitude: number;
        longitude: number;
        street?: string;
        city?: string;
        region?: string;
    };
    type: "user" | "collector";
    createdAt: any;
    updatedAt: any;
    photoURL?: string;
}

export interface PickupRequest {
    id: string;
    userId: string;
    userName: string;
    address: string;
    phone: string;
    wasteType: WasteType;
    date: string;
    time: string;
    status: RequestStatus;
    notes?: string;
    collectorId?: string;
    createdAt: any;
    updatedAt: any;
    cancelledBy?: string;
    cancelledAt?: string;
    cancelReason?: string;
}

export type WasteType =
    | "Household"
    | "Plastic"
    | "Organic"
    | "Paper"
    | "Electronic"
    | "Hazardous";

export type RequestStatus =
    | "Pending"
    | "Assigned"
    | "InProgress"
    | "Completed"
    | "Cancelled";

export interface NotificationData {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: "info" | "warning" | "success" | "error";
    read: boolean;
    data?: any;
    createdAt: any;
}

export interface TimeSlot {
    label: string;
    value: string;
    available: boolean;
}

export interface CalendarMarkedDate {
    selected?: boolean;
    selectedColor?: string;
    disabled?: boolean;
    dots?: Array<{ color: string; selectedColor?: string }>;
}

export class RequestSubmission {
}