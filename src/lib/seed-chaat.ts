// Seed Bombaiwala Chaat catalog from Zomato menu structure.
// Prices/images left blank — admin fills them in via the dashboard.
import {
  collection, getDocs, query, where, writeBatch, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface SeedCategory {
  slug: string;
  name: string;
  icon: string;
  products: string[];
}

interface SeedCombo {
  name: string;
  itemSlugs: string[];
}

// Source: zomato.com/hyderabad/bombaiwala-chaat-sanath-nagar
const CATEGORIES: SeedCategory[] = [
  {
    slug: "pav-bhaji", name: "Pav Bhaji", icon: "🥘",
    products: [
      "Butter Pav Bhaji [2 Pav]",
      "Paneer Pav Bhaji [2 Pav]",
      "Cheese Pav Bhaji [2 Pav]",
      "Masala Pav Bhaji [2 Pav]",
      "Khada Pav Bhaji [2 Pav]",
      "Jain Pav Bhaji [2 Pav]",
    ],
  },
  {
    slug: "vada-pav", name: "Vada Pav", icon: "🥙",
    products: [
      "Vada Pav",
      "Vada Pav (Butter)",
      "Cheese Vada Pav",
    ],
  },
  {
    slug: "chaat-and-snacks", name: "Chaat & Snacks", icon: "🍢",
    products: [
      "Pani Puri",
      "Dahi Puri",
      "Sev Puri",
      "Bhel Puri",
      "Masala Puri",
      "Papdi Chaat",
      "Dahi Papdi Chaat",
      "Samosa Chaat",
      "Dahi Samosa",
      "Aloo Tikki Chaat",
      "Aloo Tikki (Cutlet) Chaat",
      "Ragda Pattice",
    ],
  },
  {
    slug: "sandwiches", name: "Sandwiches", icon: "🥪",
    products: [
      "Veg Sandwich",
      "Cheese Sandwich",
      "Masala Sandwich",
      "Veg Grill Sandwich",
      "Cheese Grill Sandwich",
      "Paneer Cheese Grill Sandwich",
    ],
  },
];

const COMBOS: SeedCombo[] = [
  { name: "Pav Bhaji + Vada Pav + Pani Puri", itemSlugs: ["Butter Pav Bhaji [2 Pav]", "Vada Pav", "Pani Puri"] },
  { name: "Cheese Pav Bhaji + Masala Puri + Papdi Chaat", itemSlugs: ["Cheese Pav Bhaji [2 Pav]", "Masala Puri", "Papdi Chaat"] },
  { name: "Masala Pav Bhaji + Paneer Cheese Grill Sandwich + Dahi Samosa", itemSlugs: ["Masala Pav Bhaji [2 Pav]", "Paneer Cheese Grill Sandwich", "Dahi Samosa"] },
  { name: "Vada Pav + Sev Puri + Cheese Sandwich", itemSlugs: ["Vada Pav", "Sev Puri", "Cheese Sandwich"] },
  { name: "Butter Pav Bhaji + Bhel Puri", itemSlugs: ["Butter Pav Bhaji [2 Pav]", "Bhel Puri"] },
  { name: "Paneer Pav Bhaji + Dahi Puri + Samosa Chaat", itemSlugs: ["Paneer Pav Bhaji [2 Pav]", "Dahi Puri", "Samosa Chaat"] },
  { name: "Cheese Vada Pav + Pani Puri + Veg Grill Sandwich", itemSlugs: ["Cheese Vada Pav", "Pani Puri", "Veg Grill Sandwich"] },
  { name: "Aloo Tikki Chaat + Ragda Pattice + Masala Sandwich", itemSlugs: ["Aloo Tikki Chaat", "Ragda Pattice", "Masala Sandwich"] },
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

export async function seedChaatFromZomato(): Promise<SeedResult> {
  const brand = "chaat";
  const now = serverTimestamp();

  // Load existing to skip duplicates by name (case-insensitive)
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

  // Categories
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

  // Products
  const prodIdByName = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const categoryId = catIdByName.get(cat.name.toLowerCase())!;
    for (const name of cat.products) {
      const key = name.toLowerCase();
      const existing = existingProds.get(key);
      if (existing) {
        prodIdByName.set(key, existing.id);
        result.skipped.products++;
        continue;
      }
      const ref = doc(collection(db, "products"));
      prodIdByName.set(key, ref.id);
      batch.set(ref, {
        brand, categoryId, name,
        description: "",
        images: [],
        sellingPrice: 0, mrp: 0, discountPct: 0,
        competitorPrices: [],
        variants: [],
        inStock: true, tags: [],
        isVeg: true, featured: false, active: true,
        slug: slugify(name),
        createdAt: now, updatedAt: now,
      });
      result.products++;
    }
  }

  // Combos
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
