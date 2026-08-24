/**
 * Live order tracking hook.
 *
 * Today it ticks a local demo simulation (`src/lib/tracking.ts`) every second and
 * mirrors the derived status back into the local account store, so the profile,
 * notifications and owner console all agree.
 *
 * DJANGO SWAP: replace the interval with polling
 * `GET /api/v1/orders/{code}/tracking/` (or a Channels WS subscription) and set
 * the returned `TrackingSnapshot` into state. The component API stays identical.
 */
import { useEffect, useRef, useState } from "react";

import { updateOrderStatus } from "@/lib/account";
import type { OrderStatusKey } from "@/lib/orders";
import { simulateTracking, type LatLng, type TrackingSnapshot } from "@/lib/tracking";

export function useOrderTracking(
  order:
    | {
        id: string;
        order_code: string;
        created_at: string;
        status: OrderStatusKey;
      }
    | null
    | undefined,
  target?: LatLng | null,
  options?: { onStatusChange?: (status: OrderStatusKey) => void },
): TrackingSnapshot | null {
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const lastStatus = useRef<OrderStatusKey | null>(null);
  const onStatusChange = options?.onStatusChange;

  useEffect(() => {
    if (!order) {
      setSnapshot(null);
      lastStatus.current = null;
      return;
    }

    const tick = () => {
      const next = simulateTracking({
        orderCode: order.order_code,
        createdAt: order.created_at,
        status: order.status,
        target: target ?? null,
      });
      setSnapshot(next);

      if (next.status !== (lastStatus.current ?? order.status)) {
        lastStatus.current = next.status;
        void updateOrderStatus(order.id, next.status);
        onStatusChange?.(next.status);
      } else if (lastStatus.current === null) {
        lastStatus.current = next.status;
        if (next.status !== order.status) void updateOrderStatus(order.id, next.status);
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [order?.id, order?.order_code, order?.created_at, order?.status, target?.lat, target?.lng, onStatusChange]);

  return snapshot;
}
