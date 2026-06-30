import { useMemo, useState } from "react";
import { useOrders } from "@/lib/firestore-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const;
type RangeKey = keyof typeof RANGES;

export default function AnalyticsPage() {
  const { orders } = useOrders(1000);
  const [range, setRange] = useState<RangeKey>("30");

  const data = useMemo(() => {
    const days = Number(range);
    const cutoff = subDays(new Date(), days);
    const inRange = orders.filter((o) => o.createdAt >= cutoff && o.status !== "cancelled");
    const series: { date: string; revenue: number; orders: number; website: number; whatsapp: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const dayOrders = inRange.filter((o) => startOfDay(o.createdAt).getTime() === d.getTime());
      series.push({
        date: format(d, days > 31 ? "MMM d" : "MMM d"),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
        website: dayOrders.filter((o) => o.source === "website").length,
        whatsapp: dayOrders.filter((o) => o.source === "whatsapp").length,
      });
    }
    const totalRev = inRange.reduce((s, o) => s + o.total, 0);
    const aov = inRange.length ? totalRev / inRange.length : 0;
    const websiteRev = inRange.filter((o) => o.source === "website").reduce((s, o) => s + o.total, 0);
    const whatsappRev = totalRev - websiteRev;
    const sourcePie = [
      { name: "Website", value: websiteRev },
      { name: "WhatsApp", value: whatsappRev },
    ];
    const productMap = new Map<string, number>();
    inRange.forEach((o) => o.items.forEach((it) => productMap.set(it.name, (productMap.get(it.name) ?? 0) + it.lineTotal)));
    const topProducts = [...productMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value }));

    // hour heatmap
    const heat: { hour: number; orders: number }[] = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
    inRange.forEach((o) => { heat[o.createdAt.getHours()].orders += 1; });

    const repeatPhones = new Set<string>();
    const seen = new Set<string>();
    inRange.forEach((o) => {
      if (!o.customerPhone) return;
      if (seen.has(o.customerPhone)) repeatPhones.add(o.customerPhone);
      seen.add(o.customerPhone);
    });
    const repeatRate = seen.size ? Math.round((repeatPhones.size / seen.size) * 100) : 0;

    return { series, totalRev, aov, sourcePie, topProducts, heat, repeatRate, totalOrders: inRange.length };
  }, [orders, range]);

  const COLORS = ["var(--brand-maroon)", "var(--brand-yellow)"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Sales performance and trends.</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(RANGES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Revenue" value={`₹${data.totalRev.toLocaleString("en-IN")}`} />
        <Kpi label="Orders" value={data.totalOrders} />
        <Kpi label="Avg order value" value={`₹${Math.round(data.aov)}`} />
        <Kpi label="Repeat rate" value={`${data.repeatRate}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Revenue & orders</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="var(--brand-maroon)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Revenue by source</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.sourcePie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {data.sourcePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-display">Top products by revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--brand-red)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Orders by hour of day</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heat}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="var(--brand-yellow)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl md:text-3xl font-display font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
