import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import type { Brand, Category, CompetitorPrice, Product, Variant } from "@/lib/catalog";
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
import { Pencil, Trash2, Plus, X, TrendingDown, TrendingUp } from "lucide-react";
import { ImageUploader } from "@/components/catalog/image-uploader";
import { cldThumb } from "@/lib/cloudinary";

export function ProductsPage({ brand }: { brand: Brand }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "products"), where("brand", "==", brand)),
      (s) => setProducts(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Product)));
    const unsub2 = onSnapshot(query(collection(db, "categories"), where("brand", "==", brand)),
      (s) => setCategories(s.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Category)));
    return () => { unsub1(); unsub2(); };
  }, [brand]);

  const filtered = useMemo(() => products.filter((p) => {
    if (catFilter !== "all" && p.categoryId !== catFilter) return false;
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  }), [products, filter, catFilter]);

  function newProduct(): Partial<Product> {
    return {
      brand, name: "", description: "", images: [], categoryId: categories[0]?.id ?? "",
      sellingPrice: 0, mrp: 0, discountPct: 0, competitorPrices: [], variants: [],
      inStock: true, tags: [], isVeg: true, featured: false, active: true,
    };
  }

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim()) return toast.error("Name required");
    if (!editing.categoryId) return toast.error("Category required");
    const sellingPrice = Number(editing.sellingPrice ?? 0);
    const mrp = Number(editing.mrp ?? sellingPrice);
    const discountPct = mrp > 0 ? Math.max(0, Math.round((1 - sellingPrice / mrp) * 100)) : 0;
    const payload: Record<string, unknown> = {
      brand,
      name: editing.name.trim(),
      description: editing.description ?? "",
      images: editing.images ?? [],
      categoryId: editing.categoryId,
      sellingPrice, mrp, discountPct,
      competitorPrices: editing.competitorPrices ?? [],
      variants: editing.variants ?? [],
      inStock: editing.inStock ?? true,
      tags: editing.tags ?? [],
      isVeg: editing.isVeg ?? true,
      featured: editing.featured ?? false,
      active: editing.active ?? true,
    };
    if (editing.stockQty !== undefined && editing.stockQty !== null && !Number.isNaN(editing.stockQty)) {
      payload.stockQty = Number(editing.stockQty);
    }
    if (editing.prepTimeMin !== undefined && editing.prepTimeMin !== null && !Number.isNaN(editing.prepTimeMin)) {
      payload.prepTimeMin = Number(editing.prepTimeMin);
    }
    if (editing.spiceLevel !== undefined && editing.spiceLevel !== null) {
      payload.spiceLevel = editing.spiceLevel;
    }
    try {
      if (editing.id) await updateDocById("products", editing.id, payload);
      else await createDoc("products", payload);
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete product?")) return;
    try { await deleteDocById("products", id); toast.success("Deleted"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold capitalize">{brand} · Products</h1>
          <p className="text-sm text-muted-foreground">Manage menu items, pricing, and competitor prices.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(newProduct())} disabled={categories.length === 0}>
              <Plus className="h-4 w-4" /> New product
            </Button>
          </DialogTrigger>
          {editing && <ProductDialog editing={editing} setEditing={setEditing} categories={categories} onSave={save} onCancel={() => setOpen(false)} />}
        </Dialog>
      </div>

      {categories.length === 0 && (
        <Card><CardContent className="py-6 text-sm text-muted-foreground">Add at least one category first.</CardContent></Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search products…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((p) => {
          const minComp = p.competitorPrices?.length ? Math.min(...p.competitorPrices.map((c) => c.price)) : null;
          const cheaperThanComp = minComp != null && p.sellingPrice < minComp;
          return (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {p.images?.[0] ? (
                    <img src={cldThumb(p.images[0], 96, 96)} alt={p.name} className="h-14 w-14 rounded-md object-cover border" loading="lazy" />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-muted border grid place-items-center text-xs text-muted-foreground">No img</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium leading-tight truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{catName(p.categoryId)}</div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-bold tabular-nums">₹{p.sellingPrice}</span>
                  {p.mrp > p.sellingPrice && (
                    <>
                      <span className="line-through text-xs text-muted-foreground">₹{p.mrp}</span>
                      <Badge variant="outline" className="text-xs">{p.discountPct}% off</Badge>
                    </>
                  )}
                </div>
                {minComp != null && (
                  <div className={"text-xs inline-flex items-center gap-1 " + (cheaperThanComp ? "text-emerald-700" : "text-amber-700")}>
                    {cheaperThanComp ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    Lowest competitor ₹{minComp}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {!p.active && <Badge variant="outline">inactive</Badge>}
                  {!p.inStock && <Badge variant="outline" className="bg-rose-100 text-rose-900 border-rose-300">out of stock</Badge>}
                  {p.featured && <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">featured</Badge>}
                  {p.variants?.length > 0 && <Badge variant="outline">{p.variants.length} variants</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && categories.length > 0 && (
          <Card className="sm:col-span-2 lg:col-span-3"><CardContent className="py-10 text-center text-sm text-muted-foreground">No products yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function ProductDialog({
  editing, setEditing, categories, onSave, onCancel,
}: {
  editing: Partial<Product>;
  setEditing: (p: Partial<Product>) => void;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
}) {
  function updateField<K extends keyof Product>(k: K, v: Product[K]) {
    setEditing({ ...editing, [k]: v });
  }
  function addCompetitor() {
    setEditing({ ...editing, competitorPrices: [...(editing.competitorPrices ?? []), { platform: "Zomato", price: 0, url: "" }] });
  }
  function updateCompetitor(i: number, patch: Partial<CompetitorPrice>) {
    const arr = [...(editing.competitorPrices ?? [])];
    arr[i] = { ...arr[i], ...patch };
    setEditing({ ...editing, competitorPrices: arr });
  }
  function removeCompetitor(i: number) {
    const arr = [...(editing.competitorPrices ?? [])];
    arr.splice(i, 1);
    setEditing({ ...editing, competitorPrices: arr });
  }
  function addVariant() {
    setEditing({ ...editing, variants: [...(editing.variants ?? []), { name: "", price: editing.sellingPrice ?? 0, sku: "" }] });
  }
  function updateVariant(i: number, patch: Partial<Variant>) {
    const arr = [...(editing.variants ?? [])];
    arr[i] = { ...arr[i], ...patch };
    setEditing({ ...editing, variants: arr });
  }
  function removeVariant(i: number) {
    const arr = [...(editing.variants ?? [])];
    arr.splice(i, 1);
    setEditing({ ...editing, variants: arr });
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} product</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input value={editing.name ?? ""} onChange={(e) => updateField("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={editing.categoryId ?? ""} onValueChange={(v) => updateField("categoryId", v)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => updateField("description", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Images</Label>
            <ImageUploader images={editing.images ?? []} onChange={(imgs) => updateField("images", imgs)} folder={`bombaiwala/${editing.brand ?? "chaat"}/products`} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Selling price (₹)</Label>
            <Input type="number" value={editing.sellingPrice ?? 0} onChange={(e) => updateField("sellingPrice", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>MRP (₹)</Label>
            <Input type="number" value={editing.mrp ?? 0} onChange={(e) => updateField("mrp", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Prep time (min)</Label>
            <Input type="number" value={editing.prepTimeMin ?? ""} onChange={(e) => updateField("prepTimeMin", Number(e.target.value))} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Variants</Label>
            <Button size="sm" variant="outline" onClick={addVariant}><Plus className="h-3 w-3" />Variant</Button>
          </div>
          <div className="space-y-2">
            {(editing.variants ?? []).map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2">
                <Input placeholder="Variant name (Butter, Cheese)" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} />
                <Input type="number" placeholder="Price" value={v.price} onChange={(e) => updateVariant(i, { price: Number(e.target.value) })} />
                <Input placeholder="SKU" value={v.sku ?? ""} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeVariant(i)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Competitor prices (for comparison)</Label>
            <Button size="sm" variant="outline" onClick={addCompetitor}><Plus className="h-3 w-3" />Platform</Button>
          </div>
          <div className="space-y-2">
            {(editing.competitorPrices ?? []).map((c, i) => (
              <div key={i} className="grid grid-cols-[140px_100px_1fr_auto] gap-2">
                <Select value={c.platform} onValueChange={(v) => updateCompetitor(i, { platform: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Zomato", "Swiggy", "Magicpin", "Dunzo", "Other"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Price" value={c.price} onChange={(e) => updateCompetitor(i, { price: Number(e.target.value) })} />
                <Input placeholder="URL (optional)" value={c.url ?? ""} onChange={(e) => updateCompetitor(i, { url: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeCompetitor(i)}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            {(editing.competitorPrices?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Add prices from Zomato/Swiggy/etc. to compare and stay competitive.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
          <Toggle label="In stock" value={editing.inStock ?? true} onChange={(v) => updateField("inStock", v)} />
          <Toggle label="Veg" value={editing.isVeg ?? true} onChange={(v) => updateField("isVeg", v)} />
          <Toggle label="Featured" value={editing.featured ?? false} onChange={(v) => updateField("featured", v)} />
          <Toggle label="Active" value={editing.active ?? true} onChange={(v) => updateField("active", v)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <Label className="text-xs">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
