import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useOrders } from "@/lib/firestore-hooks";
import { STATUS_OPTIONS, STATUS_STYLES, type NormalizedOrder, type OrderStatus } from "@/lib/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { toast } from "sonner";
import { ExternalLink, Phone, MapPin, MessageCircle, Globe, Send, Loader2 } from "lucide-react";

export default function OrdersPage() {
  const { orders, loading } = useOrders(300);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [selected, setSelected] = useState<NormalizedOrder | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (sourceFilter !== "all" && o.source !== sourceFilter) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        const hay = `${o.customerName} ${o.customerPhone} ${o.orderId}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [orders, q, statusFilter, sourceFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">Live feed from website + WhatsApp bot.</p>
        </div>
        <Badge variant="outline" className="text-xs">{filtered.length} shown</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name, phone, order ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Order</th>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3">Items</th>
                  <th className="text-left font-medium px-4 py-3">Source</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-left font-medium px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{o.orderId.slice(-10)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {o.source === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        {o.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_STYLES[o.status]}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">₹{o.total}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(o.createdAt, "MMM d, p")}
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No orders match.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="w-full text-left p-4 hover:bg-muted/40 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{o.customerName}</div>
                  <div className="font-medium tabular-nums">₹{o.total}</div>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{o.items.length} items · {o.customerPhone}</span>
                  <span>{format(o.createdAt, "MMM d, p")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={STATUS_STYLES[o.status]}>{o.status}</Badge>
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    {o.source === "whatsapp" ? <MessageCircle className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {o.source}
                  </span>
                </div>
              </button>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No orders match.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <OrderDrawer order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: NormalizedOrder | null; onClose: () => void }) {
  const [trackingLink, setTrackingLink] = useState("");
  const [sendingTracking, setSendingTracking] = useState(false);

  async function setStatus(s: OrderStatus) {
    if (!order) return;
    try {
      await updateDoc(doc(db, "orders", order.id), { status: s });
      toast.success(`Marked ${s}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function handleSendTracking() {
    if (!order || !trackingLink.trim()) {
      toast.error("Please enter a tracking link");
      return;
    }
    setSendingTracking(true);
    try {
      const BOT_API = import.meta.env.VITE_BOT_API_URL || "http://localhost:8001";
      const res = await fetch(`${BOT_API}/api/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          trackingLink: trackingLink.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tracking link sent to customer via WhatsApp!");
        // Save tracking link to Firebase order doc
        await updateDoc(doc(db, "orders", order.id), {
          trackingLink: trackingLink.trim(),
          trackingSentAt: new Date().toISOString(),
        });
        setTrackingLink("");
      } else {
        toast.error(data.error || "Failed to send tracking link");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send tracking link");
    } finally {
      setSendingTracking(false);
    }
  }
  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display">{order.customerName}</SheetTitle>
              <SheetDescription className="font-mono text-xs">{order.orderId}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5 px-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={STATUS_STYLES[order.status]}>{order.status}</Badge>
                <Badge variant="outline">{order.source}</Badge>
                {order.deliveryType && <Badge variant="outline">{order.deliveryType}</Badge>}
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                  <Phone className="h-3.5 w-3.5" />{order.customerPhone}
                </a>
                {order.location && (
                  <a href={order.location.mapsUrl ?? `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                    <MapPin className="h-3.5 w-3.5" />Map<ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {order.address && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Address</div>
                  <div className="text-sm">{order.address}</div>
                </div>
              )}
              {order.notes && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm italic">"{order.notes}"</div>
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items</div>
                <ul className="space-y-1.5">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between text-sm gap-2">
                      <span><span className="text-muted-foreground">{it.qty}×</span> {it.name}</span>
                      <span className="tabular-nums">₹{it.lineTotal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                {order.deliveryFee > 0 && <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>₹{order.deliveryFee}</span></div>}
                {order.distanceKm != null && <div className="flex justify-between text-muted-foreground"><span>Distance</span><span>{order.distanceKm} km</span></div>}
                <div className="flex justify-between font-display font-bold text-base pt-1"><span>Total</span><span>₹{order.total}</span></div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Update status</div>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Button key={s} variant={s === order.status ? "default" : "outline"} size="sm" onClick={() => setStatus(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Send tracking link</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste tracking URL…"
                    value={trackingLink}
                    onChange={(e) => setTrackingLink(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendTracking}
                    disabled={sendingTracking || !trackingLink.trim()}
                    className="shrink-0"
                  >
                    {sendingTracking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Send className="h-4 w-4 mr-1" />Send</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sends a WhatsApp message to the customer with the tracking link.
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
