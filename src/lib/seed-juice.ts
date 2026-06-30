// Seed Bombaiwala Juice catalog from Zomato menu structure.
// Prices/images left blank — admin fills them in via the dashboard.
import {
  collection, getDocs, query, where, writeBatch, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface SeedCategory {
  slug: string;
  name: string;
  icon: string;
  products: { name: string; description?: string }[];
}

interface SeedCombo {
  name: string;
  itemSlugs: string[];
}

// Source: zomato.com/hyderabad/bombaiwala-juice-sanath-nagar
const CATEGORIES: SeedCategory[] = [
  {
    slug: "fresh-fruits-juices", name: "Fresh Fruits Juices", icon: "🧃",
    products: [
      { name: "Apple Juice (350ml)", description: "Freshly squeezed apple juice. A cool, refreshing drink made from ripe apples." },
      { name: "Pineapple Juice (350ml)" },
      { name: "Black Grapes Juice (350ml)" },
      { name: "Watermelon Juice (350ml)" },
      { name: "Muskmelon Juice (350ml)" },
      { name: "Papaya Juice (350ml)" },
      { name: "Sapota Juice (350ml)", description: "Chikoo." },
      { name: "Anar Juice (350ml)", description: "Pomegranate." },
      { name: "Cocktail Juice (350ml)", description: "All fruits mix." },
      { name: "Avocado Juice (350ml)" },
    ],
  },
  {
    slug: "special-healthy-fruits-bowl", name: "Special Healthy Fruits Bowl", icon: "🥣",
    products: [
      { name: "Fruits Bowl (Regular)" },
      { name: "Watermelon Bowl (500ml)", description: "A delightful chilled bowl filled with watermelon." },
      { name: "Papaya Bowl (500ml)", description: "A delightful bowl of papaya, served in a 500 ml portion." },
      { name: "Pineapple Bowl (500ml)", description: "A delightful blend of fresh pineapple pieces." },
      { name: "Special Fruit Fusion Bowl" },
    ],
  },
  {
    slug: "milkshakes", name: "Milkshakes", icon: "🥤",
    products: [
      { name: "Litchi Milkshake" },
      { name: "Blackcurrant Milkshake" },
      { name: "Blueberry Milkshake" },
      { name: "Cold Coffee Milkshake" },
    ],
  },
  {
    slug: "desserts", name: "Desserts", icon: "🍮",
    products: [
      { name: "Fruit Custard" },
    ],
  },
];

const COMBOS: SeedCombo[] = [
  { name: "Apple Juice + Fruit Custard", itemSlugs: ["Apple Juice (350ml)", "Fruit Custard"] },
  { name: "Watermelon Juice + Watermelon Bowl", itemSlugs: ["Watermelon Juice (350ml)", "Watermelon Bowl (500ml)"] },
  { name: "Cold Coffee Milkshake + Fruits Bowl", itemSlugs: ["Cold Coffee Milkshake", "Fruits Bowl (Regular)"] },
  { name: "Anar Juice + Special Fruit Fusion Bowl", itemSlugs: ["Anar Juice (350ml)", "Special Fruit Fusion Bowl"] },
  { name: "Cocktail Juice + Blueberry Milkshake", itemSlugs: ["Cocktail Juice (350ml)", "Blueberry Milkshake"] },
  { name: "Pineapple Juice + Pineapple Bowl + Fruit Custard", itemSlugs: ["Pineapple Juice (350ml)", "Pineapple Bowl (500ml)", "Fruit Custard"] },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface SeedResult {
  categories: number;
  products: number;
  combos: number;
  skipped: { categories: number; products: number; combos: number };
}

export async function seedJuiceFromZomato(): Promise<SeedResult> {
  const brand = "juice";
  const now = serverTimestamp();

  const [catSnap, prodSnap, comboSnap] = await Promise.all([
    getDocs(query(collection(db, "categories"), where("brand", "==", brand))),
    getDocs(query(collection(db, "products"), where("brand", "==", brand))),
    getDocs(query(collection(db, "combos"), where("brand", "==", brand))),
  ]);
  const existingCats = new Map(catSnap.docs.map((d) => [(d.data().name as string).toLowerCase(), { id: d.id }]));
  const existingProds = new Map(prodSnap.docs.map((d) => [(d.data().name as string).toLowerCase(), { id: d.id }]));
  const existingCombos = new Set(comboSnap.docs.map((d) => (d.data().name as string).toLowerCase()));

  const batch = writeBatch(db);
  const result: SeedResult = { categories: 0, products: 0, combos: 0, skipped: { categories: 0, products: 0, combos: 0 } };

  const catIdByName = new Map<string, string>();
  CATEGORIES.forEach((c, idx) => {
    const key = c.name.toLowerCase();
    const existing = existingCats.get(key);
    if (existing) {
      catIdByName.set(key, existing.id);
      result.skipped.categories++;
      return;
    }
    const ref = doc(collection(db, "categories"));
    catIdByName.set(key, ref.id);
    batch.set(ref, {
      brand, name: c.name, slug: c.slug, icon: c.icon,
      sortOrder: idx, active: true, createdAt: now, updatedAt: now,
    });
    result.categories++;
  });

  const prodIdByName = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const categoryId = catIdByName.get(cat.name.toLowerCase())!;
    for (const p of cat.products) {
      const key = p.name.toLowerCase();
      const existing = existingProds.get(key);
      if (existing) {
        prodIdByName.set(key, existing.id);
        result.skipped.products++;
        continue;
      }
      const ref = doc(collection(db, "products"));
      prodIdByName.set(key, ref.id);
      batch.set(ref, {
        brand, categoryId, name: p.name,
        description: p.description ?? "",
        images: [],
        sellingPrice: 0, mrp: 0, discountPct: 0,
        competitorPrices: [],
        variants: [],
        inStock: true, tags: [],
        isVeg: true, featured: false, active: true,
        slug: slugify(p.name),
        createdAt: now, updatedAt: now,
      });
      result.products++;
    }
  }

  for (const c of COMBOS) {
    if (existingCombos.has(c.name.toLowerCase())) { result.skipped.combos++; continue; }
    const items = c.itemSlugs.map((n) => {
      const productId = prodIdByName.get(n.toLowerCase()) ?? "";
      return { productId, productName: n, qty: 1 };
    }).filter((it) => it.productId);
    if (items.length === 0) continue;
    const ref = doc(collection(db, "combos"));
    batch.set(ref, {
      brand, name: c.name, description: "", image: "",
      items, comboPrice: 0, competitorPrices: [], active: true,
      createdAt: now, updatedAt: now,
    });
    result.combos++;
  }

  await batch.commit();
  return result;
}
