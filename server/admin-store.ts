import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export type AdminUserRole = "admin" | "commander" | "dispatcher" | "viewer";
export type NotificationChannel = "console" | "sms" | "email" | "push";

export interface AdminUserRecord {
  id: string;
  name: string;
  username: string;
  role: AdminUserRole;
  stationId: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PoliceStationRecord {
  id: string;
  name: string;
  province: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  commandPhone: string;
  commandEmail: string;
  commanderName: string;
  operatingHours: string;
  responseRadiusKm: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export interface NotificationLogRecord {
  id: string;
  stationId: string | null;
  reportId: string | null;
  title: string;
  message: string;
  channel: NotificationChannel;
  recipient: string;
  status: "queued" | "sent" | "failed";
  createdAt: string;
}

interface AdminStoreData {
  users: AdminUserRecord[];
  stations: PoliceStationRecord[];
  notifications: NotificationLogRecord[];
}

const storePath = path.resolve(process.cwd(), "server", "data", "admin-management.json");

const now = () => new Date().toISOString();

const defaultStations: PoliceStationRecord[] = [
  {
    id: "station_boroko",
    name: "Boroko Police Station",
    province: "National Capital District",
    district: "Port Moresby",
    address: "Boroko, Port Moresby, National Capital District",
    latitude: -9.4672,
    longitude: 147.1957,
    commandPhone: "+675 0000 0001",
    commandEmail: "boroko.command@example.gov.pg",
    commanderName: "Station Commander",
    operatingHours: "24/7",
    responseRadiusKm: 15,
    isActive: true,
    notes: "Default station for Port Moresby reports.",
    createdAt: now(),
  },
  {
    id: "station_local",
    name: "Local Police Station",
    province: "Papua New Guinea",
    district: "Local District",
    address: "Nearest local police station",
    latitude: -6.314993,
    longitude: 143.95555,
    commandPhone: "+675 0000 0002",
    commandEmail: "local.command@example.gov.pg",
    commanderName: "Duty Commander",
    operatingHours: "24/7",
    responseRadiusKm: 25,
    isActive: true,
    notes: "Fallback local command station.",
    createdAt: now(),
  },
];

const defaultData: AdminStoreData = {
  users: [
    {
      id: "user_admin",
      name: "System Administrator",
      username: "admin",
      role: "admin",
      stationId: null,
      phone: null,
      email: null,
      isActive: true,
      createdAt: now(),
    },
  ],
  stations: defaultStations,
  notifications: [],
};

function ensureStore(): void {
  if (fs.existsSync(storePath)) return;
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(defaultData, null, 2));
}

function readStore(): AdminStoreData {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(storePath, "utf-8")) as Partial<AdminStoreData>;
  return {
    users: data.users || [],
    stations: data.stations || [],
    notifications: data.notifications || [],
  };
}

function writeStore(data: AdminStoreData): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function normalizeNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const adminStore = {
  listUsers(): AdminUserRecord[] {
    return readStore().users;
  },

  saveUser(input: Partial<AdminUserRecord>): AdminUserRecord {
    const data = readStore();
    const existingIndex = input.id ? data.users.findIndex((item) => item.id === input.id) : -1;
    const user: AdminUserRecord = {
      id: input.id || randomUUID(),
      name: String(input.name || "Unnamed User"),
      username: String(input.username || "user"),
      role: (input.role || "viewer") as AdminUserRole,
      stationId: input.stationId || null,
      phone: input.phone || null,
      email: input.email || null,
      isActive: input.isActive !== false,
      createdAt: input.createdAt || now(),
    };
    if (existingIndex >= 0) data.users[existingIndex] = user;
    else data.users.unshift(user);
    writeStore(data);
    return user;
  },

  listStations(): PoliceStationRecord[] {
    return readStore().stations;
  },

  saveStation(input: Partial<PoliceStationRecord>): PoliceStationRecord {
    const data = readStore();
    const existingIndex = input.id ? data.stations.findIndex((item) => item.id === input.id) : -1;
    const station: PoliceStationRecord = {
      id: input.id || randomUUID(),
      name: String(input.name || "Unnamed Police Station"),
      province: String(input.province || ""),
      district: String(input.district || ""),
      address: String(input.address || ""),
      latitude: normalizeNumber(input.latitude, 0),
      longitude: normalizeNumber(input.longitude, 0),
      commandPhone: String(input.commandPhone || ""),
      commandEmail: String(input.commandEmail || ""),
      commanderName: String(input.commanderName || ""),
      operatingHours: String(input.operatingHours || "24/7"),
      responseRadiusKm: normalizeNumber(input.responseRadiusKm, 20),
      isActive: input.isActive !== false,
      notes: String(input.notes || ""),
      createdAt: input.createdAt || now(),
    };
    if (existingIndex >= 0) data.stations[existingIndex] = station;
    else data.stations.unshift(station);
    writeStore(data);
    return station;
  },

  nearestStation(latitude: number, longitude: number): (PoliceStationRecord & { distanceKm: number; withinResponseRadius: boolean }) | null {
    const stations = readStore().stations.filter((station) => station.isActive);
    const nearest = stations
      .map((station) => {
        const distance = distanceKm(latitude, longitude, station.latitude, station.longitude);
        return {
          ...station,
          distanceKm: Math.round(distance * 10) / 10,
          withinResponseRadius: distance <= station.responseRadiusKm,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return nearest || null;
  },

  listNotifications(): NotificationLogRecord[] {
    return readStore().notifications;
  },

  createNotification(input: Partial<NotificationLogRecord>): NotificationLogRecord {
    const data = readStore();
    const notification: NotificationLogRecord = {
      id: randomUUID(),
      stationId: input.stationId || null,
      reportId: input.reportId || null,
      title: String(input.title || "Crime report notification"),
      message: String(input.message || ""),
      channel: (input.channel || "console") as NotificationChannel,
      recipient: String(input.recipient || "command"),
      status: "sent",
      createdAt: now(),
    };
    data.notifications.unshift(notification);
    data.notifications = data.notifications.slice(0, 200);
    writeStore(data);
    console.log("Police command notification:", notification);
    return notification;
  },
};
