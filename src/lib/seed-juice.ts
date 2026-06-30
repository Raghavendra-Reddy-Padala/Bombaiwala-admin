// Seed Bombaiwala Juice catalog.
// Prices filled with realistic values. Images are placeholders — replace via dashboard.
import {
  collection, getDocs, query, where, writeBatch, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface SeedCategory {
  slug: string;
  name: string;
  image: string;
  products: {
    name: string;
    slug: string;
    description: string;
    image: string;
    sellingPrice: number;
    mrp: number;
    discountPct: number;
    competitorPrices: { platform: string; price: number; url: string }[];
  }[];
}

interface SeedCombo {
  slug: string;
  name: string;
  description: string;
  image: string;
  itemSlugs: string[];
  comboPrice: number;
  competitorPrices: { platform: string; price: number; url: string }[];
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: "fresh-fruits-juices", name: "Fresh Fruits Juices",
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600",
    products: [
      {
        name: "Apple Juice (350ml)", slug: "apple-juice-350ml",
        description: "Freshly squeezed apple juice. A cool, refreshing drink made from ripe apples.",
        image: "https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Pineapple Juice (350ml)", slug: "pineapple-juice-350ml",
        description: "Fresh pineapple juice with a tropical tangy sweetness.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Black Grapes Juice (350ml)", slug: "black-grapes-juice-350ml",
        description: "Rich and naturally sweet juice from fresh black grapes.",
        image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Watermelon Juice (350ml)", slug: "watermelon-juice-350ml",
        description: "Refreshing watermelon juice — perfect for a hot day.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400",
        sellingPrice: 50, mrp: 69, discountPct: 28,
        competitorPrices: [
          { platform: "Zomato", price: 69, url: "https://zomato.com" },
          { platform: "Swiggy", price: 65, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Muskmelon Juice (350ml)", slug: "muskmelon-juice-350ml",
        description: "Creamy and naturally sweet muskmelon juice.",
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
        sellingPrice: 60, mrp: 79, discountPct: 24,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Papaya Juice (350ml)", slug: "papaya-juice-350ml",
        description: "Smooth papaya juice packed with vitamins and natural sweetness.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400",
        sellingPrice: 60, mrp: 79, discountPct: 24,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Sapota Juice (350ml)", slug: "sapota-juice-350ml",
        description: "Chikoo juice — creamy, sweet, and rich in natural sugars.",
        image: "https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Anar Juice (350ml)", slug: "anar-juice-350ml",
        description: "Pomegranate juice — fresh, tangy, and full of antioxidants.",
        image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400",
        sellingPrice: 100, mrp: 129, discountPct: 22,
        competitorPrices: [
          { platform: "Zomato", price: 129, url: "https://zomato.com" },
          { platform: "Swiggy", price: 119, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cocktail Juice (350ml)", slug: "cocktail-juice-350ml",
        description: "All fruits mix — a vibrant blend of seasonal fresh fruits.",
        image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 105, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Avocado Juice (350ml)", slug: "avocado-juice-350ml",
        description: "Creamy avocado juice blended to smooth perfection.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400",
        sellingPrice: 120, mrp: 149, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 149, url: "https://zomato.com" },
          { platform: "Swiggy", price: 139, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "special-healthy-fruits-bowl", name: "Special Healthy Fruits Bowl",
    image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600",
    products: [
      {
        name: "Fruits Bowl (Regular)", slug: "fruits-bowl-regular",
        description: "A generous bowl of fresh seasonal cut fruits.",
        image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Watermelon Bowl (500ml)", slug: "watermelon-bowl-500ml",
        description: "A delightful chilled bowl filled with fresh watermelon chunks.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Papaya Bowl (500ml)", slug: "papaya-bowl-500ml",
        description: "A delightful bowl of papaya, served in a 500 ml portion.",
        image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Pineapple Bowl (500ml)", slug: "pineapple-bowl-500ml",
        description: "A delightful blend of fresh pineapple pieces served chilled.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Special Fruit Fusion Bowl", slug: "special-fruit-fusion-bowl",
        description: "Premium mixed fruit bowl with exotic seasonal fruits and honey drizzle.",
        image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400",
        sellingPrice: 120, mrp: 149, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 149, url: "https://zomato.com" },
          { platform: "Swiggy", price: 139, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "milkshakes", name: "Milkshakes",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
    products: [
      {
        name: "Litchi Milkshake", slug: "litchi-milkshake",
        description: "Creamy milkshake with fresh litchi flavour and chilled milk.",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 105, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Blackcurrant Milkshake", slug: "blackcurrant-milkshake",
        description: "Rich and fruity blackcurrant milkshake blended with chilled milk.",
        image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 105, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Blueberry Milkshake", slug: "blueberry-milkshake",
        description: "Thick and creamy blueberry milkshake made with fresh berries.",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400",
        sellingPrice: 100, mrp: 119, discountPct: 16,
        competitorPrices: [
          { platform: "Zomato", price: 119, url: "https://zomato.com" },
          { platform: "Swiggy", price: 115, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cold Coffee Milkshake", slug: "cold-coffee-milkshake",
        description: "Chilled coffee milkshake with ice cream — a caffeine lover's delight.",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 99, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "desserts", name: "Desserts",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600",
    products: [
      {
        name: "Fruit Custard", slug: "fruit-custard",
        description: "Classic creamy custard loaded with fresh seasonal fruits.",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
    ],
  },
];

const COMBOS: SeedCombo[] = [
  {
    slug: "apple-juice-fruit-custard-combo",
    name: "Apple Juice + Fruit Custard",
    description: "Fresh apple juice paired with creamy fruit custard.",
    image: "https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=400",
    itemSlugs: ["apple-juice-350ml", "fruit-custard"],
    comboPrice: 140, competitorPrices: [{ platform: "Zomato", price: 180, url: "https://zomato.com" }],
  },
  {
    slug: "watermelon-juice-watermelon-bowl-combo",
    name: "Watermelon Juice + Watermelon Bowl",
    description: "Double watermelon delight — juice and fresh bowl together.",
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400",
    itemSlugs: ["watermelon-juice-350ml", "watermelon-bowl-500ml"],
    comboPrice: 105, competitorPrices: [{ platform: "Zomato", price: 140, url: "https://zomato.com" }],
  },
  {
    slug: "cold-coffee-fruits-bowl-combo",
    name: "Cold Coffee Milkshake + Fruits Bowl",
    description: "Chilled cold coffee with a healthy fresh fruits bowl.",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    itemSlugs: ["cold-coffee-milkshake", "fruits-bowl-regular"],
    comboPrice: 149, competitorPrices: [{ platform: "Zomato", price: 189, url: "https://zomato.com" }],
  },
  {
    slug: "anar-juice-fruit-fusion-bowl-combo",
    name: "Anar Juice + Special Fruit Fusion Bowl",
    description: "Antioxidant-rich pomegranate juice with a premium fruit fusion bowl.",
    image: "https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400",
    itemSlugs: ["anar-juice-350ml", "special-fruit-fusion-bowl"],
    comboPrice: 199, competitorPrices: [{ platform: "Zomato", price: 259, url: "https://zomato.com" }],
  },
  {
    slug: "cocktail-juice-blueberry-milkshake-combo",
    name: "Cocktail Juice + Blueberry Milkshake",
    description: "Mixed fruits cocktail juice with a thick blueberry milkshake.",
    image: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400",
    itemSlugs: ["cocktail-juice-350ml", "blueberry-milkshake"],
    comboPrice: 169, competitorPrices: [{ platform: "Zomato", price: 209, url: "https://zomato.com" }],
  },
  {
    slug: "pineapple-juice-pineapple-bowl-fruit-custard-combo",
    name: "Pineapple Juice + Pineapple Bowl + Fruit Custard",
    description: "Tropical pineapple juice, fresh pineapple bowl, and creamy fruit custard.",
    image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400",
    itemSlugs: ["pineapple-juice-350ml", "pineapple-bowl-500ml", "fruit-custard"],
    comboPrice: 199, competitorPrices: [{ platform: "Zomato", price: 269, url: "https://zomato.com" }],
  },
];

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

  // Categories — use slug as doc ID
  const catIdBySlug = new Map<string, string>();
  CATEGORIES.forEach((c, idx) => {
    const key = c.name.toLowerCase();
    const existing = existingCats.get(key);
    if (existing) {
      catIdBySlug.set(c.slug, existing.id);
      result.skipped.categories++;
      return;
    }
    const docId = `juice-${c.slug}`;
    const ref = doc(db, "categories", docId);
    catIdBySlug.set(c.slug, docId);
    batch.set(ref, {
      brand, name: c.name, slug: c.slug, image: c.image,
      sortOrder: idx, active: true, createdAt: now, updatedAt: now,
    });
    result.categories++;
  });

  // Products — use slug as doc ID
  const prodIdBySlug = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const categoryId = catIdBySlug.get(cat.slug)!;
    for (const p of cat.products) {
      const key = p.name.toLowerCase();
      const existing = existingProds.get(key);
      if (existing) {
        prodIdBySlug.set(p.slug, existing.id);
        result.skipped.products++;
        continue;
      }
      const docId = `juice-${p.slug}`;
      const ref = doc(db, "products", docId);
      prodIdBySlug.set(p.slug, docId);
      batch.set(ref, {
        brand, categoryId, name: p.name, slug: p.slug,
        description: p.description,
        images: [p.image],
        sellingPrice: p.sellingPrice, mrp: p.mrp, discountPct: p.discountPct,
        competitorPrices: p.competitorPrices,
        inStock: true, tags: [],
        isVeg: true, featured: false, active: true,
        createdAt: now, updatedAt: now,
      });
      result.products++;
    }
  }

  // Combos — use slug as doc ID
  for (const c of COMBOS) {
    if (existingCombos.has(c.name.toLowerCase())) { result.skipped.combos++; continue; }
    const items = c.itemSlugs.map((slug) => {
      const productId = prodIdBySlug.get(slug) ?? "";
      let productName = slug;
      for (const cat of CATEGORIES) {
        const found = cat.products.find((p) => p.slug === slug);
        if (found) { productName = found.name; break; }
      }
      return { productId, productName, qty: 1 };
    }).filter((it) => it.productId);
    if (items.length === 0) continue;
    const docId = `juice-${c.slug}`;
    const ref = doc(db, "combos", docId);
    batch.set(ref, {
      brand, name: c.name, slug: c.slug,
      description: c.description, image: c.image,
      items, comboPrice: c.comboPrice,
      competitorPrices: c.competitorPrices,
      active: true, createdAt: now, updatedAt: now,
    });
    result.combos++;
  }

  await batch.commit();
  return result;
}
