/**
 * UI-ONLY demo store for the admin + rider consoles.
 *
 * There is deliberately NO database / backend call in here. Everything lives in
 * memory (mirrored to localStorage so refreshes keep your edits) so the owner can
 * click through the whole experience. Swap these functions for real API calls
 * later — the components only ever talk to this module.
 */
import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ types */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "kitchen"
  | "packed"
  | "onway"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "verified" | "failed" | "refunded";
export type PaymentMethod = "jazzcash" | "easypaisa" | "card" | "cod";
export type Priority = "normal" | "rush" | "vip";

export type OrderItem = { name: string; size: string; qty: number; price: number };

export type OrderEvent = { at: number; label: string; note?: string; actor: string };

export type Order = {
  id: string;
  code: string;
  createdAt: number;
  customer: { id: string; name: string; phone: string; email: string };
  address: { street: string; area: string; city: string; notes?: string };
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    reference: string | null;
    paidAt: number | null;
    amountPaid: number;
    verifiedBy: string | null;
  };
  status: OrderStatus;
  priority: Priority;
  etaMinutes: number;
  riderId: string | null;
  acceptedAt: number | null;
  deliveredAt: number | null;
  notes: string;
  rating: number | null;
  timeline: OrderEvent[];
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  email: string;
  bike: string;
  plate: string;
  cnic: string;
  zone: string;
  photo: string | null;
  status: "online" | "offline" | "busy";
  verified: boolean;
  rating: number;
  deliveries: number;
  earnings: number;
  joinedAt: number;
  location: { lat: number; lng: number; at: number; sharing: boolean } | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  joinedAt: number;
  tier: "new" | "regular" | "gold";
};

export type AdminState = {
  orders: Order[];
  riders: Rider[];
  customers: Customer[];
  /** Which rider is "signed in" on the rider console (demo only). */
  currentRiderId: string;
};

/* -------------------------------------------------------------- constants */

export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "kitchen",
  "packed",
  "onway",
  "delivered",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting review",
  confirmed: "Confirmed",
  kitchen: "In kitchen",
  packed: "Packed",
  onway: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
  card: "Card",
  cod: "Cash on delivery",
};

export const PAY_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Unverified",
  verified: "Verified",
  failed: "Failed",
  refunded: "Refunded",
};

export const money = (value: number) =>
  `Rs ${Math.round(Number(value) || 0).toLocaleString("en-PK")}`;

export const timeAgo = (ms: number) => {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export const dateTime = (ms: number) =>
  new Date(ms).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ------------------------------------------------------------------- seed */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const DISHES: { name: string; size: string; price: number }[] = [
  { name: "Kennedy Inferno Pizza", size: "Large", price: 1850 },
  { name: "Malai Boti Platter", size: "Full", price: 1450 },
  { name: "Charcoal Seekh Kebab", size: "10 pcs", price: 1250 },
  { name: "Devil's Chicken Wings", size: "12 pcs", price: 990 },
  { name: "Moon Grill Zinger Deal", size: "Solo", price: 780 },
  { name: "Smoked Beef Ribs", size: "Half", price: 2100 },
];

const NAMES = [
  ["Bilal Ahmed", "0300 4412 889"],
  ["Ayesha Khan", "0321 7788 210"],
  ["Hamza Sheikh", "0333 9080 771"],
  ["Zara Iqbal", "0345 1122 908"],
  ["Usman Tariq", "0301 5566 340"],
  ["Nimra Yousaf", "0312 8899 120"],
  ["Rehan Malik", "0308 4455 671"],
  ["Fatima Noor", "0332 2211 004"],
  ["Danish Raza", "0347 6677 889"],
  ["Sana Aslam", "0305 3344 556"],
];

const AREAS = ["Kacheri Road", "Model Town", "Zafarwal Road", "Circular Road", "Muradpur"];

function seedRiders(): Rider[] {
  const base: Array<Partial<Rider> & { name: string; phone: string; bike: string }> = [
    {
      name: "Adeel Hussain",
      phone: "0300 1122 334",
      bike: "Honda CD 70",
      plate: "NRL-4412",
      zone: "Kacheri Road",
      status: "online",
      verified: true,
      rating: 4.9,
      deliveries: 412,
      earnings: 74800,
    },
    {
      name: "Shahid Mehmood",
      phone: "0321 9988 776",
      bike: "Suzuki GD 110",
      plate: "NRL-7781",
      zone: "Model Town",
      status: "busy",
      verified: true,
      rating: 4.7,
      deliveries: 288,
      earnings: 52100,
    },
    {
      name: "Kamran Ali",
      phone: "0333 5544 221",
      bike: "Honda Pridor",
      plate: "NRL-2290",
      zone: "Zafarwal Road",
      status: "online",
      verified: true,
      rating: 4.5,
      deliveries: 157,
      earnings: 31200,
    },
    {
      name: "Waqas Nadeem",
      phone: "0345 6677 112",
      bike: "Yamaha YBR",
      plate: "NRL-9034",
      zone: "Circular Road",
      status: "offline",
      verified: false,
      rating: 0,
      deliveries: 0,
      earnings: 0,
    },
  ];

  return base.map((r, i) => ({
    id: `rider-${i + 1}`,
    email: `${r.name.split(" ")[0]!.toLowerCase()}@moongrill.pk`,
    cnic: `34603-${1000000 + i * 7771}-${i + 1}`,
    photo: null,
    joinedAt: Date.now() - (90 - i * 12) * DAY,
    location:
      r.status === "offline"
        ? null
        : {
            lat: 32.1015 + i * 0.004,
            lng: 74.8735 + i * 0.005,
            at: Date.now() - (i + 1) * MIN,
            sharing: true,
          },
    status: "online",
    verified: true,
    rating: 4.6,
    deliveries: 100,
    earnings: 20000,
    plate: "NRL-0000",
    zone: "Narowal",
    ...r,
  })) as Rider[];
}

function seedCustomers(): Customer[] {
  return NAMES.map(([name, phone], i) => ({
    id: `cust-${i + 1}`,
    name: name!,
    phone: phone!,
    email: `${name!.split(" ")[0]!.toLowerCase()}${i}@gmail.com`,
    city: "Narowal",
    area: AREAS[i % AREAS.length]!,
    joinedAt: Date.now() - (200 - i * 9) * DAY,
    tier: i < 2 ? "gold" : i < 6 ? "regular" : "new",
  }));
}

function seedOrders(riders: Rider[], customers: Customer[]): Order[] {
  const methods: PaymentMethod[] = ["jazzcash", "easypaisa", "card", "cod"];
  const orders: Order[] = [];

  for (let i = 0; i < 46; i++) {
    const customer = customers[i % customers.length]!;
    const ageMinutes = i < 8 ? 6 + i * 9 : 240 + i * 430;
    const createdAt = Date.now() - ageMinutes * MIN;
    const items: OrderItem[] = Array.from({ length: (i % 3) + 1 }, (_, k) => {
      const dish = DISHES[(i + k) % DISHES.length]!;
      return { name: dish.name, size: dish.size, qty: ((i + k) % 2) + 1, price: dish.price };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const delivery = i % 4 === 3 ? 150 : 99;
    const discount = i % 7 === 0 ? 200 : 0;
    const total = subtotal + delivery - discount;
    const method = methods[i % methods.length]!;

    const status: OrderStatus =
      i < 2
        ? "pending"
        : i < 4
          ? "confirmed"
          : i === 4
            ? "kitchen"
            : i === 5
              ? "packed"
              : i < 8
                ? "onway"
                : i % 17 === 0
                  ? "cancelled"
                  : "delivered";

    const payStatus: PaymentStatus =
      status === "cancelled"
        ? i % 2
          ? "refunded"
          : "failed"
        : status === "pending"
          ? "pending"
          : method === "cod" && status !== "delivered"
            ? "pending"
            : "verified";

    const riderId =
      status === "onway" || status === "delivered" ? riders[i % 3]!.id : null;

    const timeline: OrderEvent[] = [
      { at: createdAt, label: "Order placed", actor: customer.name },
    ];
    if (status !== "pending")
      timeline.push({ at: createdAt + 3 * MIN, label: "Order confirmed", actor: "Owner" });
    if (payStatus === "verified")
      timeline.push({
        at: createdAt + 4 * MIN,
        label: "Payment verified",
        note: PAYMENT_LABEL[method],
        actor: "Owner",
      });
    if (riderId)
      timeline.push({
        at: createdAt + 12 * MIN,
        label: "Assigned to rider",
        note: riders.find((r) => r.id === riderId)?.name,
        actor: "Owner",
      });
    if (status === "delivered")
      timeline.push({ at: createdAt + 38 * MIN, label: "Delivered", actor: "Rider" });
    if (status === "cancelled")
      timeline.push({ at: createdAt + 9 * MIN, label: "Order cancelled", actor: "Owner" });

    orders.push({
      id: `ord-${i + 1}`,
      code: `KMG-${4200 + i}`,
      createdAt,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      address: {
        street: `House ${12 + i}, Street ${(i % 9) + 1}`,
        area: customer.area,
        city: "Narowal",
        notes: i % 5 === 0 ? "Ring the bell twice, extra spicy dip please." : undefined,
      },
      items,
      subtotal,
      delivery,
      discount,
      total,
      payment: {
        method,
        status: payStatus,
        reference:
          method === "cod" ? null : `${method.slice(0, 2).toUpperCase()}${900000 + i * 137}`,
        paidAt: payStatus === "verified" ? createdAt + 4 * MIN : null,
        amountPaid: payStatus === "verified" ? total : 0,
        verifiedBy: payStatus === "verified" ? "Owner" : null,
      },
      status,
      priority: i % 11 === 0 ? "vip" : i % 6 === 0 ? "rush" : "normal",
      etaMinutes: 35 + (i % 4) * 5,
      riderId,
      acceptedAt: riderId ? createdAt + 14 * MIN : null,
      deliveredAt: status === "delivered" ? createdAt + 38 * MIN : null,
      notes: "",
      rating: status === "delivered" ? [5, 4, 5, 3, 5][i % 5]! : null,
      timeline,
    });
  }
  return orders;
}

function seed(): AdminState {
  const riders = seedRiders();
  const customers = seedCustomers();
  return { riders, customers, orders: seedOrders(riders, customers), currentRiderId: "rider-1" };
}

/* ------------------------------------------------------------------ store */

const KEY = "kmg.admin.demo.v1";
let state: AdminState = seed();
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...(JSON.parse(raw) as AdminState) };
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  listener();
  return () => listeners.delete(listener);
}

const serverSnapshot = state;

export function useAdmin(): AdminState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot,
  );
}

function update(next: Partial<AdminState>) {
  state = { ...state, ...next };
  emit();
}

function patchOrder(id: string, patch: (order: Order) => Order) {
  update({ orders: state.orders.map((o) => (o.id === id ? patch(o) : o)) });
}

function logged(order: Order, event: Omit<OrderEvent, "at">): Order {
  return { ...order, timeline: [...order.timeline, { ...event, at: Date.now() }] };
}

/* -------------------------------------------------------------- mutations */

export function resetDemoData() {
  state = seed();
  emit();
}

export function setOrderStatus(id: string, status: OrderStatus, note?: string) {
  patchOrder(id, (o) =>
    logged(
      {
        ...o,
        status,
        deliveredAt: status === "delivered" ? Date.now() : o.deliveredAt,
        payment:
          status === "delivered" && o.payment.method === "cod" && o.payment.status === "pending"
            ? {
                ...o.payment,
                status: "verified",
                amountPaid: o.total,
                paidAt: Date.now(),
                verifiedBy: "Rider (cash)",
              }
            : o.payment,
      },
      { label: `Status → ${STATUS_LABEL[status]}`, note, actor: "Owner" },
    ),
  );
}

export function setPriority(id: string, priority: Priority) {
  patchOrder(id, (o) =>
    logged({ ...o, priority }, { label: `Priority → ${priority}`, actor: "Owner" }),
  );
}

export function setEta(id: string, etaMinutes: number) {
  patchOrder(id, (o) =>
    logged({ ...o, etaMinutes }, { label: `ETA → ${etaMinutes} min`, actor: "Owner" }),
  );
}

export function setOrderNotes(id: string, notes: string) {
  patchOrder(id, (o) => ({ ...o, notes }));
}

export function assignRider(id: string, riderId: string | null) {
  const rider = state.riders.find((r) => r.id === riderId);
  patchOrder(id, (o) =>
    logged(
      {
        ...o,
        riderId: riderId ?? null,
        acceptedAt: null,
        status: riderId && o.status === "packed" ? "onway" : o.status,
      },
      {
        label: riderId ? "Assigned to rider" : "Rider unassigned",
        note: rider?.name,
        actor: "Owner",
      },
    ),
  );
}

export function verifyPayment(
  id: string,
  input: { status: PaymentStatus; reference?: string | null; amountPaid?: number; by?: string },
) {
  patchOrder(id, (o) =>
    logged(
      {
        ...o,
        payment: {
          ...o.payment,
          status: input.status,
          reference: input.reference ?? o.payment.reference,
          amountPaid:
            input.amountPaid ?? (input.status === "verified" ? o.total : o.payment.amountPaid),
          paidAt: input.status === "verified" ? Date.now() : o.payment.paidAt,
          verifiedBy: input.by ?? "Owner",
        },
      },
      {
        label: `Payment → ${PAY_STATUS_LABEL[input.status]}`,
        note: input.reference ?? undefined,
        actor: input.by ?? "Owner",
      },
    ),
  );
}

export function deleteOrder(id: string) {
  update({ orders: state.orders.filter((o) => o.id !== id) });
}

export function saveRider(input: Partial<Rider> & { name: string; phone: string }) {
  if (input.id && state.riders.some((r) => r.id === input.id)) {
    update({
      riders: state.riders.map((r) => (r.id === input.id ? { ...r, ...input } : r)),
    });
    return input.id;
  }
  const id = `rider-${Date.now()}`;
  const rider: Rider = {
    id,
    name: input.name,
    phone: input.phone,
    email: input.email ?? "",
    bike: input.bike ?? "",
    plate: input.plate ?? "",
    cnic: input.cnic ?? "",
    zone: input.zone ?? "Narowal",
    photo: input.photo ?? null,
    status: input.status ?? "offline",
    verified: input.verified ?? false,
    rating: 0,
    deliveries: 0,
    earnings: 0,
    joinedAt: Date.now(),
    location: null,
  };
  update({ riders: [...state.riders, rider] });
  return id;
}

export function deleteRider(id: string) {
  update({
    riders: state.riders.filter((r) => r.id !== id),
    orders: state.orders.map((o) => (o.riderId === id ? { ...o, riderId: null } : o)),
  });
}

export function setRiderStatus(id: string, status: Rider["status"]) {
  update({ riders: state.riders.map((r) => (r.id === id ? { ...r, status } : r)) });
}

export function setRiderVerified(id: string, verified: boolean) {
  update({ riders: state.riders.map((r) => (r.id === id ? { ...r, verified } : r)) });
}

export function setRiderLocation(
  id: string,
  location: { lat: number; lng: number } | null,
  sharing = true,
) {
  update({
    riders: state.riders.map((r) =>
      r.id === id
        ? { ...r, location: location ? { ...location, at: Date.now(), sharing } : null }
        : r,
    ),
  });
}

export function setCurrentRider(id: string) {
  update({ currentRiderId: id });
}

export function riderAcceptOrder(orderId: string, riderId: string) {
  const rider = state.riders.find((r) => r.id === riderId);
  patchOrder(orderId, (o) =>
    logged(
      { ...o, riderId, acceptedAt: Date.now(), status: o.status === "packed" ? "onway" : o.status },
      { label: "Rider accepted the order", note: rider?.name, actor: rider?.name ?? "Rider" },
    ),
  );
}

export function riderRejectOrder(orderId: string, riderId: string, reason: string) {
  const rider = state.riders.find((r) => r.id === riderId);
  patchOrder(orderId, (o) =>
    logged(
      { ...o, riderId: null, acceptedAt: null },
      { label: "Rider declined the order", note: reason, actor: rider?.name ?? "Rider" },
    ),
  );
}

export function riderCompleteOrder(orderId: string, riderId: string) {
  const rider = state.riders.find((r) => r.id === riderId);
  patchOrder(orderId, (o) =>
    logged(
      {
        ...o,
        status: "delivered",
        deliveredAt: Date.now(),
        payment:
          o.payment.method === "cod" && o.payment.status === "pending"
            ? {
                ...o.payment,
                status: "verified",
                amountPaid: o.total,
                paidAt: Date.now(),
                verifiedBy: `${rider?.name ?? "Rider"} (cash)`,
              }
            : o.payment,
      },
      { label: "Marked delivered", actor: rider?.name ?? "Rider" },
    ),
  );
  update({
    riders: state.riders.map((r) =>
      r.id === riderId
        ? { ...r, deliveries: r.deliveries + 1, earnings: r.earnings + 180, status: "online" }
        : r,
    ),
  });
}

/* ----------------------------------------------------------------- derived */

export function orderStats(orders: Order[]) {
  const live = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  );
  const delivered = orders.filter((o) => o.status === "delivered");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const verified = orders.filter((o) => o.payment.status === "verified");
  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const today = orders.filter((o) => o.createdAt >= startOfDay);

  return {
    total: orders.length,
    live: live.length,
    delivered: delivered.length,
    cancelled: cancelled.length,
    unassigned: live.filter((o) => !o.riderId).length,
    unverified: orders.filter(
      (o) => o.payment.status === "pending" && o.status !== "cancelled",
    ).length,
    revenue: verified.reduce((s, o) => s + o.payment.amountPaid, 0),
    pending: orders
      .filter((o) => o.payment.status === "pending" && o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0),
    todayOrders: today.length,
    todayRevenue: today.reduce((s, o) => s + o.total, 0),
    avgOrder: orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
    avgRating:
      delivered.filter((o) => o.rating).length > 0
        ? delivered.reduce((s, o) => s + (o.rating ?? 0), 0) /
          delivered.filter((o) => o.rating).length
        : 0,
  };
}

export function revenueSeries(orders: Order[], days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1 - i));
    const end = new Date(start).setDate(start.getDate() + 1);
    const rows = orders.filter((o) => o.createdAt >= start.getTime() && o.createdAt < end);
    return {
      day: start.toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
      orders: rows.length,
      revenue: rows.reduce((s, o) => s + o.total, 0),
      delivered: rows.filter((o) => o.status === "delivered").length,
    };
  });
}

export function hourlySeries(orders: Order[]) {
  const slots = [11, 13, 15, 17, 19, 21, 23];
  return slots.map((h) => {
    const rows = orders.filter((o) => new Date(o.createdAt).getHours() === h);
    return {
      hour: `${h}:00`,
      orders: rows.length || ((h % 5) + 2),
      revenue: rows.reduce((s, o) => s + o.total, 0) || ((h % 5) + 2) * 1400,
    };
  });
}

export function statusBreakdown(orders: Order[]) {
  return STATUS_FLOW.concat("cancelled").map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: orders.filter((o) => o.status === status).length,
  }));
}

export function paymentBreakdown(orders: Order[]) {
  return (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((method) => {
    const rows = orders.filter((o) => o.payment.method === method);
    return {
      method,
      label: PAYMENT_LABEL[method],
      count: rows.length,
      amount: rows.reduce((s, o) => s + o.total, 0),
    };
  });
}

export function topDishes(orders: Order[]) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders)
    for (const it of o.items) {
      const row = map.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
      row.qty += it.qty;
      row.revenue += it.qty * it.price;
      map.set(it.name, row);
    }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function riderLoad(state: AdminState) {
  return state.riders.map((r) => {
    const mine = state.orders.filter((o) => o.riderId === r.id);
    return {
      rider: r,
      active: mine.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
      delivered: mine.filter((o) => o.status === "delivered").length,
      revenue: mine
        .filter((o) => o.status === "delivered")
        .reduce((s, o) => s + o.total, 0),
    };
  });
}

export function customerRows(state: AdminState) {
  return state.customers.map((c) => {
    const mine = state.orders.filter((o) => o.customer.id === c.id);
    const spent = mine
      .filter((o) => o.payment.status === "verified")
      .reduce((s, o) => s + o.payment.amountPaid, 0);
    return {
      customer: c,
      orders: mine.length,
      spent,
      lastOrder: mine.length ? Math.max(...mine.map((o) => o.createdAt)) : null,
      cancelled: mine.filter((o) => o.status === "cancelled").length,
    };
  });
}

/* ------------------------------------------------ storefront -> console feed */

export function ingestStorefrontOrder(input: {
  code: string;
  customerName: string;
  phone: string;
  address: { street?: string; area?: string; city?: string; notes?: string };
  items: OrderItem[];
  total: number;
  method: PaymentMethod | string;
}) {
  const now = Date.now();
  const order: Order = {
    id: `ord-${now}`,
    code: input.code,
    createdAt: now,
    customer: {
      id: `cust-web-${now}`,
      name: input.customerName,
      phone: input.phone,
      email: "",
    },
    address: {
      street: input.address.street ?? "",
      area: input.address.area ?? "",
      city: input.address.city ?? "Narowal",
      notes: input.address.notes,
    },
    items: input.items,
    subtotal: input.items.reduce((s, it) => s + it.price * it.qty, 0),
    delivery: 0,
    discount: 0,
    total: input.total,
    payment: {
      method: (["jazzcash", "easypaisa", "card", "cod"] as string[]).includes(String(input.method))
        ? (input.method as PaymentMethod)
        : "cod",
      status: "pending",
      reference: null,
      paidAt: null,
      amountPaid: 0,
      verifiedBy: null,
    },
    status: "pending",
    priority: "normal",
    etaMinutes: 35,
    riderId: null,
    acceptedAt: null,
    deliveredAt: null,
    notes: "Placed from the website",
    rating: null,
    timeline: [{ at: now, label: "Order placed", actor: input.customerName }],
  };
  update({ orders: [order, ...state.orders] });
  return order.id;
}

/* ------------------------------------------------------------ rider derived */

export function riderQueue(state: AdminState, riderId: string) {
  const mine = state.orders.filter((o) => o.riderId === riderId);
  return {
    offered: mine.filter((o) => !o.acceptedAt && !["delivered", "cancelled"].includes(o.status)),
    active: mine.filter(
      (o) => o.acceptedAt && !["delivered", "cancelled"].includes(o.status),
    ),
    completed: mine.filter((o) => o.status === "delivered"),
    /** Unassigned jobs any verified rider can grab. */
    pool: state.orders.filter(
      (o) => !o.riderId && ["confirmed", "kitchen", "packed"].includes(o.status),
    ),
  };
}

export function riderDaySeries(orders: Order[], riderId: string, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1 - i));
    const end = new Date(start).setDate(start.getDate() + 1);
    const rows = orders.filter(
      (o) =>
        o.riderId === riderId &&
        o.status === "delivered" &&
        (o.deliveredAt ?? o.createdAt) >= start.getTime() &&
        (o.deliveredAt ?? o.createdAt) < end,
    );
    return {
      day: start.toLocaleDateString("en-PK", { weekday: "short" }),
      drops: rows.length,
      earnings: rows.length * 180,
      cash: rows
        .filter((o) => o.payment.method === "cod")
        .reduce((s, o) => s + o.total, 0),
    };
  });
}
