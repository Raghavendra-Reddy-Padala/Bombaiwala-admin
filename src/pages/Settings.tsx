import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "firebase/auth";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { seedChaatFromZomato } from "@/lib/seed-chaat";
import { seedJuiceFromZomato } from "@/lib/seed-juice";
import { Loader2, Sparkles, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState<"chaat" | "juice" | null>(null);

  // Delivery settings state
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<string>("0");
  const [deliveryFee, setDeliveryFee] = useState<string>("30");
  const [maxRadius, setMaxRadius] = useState<string>("2");
  const [shopLat, setShopLat] = useState<string>("17.454082489013672");
  const [shopLng, setShopLng] = useState<string>("78.43592071533203");
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  useEffect(() => {
    async function loadDeliverySettings() {
      try {
        const docRef = doc(db, "settings", "delivery");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFreeDeliveryThreshold(String(data.freeDeliveryThreshold ?? 0));
          setDeliveryFee(String(data.deliveryFee ?? 30));
          setMaxRadius(String(data.maxRadius ?? 2));
          setShopLat(String(data.shopLat ?? 17.454082489013672));
          setShopLng(String(data.shopLng ?? 78.43592071533203));
        }
      } catch (e) {
        console.error("Failed to load delivery settings:", e);
      } finally {
        setLoadingSettings(false);
      }
    }
    loadDeliverySettings();
  }, []);

  async function saveDeliverySettings() {
    setSavingSettings(true);
    try {
      const docRef = doc(db, "settings", "delivery");
      await setDoc(docRef, {
        freeDeliveryThreshold: Number(freeDeliveryThreshold) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        maxRadius: Number(maxRadius) || 0,
        shopLat: Number(shopLat) || 0,
        shopLng: Number(shopLng) || 0,
        updatedAt: new Date().toISOString()
      });
      toast.success("Delivery settings saved successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingSettings(false);
    }
  }

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
        <CardHeader>
          <CardTitle className="text-base font-display">Delivery Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSettings ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading delivery configurations...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold Price (₹)</Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                    placeholder="e.g. 500"
                  />
                  <p className="text-[10px] text-muted-foreground">Orders above this subtotal qualify for free delivery.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee">Flat Delivery Charge (₹)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="e.g. 30"
                  />
                  <p className="text-[10px] text-muted-foreground">Standard delivery rate added to customer cart.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRadius">Maximum Delivery Radius (km)</Label>
                <Input
                  id="maxRadius"
                  type="number"
                  step="0.1"
                  value={maxRadius}
                  onChange={(e) => setMaxRadius(e.target.value)}
                  placeholder="e.g. 5"
                />
                <p className="text-[10px] text-muted-foreground">Customers beyond this distance from the shop cannot check out.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="shopLat">Shop Latitude</Label>
                  <Input
                    id="shopLat"
                    type="number"
                    step="0.000000000000001"
                    value={shopLat}
                    onChange={(e) => setShopLat(e.target.value)}
                    placeholder="e.g. 17.454082"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopLng">Shop Longitude</Label>
                  <Input
                    id="shopLng"
                    type="number"
                    step="0.000000000000001"
                    value={shopLng}
                    onChange={(e) => setShopLng(e.target.value)}
                    placeholder="e.g. 78.435920"
                  />
                </div>
              </div>

              <Button 
                onClick={saveDeliverySettings} 
                disabled={savingSettings}
                className="w-full md:w-auto mt-2"
              >
                {savingSettings ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Save Delivery Settings</>
                )}
              </Button>
            </div>
          )}
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
