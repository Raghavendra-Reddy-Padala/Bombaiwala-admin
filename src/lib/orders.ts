// Normalizes the two order shapes from /orders Firestore collection
// into a single canonical type for the dashboard.

export type OrderStatus =
  | "pending"
  | "preparing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled";

export type OrderSource = "website" | "whatsapp";

export interface NormalizedOrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface NormalizedOrder {
  id: string; // firestore doc id
  orderId: string; // display id (BW-... or doc id)
  source: OrderSource;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  items: NormalizedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  address?: string;
  location?: { lat: number; lng: number; mapsUrl?: string };
  distanceKm?: number;
  deliveryType?: string;
  createdAt: Date;
  raw: Record<string, unknown>;
}

function toDate(v: unknown): Date {
  if (!v) return new Date();
  if (typeof v === "string") return new Date(v);
  if (typeof v === "object" && v !== null) {
    const o = v as { toDate?: () => Date; seconds?: number };
    if (typeof o.toDate === "function") return o.toDate();
    if (typeof o.seconds === "number") return new Date(o.seconds * 1000);
  }
  return new Date();
}

export function normalizeOrder(id: string, raw: Record<string, unknown>): NormalizedOrder {
  const isWebsite = !!(raw.customer && typeof raw.customer === "object");
  const status = (raw.status as OrderStatus) || "pending";
  const createdAt = toDate(raw.createdAt);

  if (isWebsite) {
    const customer = raw.customer as { name?: string; phone?: string };
    const items = Array.isArray(raw.items)
      ? (raw.items as Array<Record<string, unknown>>).map((it) => ({
          name: String(it.name ?? ""),
          qty: Number(it.qty ?? 0),
          unitPrice: Number(it.unitPrice ?? 0),
          lineTotal: Number(it.lineTotal ?? Number(it.unitPrice ?? 0) * Number(it.qty ?? 0)),
        }))
      : [];
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const total = Number(raw.total ?? subtotal);
    const location = raw.location as
      | { lat: number; lng: number; mapsUrl?: string }
      | undefined;
    return {
      id,
      orderId: String(raw.orderId ?? id),
      source: "website",
      status,
      customerName: String(customer?.name ?? "—"),
      customerPhone: String(customer?.phone ?? ""),
      items,
      subtotal,
      deliveryFee: Math.max(0, total - subtotal),
      total,
      notes: raw.notes as string | undefined,
      address: raw.address as string | undefined,
      location,
      createdAt,
      raw,
    };
  }

  // WhatsApp bot shape
  const items = Array.isArray(raw.items)
    ? (raw.items as Array<Record<string, unknown>>).map((it) => ({
        name: String(it.name ?? ""),
        qty: Number(it.qty ?? 0),
        unitPrice: Number(it.price ?? 0),
        lineTotal: Number(it.total ?? Number(it.price ?? 0) * Number(it.qty ?? 0)),
      }))
    : [];
  const subtotal = Number(raw.subtotal ?? items.reduce((s, i) => s + i.lineTotal, 0));
  const deliveryFee = Number(raw.deliveryFee ?? 0);
  const total = Number(raw.totalAmount ?? subtotal + deliveryFee);
  const location = raw.location as { lat: number; lng: number } | undefined;
  return {
    id,
    orderId: String(raw.orderId ?? id),
    source: "whatsapp",
    status,
    customerName: String(raw.customerName ?? "—"),
    customerPhone: String(raw.customerPhone ?? ""),
    items,
    subtotal,
    deliveryFee,
    total,
    notes: raw.notes as string | undefined,
    address: raw.address as string | undefined,
    location: location
      ? {
          lat: location.lat,
          lng: location.lng,
          mapsUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        }
      : undefined,
    distanceKm: raw.distanceKm as number | undefined,
    deliveryType: raw.deliveryType as string | undefined,
    createdAt,
    raw,
  };
}

export const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  preparing: "bg-blue-100 text-blue-900 border-blue-300",
  "out-for-delivery": "bg-purple-100 text-purple-900 border-purple-300",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  cancelled: "bg-rose-100 text-rose-900 border-rose-300",
};
