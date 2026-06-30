import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import type { Brand, Combo, ComboItem, Product } from "@/lib/catalog";
import { createDoc, updateDocById, deleteDocById } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/catalog/image-uploader";
import { cldThumb } from "@/lib/cloudinary";

export function CombosPage({ brand }: { brand: Brand }) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Combo> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, "combos"), where("brand", "==", brand)),
      (s) => setCombos(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Combo)));
    const u2 = onSnapshot(query(collection(db, "products"), where("brand", "==", brand)),
      (s) => setProducts(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Product)));
    return () => { u1(); u2(); };
  }, [brand]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  function sumIndividual(items: ComboItem[]) {
    return items.reduce((s, it) => {
      const p = productMap.get(it.productId);
      const price = p?.variants?.find((v) => v.name === it.variant)?.price ?? p?.sellingPrice ?? 0;
      return s + price * (it.qty ?? 1);
    }, 0);
  }

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim()) return toast.error("Name required");
    const payload = {
      brand,
      name: editing.name.trim(),
      description: editing.description ?? "",
      image: editing.image ?? "",
      items: editing.items ?? [],
      comboPrice: Number(editing.comboPrice ?? 0),
      competitorPrices: editing.competitorPrices ?? [],
      active: editing.active ?? true,
    };
    try {
      if (editing.id) await updateDocById("combos", editing.id, payload);
      else await createDoc("combos", payload);
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function remove(id: string) {
    if (!confirm("Delete combo?")) return;
    await deleteDocById("combos", id);
    toast.success("Deleted");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold capitalize">{brand} · Combos</h1>
          <p className="text-sm text-muted-foreground">Bundle products into combo deals.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button disabled={products.length === 0} onClick={() => setEditing({ brand, items: [], active: true, comboPrice: 0 })}>
              <Plus className="h-4 w-4" />New combo
            </Button>
          </DialogTrigger>
          {editing && (
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} combo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Name</Label>
                    <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Combo price (₹)</Label>
                    <Input type="number" value={editing.comboPrice ?? 0} onChange={(e) => setEditing({ ...editing, comboPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Image</Label>
                    <ImageUploader
                      images={editing.image ? [editing.image] : []}
                      onChange={(imgs) => setEditing({ ...editing, image: imgs[0] ?? "" })}
                      folder={`bombaiwala/${brand}/combos`}
                      max={1}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...editing, items: [...(editing.items ?? []), { productId: products[0]?.id ?? "", productName: products[0]?.name ?? "", qty: 1 }] })}>
                      <Plus className="h-3 w-3" />Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(editing.items ?? []).map((it, i) => {
                      const p = productMap.get(it.productId);
                      return (
                        <div key={i} className="grid grid-cols-[1fr_120px_70px_auto] gap-2">
                          <Select value={it.productId} onValueChange={(v) => {
                            const arr = [...(editing.items ?? [])];
                            arr[i] = { ...arr[i], productId: v, productName: productMap.get(v)?.name ?? "", variant: undefined };
                            setEditing({ ...editing, items: arr });
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={it.variant ?? "__none__"} onValueChange={(v) => {
                            const arr = [...(editing.items ?? [])];
                            arr[i] = { ...arr[i], variant: v === "__none__" ? undefined : v };
                            setEditing({ ...editing, items: arr });
                          }}>
                            <SelectTrigger><SelectValue placeholder="Default" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Default</SelectItem>
                              {p?.variants?.map((v) => <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input type="number" min={1} value={it.qty} onChange={(e) => {
                            const arr = [...(editing.items ?? [])];
                            arr[i] = { ...arr[i], qty: Number(e.target.value) };
                            setEditing({ ...editing, items: arr });
                          }} />
                          <Button size="icon" variant="ghost" onClick={() => {
                            const arr = [...(editing.items ?? [])]; arr.splice(i, 1);
                            setEditing({ ...editing, items: arr });
                          }}><X className="h-4 w-4" /></Button>
                        </div>
                      );
                    })}
                  </div>
                  {(editing.items?.length ?? 0) > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground flex items-center justify-between">
                      <span>Individual sum: ₹{sumIndividual(editing.items ?? [])}</span>
                      <span className="text-emerald-700">Savings: ₹{Math.max(0, sumIndividual(editing.items ?? []) - Number(editing.comboPrice ?? 0))}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <Label>Active</Label>
                  <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>

      {products.length === 0 && (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">Add products first.</CardContent></Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {combos.map((c) => {
          const individual = sumIndividual(c.items);
          const savings = Math.max(0, individual - c.comboPrice);
          return (
            <Card key={c.id} className="overflow-hidden">
              {c.image && <img src={cldThumb(c.image, 480, 240)} alt={c.name} className="h-32 w-full object-cover" loading="lazy" />}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{c.name}</div>
                  <div className="flex gap-0.5">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-bold">₹{c.comboPrice}</span>
                  {individual > c.comboPrice && <span className="text-xs line-through text-muted-foreground">₹{individual}</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.items?.length ?? 0} items{savings > 0 ? ` · saves ₹${savings}` : ""}
                </div>
                {!c.active && <Badge variant="outline">inactive</Badge>}
              </CardContent>
            </Card>
          );
        })}
        {combos.length === 0 && products.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3"><CardContent className="py-10 text-center text-sm text-muted-foreground">No combos yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
