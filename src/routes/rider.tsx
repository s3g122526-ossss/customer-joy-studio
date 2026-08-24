import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Bike, ClipboardCheck, LayoutDashboard, MapPin, Store, Wallet, IdCard } from "lucide-react";

import { ConsoleShell } from "@/components/admin/console-shell";
import { money, riderQueue, setRiderStatus, useAdmin } from "@/lib/admin-store";
import { captureRiderLocation } from "@/lib/rider-location";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rider")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rider Console — Kennedy Moon Grill" },
      {
        name: "description",
        content:
          "Delivery partner console: build your rider profile, accept assigned orders, share live location and track earnings for Kennedy Moon Grill.",
      },
      { property: "og:title", content: "Rider Console — Kennedy Moon Grill" },
      {
        property: "og:description",
        content: "Accept orders, share live location and track your delivery earnings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderLayout,
});

const NAV = [
  { to: "/rider", label: "Shift", icon: LayoutDashboard, exact: true },
  { to: "/rider/jobs", label: "Jobs", icon: ClipboardCheck },
  { to: "/rider/earnings", label: "Earnings", icon: Wallet },
  { to: "/rider/profile", label: "Profile", icon: IdCard },
] as const;

function RiderLayout() {
  const state = useAdmin();
  const rider = state.riders.find((r) => r.id === state.currentRiderId) ?? state.riders[0];
  const queue = rider ? riderQueue(state, rider.id) : null;

  return (
    <ConsoleShell
      brand="Moon Grill"
      title="Rider Console"
      nav={NAV}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-lux/40 bg-lux/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-lux">
          <Bike className="h-3 w-3" /> Delivery partner
        </span>
      }
      sidebar={
        rider ? (
          <div className="panel-lux p-4">
            <p className="text-sm font-black text-frost">{rider.name}</p>
            <p className="text-[11px] text-slate-dim">{rider.zone} zone</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                  rider.status === "online"
                    ? "border-jade/45 bg-jade/12 text-jade"
                    : rider.status === "busy"
                      ? "border-amber-lux/45 bg-amber-lux/12 text-amber-lux"
                      : "border-line text-slate-dim",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {rider.status}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                  rider.verified
                    ? "border-lux/45 bg-lux/10 text-lux"
                    : "border-ruby/45 bg-ruby/10 text-ruby",
                )}
              >
                {rider.verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <button
              onClick={() =>
                setRiderStatus(rider.id, rider.status === "online" ? "offline" : "online")
              }
              className="btn-ghost-lux mt-3 w-full"
            >
              {rider.status === "online" ? "Go offline" : "Go online"}
            </button>
            <button
              onClick={() => captureRiderLocation(rider.id)}
              className={cn("btn-lux mt-2 w-full", !rider.location?.sharing && "pulse-ring")}
            >
              <MapPin className="h-3.5 w-3.5" /> Share location
            </button>
            {rider.location?.sharing ? (
              <p className="mt-2 text-center text-[10px] text-jade">
                Sharing · {rider.location.lat.toFixed(4)}, {rider.location.lng.toFixed(4)}
              </p>
            ) : (
              <p className="mt-2 text-center text-[10px] text-ruby">
                Location off · required to accept jobs
              </p>
            )}
          </div>
        ) : null
      }
      footer={
        <>
          {queue ? (
            <div className="panel-lux mb-2 p-4 text-xs">
              <p className="eyebrow">Right now</p>
              <p className="mt-2 flex items-center justify-between">
                <span className="text-slate-dim">New offers</span>
                <span className="num-lux text-lg text-lux">{queue.offered.length}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-dim">Active runs</span>
                <span className="num-lux text-lg text-azure">{queue.active.length}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-dim">Open pool</span>
                <span className="num-lux text-lg text-jade">{queue.pool.length}</span>
              </p>
              <p className="mt-2 flex items-center justify-between border-t border-lux/10 pt-2">
                <span className="text-slate-dim">Earnings</span>
                <span className="font-bold text-frost">{money(rider?.earnings ?? 0)}</span>
              </p>
            </div>
          ) : null}
          <Link to="/admin" className="btn-ghost-lux w-full">
            Owner console
          </Link>
          <Link to="/" className="btn-ghost-lux w-full">
            <Store className="h-3.5 w-3.5" /> Storefront
          </Link>
        </>
      }
    >
      <Outlet />
    </ConsoleShell>
  );
}
