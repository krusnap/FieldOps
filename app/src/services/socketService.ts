import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.5:4000";
const TOKEN_KEY = "fieldops_token";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => console.log("[Socket] Connected"));
  socket.on("disconnect", () => console.log("[Socket] Disconnected"));
  socket.on("connect_error", (err) => console.warn("[Socket] Error:", err.message));

  return socket;
}

export function emitLocationUpdate(payload: {
  trip_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  altitude?: number | null;
  recorded_at: string;
}): void {
  socket?.emit("location:update", payload);
}

export function emitTripStarted(tripId: string): void {
  socket?.emit("trip:started", { trip_id: tripId });
}

export function emitTripEnded(tripId: string, distanceKm: number): void {
  socket?.emit("trip:ended", { trip_id: tripId, distance_km: distanceKm });
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
