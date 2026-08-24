/**
 * LOCAL-ONLY account layer.
 *
 * There is intentionally no database here — everything lives in localStorage so
 * the UI can be reviewed end to end. Replace these five functions with real API
 * calls (Django REST, etc.) later; no component imports anything else.
 */
import type { Address, OrderStatusKey, PaymentMethod } from "@/lib/orders";
import { ingestStorefrontOrder } from "@/lib/admin-store";

export type DbOrder = {
  id: string;
  order_code: string;
  dish_name: string;
  dish_image: string | null;
  size: string;
  qty: number;
  total: number;
  payment: string;
  address: Address;
  rider: { name: string; phone: string; bike: string };
  status: OrderStatusKey;
  eta_minutes: number;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  street: string | null;
  avatar_url: string | null;
};

type LocalAccount = { profile: Profile | null; orders: DbOrder[] };

const KEY = "kmg.account.local.v1";

function read(): LocalAccount {
  if (typeof window === "undefined") return { profile: null, orders: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { profile: null, orders: [] };
    return JSON.parse(raw) as LocalAccount;
  } catch {
    return { profile: null, orders: [] };
  }
}

function write(next: LocalAccount) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function fetchProfile(_userId: string): Promise<Profile | null> {
  return read().profile;
}

export async function saveProfile(input: Profile) {
  write({ ...read(), profile: input });
}

export async function fetchOrders(_userId: string): Promise<DbOrder[]> {
  return read().orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function createOrder(input: {
  userId: string;
  orderCode: string;
  dishName: string;
  dishImage: string;
  size: string;
  qty: number;
  total: number;
  payment: PaymentMethod;
  address: Address;
  rider: { name: string; phone: string; bike: string };
}) {
  const store = read();
  const order: DbOrder = {
    id: `local-${Date.now()}`,
    order_code: input.orderCode,
    dish_name: input.dishName,
    dish_image: input.dishImage,
    size: input.size,
    qty: input.qty,
    total: input.total,
    payment: input.payment,
    address: input.address,
    rider: input.rider,
    status: "confirmed",
    eta_minutes: 35,
    created_at: new Date().toISOString(),
  };
  write({ ...store, orders: [order, ...store.orders] });

  // Mirror it into the owner console so new orders land in the live queue.
  ingestStorefrontOrder({
    code: input.orderCode,
    customerName: store.profile?.full_name || input.address.name || "Walk-in guest",
    phone: store.profile?.phone || input.address.phone || "",
    address: input.address,
    items: [{ name: input.dishName, size: input.size, qty: input.qty, price: input.total }],
    total: input.total,
    method: input.payment,
  });

  return order.id;
}

export async function updateOrderStatus(orderId: string, status: OrderStatusKey) {
  const store = read();
  write({
    ...store,
    orders: store.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
  });
}
