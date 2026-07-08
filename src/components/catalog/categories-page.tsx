import { useMemo, useState } from "react";
import { collection, query, where } from "firebase/firestore";
import { useEffect } from "react";
import { onSnapshot } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import type { Brand, Category } from "@/lib/catalog";
import { createDoc, updateDocById, deleteDocById } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoriesPage({ brand }: { brand: Brand }) {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "categories"), where("brand", "==", brand));
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Category));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [brand]);

  const sorted = useMemo(() => [...rows].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [rows]);

  async function save() {
    if (!editing) return;
    const name = (editing.name ?? "").trim();
    if (!name) return toast.error("Name required");
    const payload = {
      brand,
      name,
      slug: editing.slug?.trim() || slugify(name),
      sortOrder: Number(editing.sortOrder ?? sorted.length),
      active: editing.active ?? true,
      icon: editing.icon ?? "",
    };
    try {
      if (editing.id) await updateDocById("categories", editing.id, payload);
      else await createDoc("categories", payload);
      toast.success("Saved");
      setOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    try { await deleteDocById("categories", id); toast.success("Deleted"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold capitalize">{brand} · Categories</h1>
          <p className="text-sm text-muted-foreground">Group products under categories.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ active: true, sortOrder: sorted.length })}>
              <Plus className="h-4 w-4" /> New category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} category</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={editing.slug ?? ""} placeholder={slugify(editing.name ?? "")} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sort order</Label>
                  <Input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Icon emoji (optional)</Label>
                  <Input value={editing.icon ?? ""} placeholder="🥙" onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch id="active" checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-12">#</th>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Slug</th>
                <th className="text-left font-medium px-4 py-3">Active</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span className="mr-1.5">{c.icon}</span>
                    <span className="font-medium">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.slug}</td>
                  <td className="px-4 py-3">{c.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No categories yet. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
