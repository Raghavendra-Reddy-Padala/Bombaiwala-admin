import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { toast } from "sonner";
import { seedChaatFromZomato } from "@/lib/seed-chaat";
import { seedJuiceFromZomato } from "@/lib/seed-juice";
import { Loader2, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState<"chaat" | "juice" | null>(null);

  async function runSeed(brand: "chaat" | "juice") {
    const label = brand === "chaat" ? "Bombaiwala Chaat" : "Bombaiwala Juice";
    if (!confirm(`Seed ${label} categories, products and combos from the Zomato menu? Items with the same name will be skipped.`)) return;
    setSeeding(brand);
    try {
      const r = brand === "chaat" ? await seedChaatFromZomato() : await seedJuiceFromZomato();
      toast.success(`Seeded ${r.categories} categories, ${r.products} products, ${r.combos} combos`, {
        description: `Skipped (already existed): ${r.skipped.categories} cats, ${r.skipped.products} prods, ${r.skipped.combos} combos`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and app preferences.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">UID</span>
            <span className="font-mono text-xs">{user?.uid}</span>
          </div>
          <Button
            variant="outline"
            onClick={async () => { await signOut(auth); toast.success("Signed out"); }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Seed catalog</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            One-click import of categories, products and combos from the Zomato menus. Prices and images
            are left blank — fill them in via the Products and Combos pages. Safe to re-run; duplicates by
            name are skipped.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runSeed("chaat")} disabled={seeding !== null}>
              {seeding === "chaat" ? <><Loader2 className="h-4 w-4 animate-spin" />Seeding…</> : <><Sparkles className="h-4 w-4" />Seed Chaat from Zomato</>}
            </Button>
            <Button onClick={() => runSeed("juice")} disabled={seeding !== null} variant="secondary">
              {seeding === "juice" ? <><Loader2 className="h-4 w-4 animate-spin" />Seeding…</> : <><Sparkles className="h-4 w-4" />Seed Juice from Zomato</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Brands</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>This dashboard manages two brands sold together on the Bombaiwala website:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><span className="text-foreground font-medium">Bombaiwala Chaat</span> — savory items</li>
            <li><span className="text-foreground font-medium">Bombaiwala Juice</span> — drinks</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Image hosting</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Cloudinary cloud</span><code className="text-xs bg-muted px-1.5 py-0.5 rounded">dkkmdjcva</code></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Upload preset</span><code className="text-xs bg-muted px-1.5 py-0.5 rounded">bombaiwala</code></div>
          <p className="text-muted-foreground pt-1">Used by the product image uploader. Make sure the preset is set to <span className="text-foreground">Unsigned</span> in your Cloudinary settings.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base font-display">Firestore</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Connected project: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bombaiwala-chat</code></p>
          <p className="text-muted-foreground">
            Tighten your Firestore rules so only admin UIDs (a doc in <code className="text-xs bg-muted px-1 rounded">/roles/{`{uid}`}</code>) can write outside the public storefront.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
