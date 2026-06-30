import { useMemo } from "react";
import { useOrders } from "@/lib/firestore-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, isToday, startOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { STATUS_STYLES } from "@/lib/orders";

export default function DashboardPage() {
  const { orders } = useOrders(500);

  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt));
    const revToday = today.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const avg = today.length ? revToday / today.length : 0;

    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const dayOrders = orders.filter(
        (o) => startOfDay(o.createdAt).getTime() === d.getTime() && o.status !== "cancelled",
      );
      days.push({
        date: format(d, "MMM d"),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      });
    }

    const productMap = new Map<string, { qty: number; rev: number }>();
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      o.items.forEach((it) => {
        const cur = productMap.get(it.name) ?? { qty: 0, rev: 0 };
        cur.qty += it.qty;
        cur.rev += it.lineTotal;
        productMap.set(it.name, cur);
      });
    });
    const topProducts = [...productMap.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5);

    return { revToday, ordersToday: today.length, pending, avg, days, topProducts };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A live snapshot of today's activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Kpi label="Revenue today" value={`₹${stats.revToday.toLocaleString("en-IN")}`} />
        <Kpi label="Orders today" value={stats.ordersToday} />
        <Kpi label="Pending" value={stats.pending} accent />
        <Kpi label="Avg order value" value={`₹${Math.round(stats.avg).toLocaleString("en-IN")}`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Revenue · last 30 days</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="var(--brand-maroon)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Top products</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats.topProducts.length === 0 && <li className="text-sm text-muted-foreground">No sales yet.</li>}
              {stats.topProducts.map(([name, v], i) => (
                <li key={name} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="truncate">{name}</span>
                  </div>
                  <div className="text-sm tabular-nums">
                    <span className="text-muted-foreground">{v.qty} sold ·</span>{" "}
                    <span className="font-medium">₹{v.rev.toLocaleString("en-IN")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-display">Recent orders</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {orders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""} · {format(o.createdAt, "p")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_STYLES[o.status]}>{o.status}</Badge>
                    <div className="text-sm tabular-nums font-medium">₹{o.total}</div>
                  </div>
                </li>
              ))}
              {orders.length === 0 && <li className="text-sm text-muted-foreground">No orders yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={"mt-1 text-2xl md:text-3xl font-display font-bold tabular-nums " + (accent ? "text-destructive" : "")}>{value}</div>
      </CardContent>
    </Card>
  );
}
