import type { Dish } from "./menu";

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  notes?: string;
};

export type PaymentMethod = "jazzcash" | "easypaisa" | "cod";

export const PAYMENTS: {
  id: PaymentMethod;
  label: string;
  note: string;
  fee: number;
}[] = [
  { id: "jazzcash", label: "JazzCash", note: "Instant mobile wallet", fee: 0 },
  { id: "easypaisa", label: "EasyPaisa", note: "Instant mobile wallet", fee: 0 },
  { id: "cod", label: "Cash on Delivery", note: "Pay the rider at your door", fee: 150 },
];

export type OrderStatusKey = "confirmed" | "kitchen" | "packed" | "onway" | "delivered";

export const ORDER_STAGES: { key: OrderStatusKey; label: string; hint: string }[] = [
  { key: "confirmed", label: "Order Confirmed", hint: "Payment verified, ticket printed" },
  { key: "kitchen", label: "In the Kitchen", hint: "Charcoal fired, dish cooking" },
  { key: "packed", label: "Packed & Sealed", hint: "Boxed hot with free dips" },
  { key: "onway", label: "Rider On The Way", hint: "Live tracking active" },
  { key: "delivered", label: "Delivered", hint: "Enjoy your meal!" },
];

export type Order = {
  id: string;
  createdAt: number;
  dishName: string;
  dishImage: string;
  size: string;
  qty: number;
  total: number;
  payment: PaymentMethod;
  address: Address;
  rider: { name: string; phone: string; bike: string };
};

const ADDR_KEY = "kennedy.addresses";

export function loadAddresses(): Address[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ADDR_KEY) ?? "[]") as Address[];
  } catch {
    return [];
  }
}

export function saveAddress(address: Address) {
  const all = [...loadAddresses().filter((a) => a.id !== address.id), address];
  localStorage.setItem(ADDR_KEY, JSON.stringify(all));
  return all;
}

export const RIDERS = [
  { name: "Bilal Ahmed", phone: "0300-4471902", bike: "Honda CD-70 · NRL-4471" },
  { name: "Usman Tariq", phone: "0301-8823410", bike: "Suzuki GD-110 · NRL-8823" },
  { name: "Hamza Riaz", phone: "0345-6610233", bike: "Honda CG-125 · NRL-6610" },
];

export function buildOrder(input: {
  dish: Dish;
  size: string;
  qty: number;
  total: number;
  payment: PaymentMethod;
  address: Address;
}): Order {
  return {
    id: `MG-${Math.floor(100000 + Math.random() * 899999)}`,
    createdAt: Date.now(),
    dishName: input.dish.name,
    dishImage: input.dish.image,
    size: input.size,
    qty: input.qty,
    total: input.total,
    payment: input.payment,
    address: input.address,
    rider: RIDERS[Math.floor(Math.random() * RIDERS.length)]!,
  };
}
