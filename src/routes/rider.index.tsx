import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Navigation,
  Package,
  Phone,
  Star,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ensureRiderLocation } from "@/lib/rider-location";
import {
  CHART,
  ColumnChart,
  EmptyRow,
  GaugeChart,
  GhostButton,
  GoldButton,
  Money,
  Panel,
  PaymentBadge,
  PriorityTag,
  SectionTitle,
  StatCard,
  StatusBadge,
  TrendLines,
} from "@/components/admin/bits";
import { TrackMap } from "@/components/kennedy/TrackMap";
import {
  dateTime,
  money,
  PAYMENT_LABEL,
  riderAcceptOrder,
  riderCompleteOrder,
  riderDaySeries,
  riderQueue,
  riderRejectOrder,
  setOrderStatus,
  timeAgo,
  useAdmin,
  type Order,
  type Rider,
} from "@/lib/admin-store";

export const Route = createFileRoute("/rider/")({
  head: () => ({
    meta: [
      { title: "My Shift — Kennedy Rider Console" },
      {
        name: "description",
        content:
          "Rider shift board: accept assigned orders, follow the live delivery map, collect cash and close runs.",
      },
      { property: "og:title", content: "My Shift — Kennedy Rider Console" },
      {
        property: "og:description",
        content: "Accept orders, follow the live map and close deliveries.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderShift,
});

function RiderShift() {
  const state = useAdmin();
  const rider = state.riders.find((r) => r.id === state.currentRiderId) ?? state.riders[0];

  if (!rider) {
    return (
      <EmptyRow>
        No rider profile yet.{" "}
        <Link to="/rider/profile" className="text-lux underline">
          Create your profile
        </Link>
      </EmptyRow>
    );
  }

  const queue = riderQueue(state, rider.id);
  const week = riderDaySeries(state.orders, rider.id, 7);
  const today = week[week.length - 1]!;
  const activeOrder = queue.active[0] ?? null;
  const cashToDeposit = queue.completed
    .filter((o) => o.payment.method === "cod")
    .reduce((s, o) => s + o.total, 0);
  const onTime = queue.completed.filter(
    (o) => (o.deliveredAt ?? 0) - o.createdAt <= o.etaMinutes * 60_000 + 5 * 60_000,
  ).length;

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow={`${rider.zone} zone`}
        title={`Salam, ${rider.name.split(" ")[0]}`}
        subtitle="Your live shift board — new offers, the running delivery, cash in hand and today's performance."
        action={
          <div className="flex gap-2">
            <Link to="/rider/jobs" className="btn-ghost-lux">
              Open pool ({queue.pool.length})
            </Link>
            <Link to="/rider/profile" className="btn-lux">
              My profile
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Drops today"
          value={today.drops}
          hint={`${queue.completed.length} lifetime`}
          tone="gold"
          icon={<Package className="h-4 w-4" />}
          series={week.map((w) => w.drops)}
        />
        <StatCard
          label="Earnings today"
          value={money(today.earnings)}
          hint={`${money(rider.earnings)} total`}
          tone="good"
          icon={<Wallet className="h-4 w-4" />}
          series={week.map((w) => w.earnings)}
        />
        <StatCard
          label="Cash in hand"
          value={money(cashToDeposit)}
          hint="Deposit at the counter"
          tone="flame"
          icon={<Flame className="h-4 w-4" />}
        />
        <StatCard
          label="Rating"
          value={rider.rating ? rider.rating.toFixed(1) : "—"}
          hint={`${rider.deliveries} deliveries`}
          tone="info"
          icon={<Star className="h-4 w-4" />}
        />
      </div>

      {/* offers */}
      <Panel
        title="Assigned to you"
        subtitle="Dispatch sent these directly — accept to start the run."
      >
        {queue.offered.length === 0 ? (
          <EmptyRow>No new offers. Grab something from the open pool.</EmptyRow>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {queue.offered.map((o) => (
              <OfferCard key={o.id} order={o} rider={rider} />
            ))}
          </ul>
        )}
      </Panel>

      {/* active run */}
      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Running delivery"
          subtitle={activeOrder ? `Order ${activeOrder.code}` : "Nothing on the road right now"}
        >
          {!activeOrder ? (
            <EmptyRow>Accept an order to see the live route here.</EmptyRow>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={activeOrder.status} />
                <PaymentBadge status={activeOrder.payment.status} />
                <PriorityTag priority={activeOrder.priority} />
                <span className="ml-auto text-[11px] text-slate-dim">
                  Placed {timeAgo(activeOrder.createdAt)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line/70 bg-ink/50 p-4">
                  <p className="eyebrow">Drop to</p>
                  <p className="mt-1 text-sm font-black text-frost">{activeOrder.customer.name}</p>
                  <p className="text-xs text-mist">
                    {activeOrder.address.street}, {activeOrder.address.area}
                  </p>
                  <a
                    href={`tel:${activeOrder.customer.phone.replace(/\s/g, "")}`}
                    className="btn-ghost-lux mt-3"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call customer
                  </a>
                </div>
                <div className="rounded-2xl border border-line/70 bg-ink/50 p-4">
                  <p className="eyebrow">Collect</p>
                  <p className="num-lux mt-1 text-2xl text-lux">{money(activeOrder.total)}</p>
                  <p className="text-xs text-mist">
                    {PAYMENT_LABEL[activeOrder.payment.method]} ·{" "}
                    {activeOrder.payment.status === "verified" ? "already paid" : "collect cash"}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-dim">
                    <Clock className="h-3.5 w-3.5" /> ETA {activeOrder.etaMinutes} min
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line/70">
                <TrackMap riderName={rider.name} rideStarted />
              </div>

              <div className="flex flex-wrap gap-2">
                {activeOrder.status !== "onway" ? (
                  <GhostButton
                    onClick={() => {
                      setOrderStatus(activeOrder.id, "onway");
                      toast.success("Marked on the way");
                    }}
                  >
                    <Navigation className="h-3.5 w-3.5" /> Start ride
                  </GhostButton>
                ) : null}
                <GoldButton
                  onClick={async () => {
                    if (!(await ensureRiderLocation(rider))) return;
                    riderCompleteOrder(activeOrder.id, rider.id);
                    toast.success(`Order ${activeOrder.code} delivered`);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark delivered
                </GoldButton>
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="On-time score" subtitle="Deliveries inside the promised ETA">
            <GaugeChart
              value={onTime}
              max={Math.max(1, queue.completed.length)}
              label="On time"
              color={CHART.jade}
            />
          </Panel>
          <Panel title="This week" subtitle="Drops completed per day">
            <TrendLines
              data={week}
              xKey="day"
              height={200}
              lines={[{ key: "drops", name: "Drops", color: CHART.lux }]}
            />
          </Panel>
        </div>
      </div>

      <Panel title="Cash collected" subtitle="Cash-on-delivery totals per day">
        <ColumnChart
          data={week}
          xKey="day"
          moneyFormat
          bars={[{ key: "cash", name: "Cash", color: CHART.amber }]}
        />
      </Panel>

      <Panel title="Recent runs" subtitle="Your last completed deliveries">
        {queue.completed.length === 0 ? (
          <EmptyRow>No completed deliveries yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-line/50">
            {queue.completed
              .slice()
              .sort((a, b) => (b.deliveredAt ?? 0) - (a.deliveredAt ?? 0))
              .slice(0, 8)
              .map((o) => (
                <li key={o.id} className="row-lux flex flex-wrap items-center gap-3 px-2 py-3">
                  <span className="num-lux text-sm text-lux">{o.code}</span>
                  <span className="text-xs text-mist">{o.customer.name}</span>
                  <span className="text-[11px] text-slate-dim">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    {o.address.area}
                  </span>
                  <PaymentBadge status={o.payment.status} />
                  <span className="ml-auto text-[11px] text-slate-dim">
                    {dateTime(o.deliveredAt ?? o.createdAt)}
                  </span>
                  <Money value={o.total} className="text-frost" />
                </li>
              ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function OfferCard({ order, rider }: { order: Order; rider: Rider }) {
  const riderId = rider.id;
  return (
    <li className="rounded-2xl border border-lux/20 bg-gradient-to-br from-lux/8 to-transparent p-4">
      <div className="flex items-center gap-2">
        <span className="num-lux text-sm text-lux">{order.code}</span>
        <PriorityTag priority={order.priority} />
        <span className="ml-auto text-[11px] text-slate-dim">{timeAgo(order.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm font-black text-frost">{order.customer.name}</p>
      <p className="text-xs text-mist">
        {order.address.street}, {order.address.area}
      </p>
      <p className="mt-2 text-[11px] text-slate-dim">
        {order.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="num-lux text-lg text-frost">{money(order.total)}</span>
        <span className="text-[11px] text-slate-dim">{PAYMENT_LABEL[order.payment.method]}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <GoldButton
          className="flex-1"
          onClick={async () => {
            if (!(await ensureRiderLocation(rider))) return;
            riderAcceptOrder(order.id, riderId);
            toast.success(`Accepted ${order.code}`);
          }}
        >
          <Bike className="h-3.5 w-3.5" /> Accept
        </GoldButton>
        <GhostButton
          onClick={() => {
            riderRejectOrder(order.id, riderId, "Too far from my zone");
            toast.message(`Declined ${order.code}`);
          }}
        >
          <XCircle className="h-3.5 w-3.5" /> Decline
        </GhostButton>
      </div>
    </li>
  );
}
