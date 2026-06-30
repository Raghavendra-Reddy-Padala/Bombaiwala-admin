import { useMemo, useState } from "react";
import { useOrders } from "@/lib/firestore-hooks";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CustomersPage() {
  const { orders } = useOrders(500);
  const [q, setQ] = useState("");

  const customers = useMemo(() => {
    const map = new Map<string, { phone: string; name: string; orders: number; spent: number; last: Date; sources: Set<string> }>();
    orders.forEach((o) => {
      if (!o.customerPhone) return;
      const cur = map.get(o.customerPhone) ?? { phone: o.customerPhone, name: o.customerName, orders: 0, spent: 0, last: o.createdAt, sources: new Set() };
      cur.orders += 1;
      if (o.status !== "cancelled") cur.spent += o.total;
      if (o.createdAt > cur.last) { cur.last = o.createdAt; cur.name = o.customerName; }
      cur.sources.add(o.source);
      map.set(o.customerPhone, cur);
    });
    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const filtered = customers.filter((c) =>
    !q.trim() || `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">Derived from order history.</p>
      </div>
      <Input placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="text-left font-medium px-4 py-3">Customer</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Sources</th>
                <th className="text-right font-medium px-4 py-3">Orders</th>
                <th className="text-right font-medium px-4 py-3">Spent</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Last order</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.phone} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex gap-1">{[...c.sources].map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">₹{c.spent.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{format(c.last, "MMM d, p")}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No customers yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
