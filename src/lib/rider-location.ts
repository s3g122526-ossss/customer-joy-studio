import { toast } from "sonner";

import { setRiderLocation, setRiderStatus, type Rider } from "@/lib/admin-store";

/**
 * Ask the browser for a fresh GPS fix and push it into the rider record.
 * Resolves true only when a real coordinate was captured.
 */
export function captureRiderLocation(riderId: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    toast.error("This device cannot share location");
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderLocation(riderId, { lat: pos.coords.latitude, lng: pos.coords.longitude }, true);
        setRiderStatus(riderId, "online");
        toast.success("Live location shared with dispatch");
        resolve(true);
      },
      () => {
        toast.error("Location permission denied — dispatch needs your live pin");
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

/**
 * Hard rule: a rider may not accept, start or close a run without an active
 * live location. Returns true when the rider is cleared to proceed.
 */
export async function ensureRiderLocation(rider: Rider | undefined): Promise<boolean> {
  if (!rider) return false;
  if (rider.location?.sharing) return true;
  toast.message("Share your live location first", {
    description: "Dispatch must see your pin before you can take a delivery.",
  });
  return captureRiderLocation(rider.id);
}

export function isSharingLocation(rider: Rider | undefined) {
  return Boolean(rider?.location?.sharing);
}
