// Seed Bombaiwala Chaat catalog.
// Prices from actual menu. Images are placeholders — replace via dashboard.
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
    slug: "pav-bhaji", name: "Pav Bhaji",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600",
    products: [
      {
        name: "Butter Pav Bhaji [2 Pav]", slug: "butter-pav-bhaji-2-pav",
        description: "Classic butter pav bhaji served with 2 buttered pav buns.",
        image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Paneer Pav Bhaji [2 Pav]", slug: "paneer-pav-bhaji-2-pav",
        description: "Rich paneer pav bhaji loaded with paneer cubes, served with 2 pav.",
        image: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400",
        sellingPrice: 100, mrp: 129, discountPct: 22,
        competitorPrices: [
          { platform: "Zomato", price: 129, url: "https://zomato.com" },
          { platform: "Swiggy", price: 119, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cheese Pav Bhaji [2 Pav]", slug: "cheese-pav-bhaji-2-pav",
        description: "Cheesy pav bhaji topped with grated cheese, served with 2 pav.",
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400",
        sellingPrice: 100, mrp: 129, discountPct: 22,
        competitorPrices: [
          { platform: "Zomato", price: 129, url: "https://zomato.com" },
          { platform: "Swiggy", price: 125, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Masala Pav Bhaji [2 Pav]", slug: "masala-pav-bhaji-2-pav",
        description: "Spicy masala pav bhaji with extra spices and herbs, served with 2 pav.",
        image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 105, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Khada Pav Bhaji [2 Pav]", slug: "khada-pav-bhaji-2-pav",
        description: "Chunky style pav bhaji with roughly mashed veggies, served with 2 pav.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 99, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Jain Pav Bhaji [2 Pav]", slug: "jain-pav-bhaji-2-pav",
        description: "Jain-friendly pav bhaji made without onion and garlic, served with 2 pav.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 85, mrp: 109, discountPct: 22,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 99, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "vada-pav", name: "Vada Pav",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600",
    products: [
      {
        name: "Vada Pav", slug: "vada-pav",
        description: "Mumbai's iconic spicy potato vada in a soft pav bun with chutneys.",
        image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400",
        sellingPrice: 35, mrp: 45, discountPct: 22,
        competitorPrices: [
          { platform: "Zomato", price: 45, url: "https://zomato.com" },
          { platform: "Swiggy", price: 40, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Vada Pav (Butter)", slug: "vada-pav-butter",
        description: "Classic vada pav generously buttered on the pav.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 40, mrp: 50, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 50, url: "https://zomato.com" },
          { platform: "Swiggy", price: 45, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cheese Vada Pav", slug: "cheese-vada-pav",
        description: "Vada pav loaded with melted cheese for an extra indulgent treat.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 55, mrp: 69, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 69, url: "https://zomato.com" },
          { platform: "Swiggy", price: 65, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "chaat-and-snacks", name: "Chaat & Snacks",
    image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600",
    products: [
      {
        name: "Pani Puri", slug: "pani-puri",
        description: "Crispy puris filled with spiced water, tamarind chutney, and potato stuffing.",
        image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400",
        sellingPrice: 40, mrp: 50, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 50, url: "https://zomato.com" },
          { platform: "Swiggy", price: 45, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Dahi Puri", slug: "dahi-puri",
        description: "Crispy puris stuffed with potatoes, topped with yogurt and chutneys.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 75, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Sev Puri", slug: "sev-puri",
        description: "Flat puris topped with potatoes, onions, chutneys and crispy sev.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 75, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Bhel Puri", slug: "bhel-puri",
        description: "A tangy and crunchy mix of puffed rice, sev, onions, and chutneys.",
        image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 75, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Masala Puri", slug: "masala-puri",
        description: "Crushed puris mixed with spicy masala, onions, and tangy chutneys.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 75, url: "https://zomato.com" },
          { platform: "Swiggy", price: 65, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Papdi Chaat", slug: "papdi-chaat",
        description: "Crispy papdi wafers topped with potatoes, chickpeas, yogurt and chutneys.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Dahi Papdi Chaat", slug: "dahi-papdi-chaat",
        description: "Crispy papdi topped with yogurt, tamarind, and mint chutney.",
        image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400",
        sellingPrice: 60, mrp: 79, discountPct: 24,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Samosa Chaat", slug: "samosa-chaat",
        description: "Crushed samosas topped with chickpeas, chutneys, and sev.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 60, mrp: 79, discountPct: 24,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Dahi Samosa", slug: "dahi-samosa",
        description: "Crushed samosa topped with creamy yogurt and tangy chutneys.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 60, mrp: 79, discountPct: 24,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Aloo Tikki Chaat", slug: "aloo-tikki-chaat",
        description: "Crispy potato patty topped with chickpeas, yogurt, and chutneys.",
        image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 75, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Aloo Tikki (Cutlet) Chaat", slug: "aloo-tikki-cutlet-chaat",
        description: "Crispy potato cutlet served chaat-style with yogurt and chutneys.",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 70, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Ragda Pattice", slug: "ragda-pattice",
        description: "Potato patties served with spicy white peas curry and chutneys.",
        image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
    ],
  },
  {
    slug: "sandwiches", name: "Sandwiches",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600",
    products: [
      {
        name: "Veg Sandwich", slug: "veg-sandwich",
        description: "Fresh vegetable sandwich with mint chutney and butter.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
        sellingPrice: 60, mrp: 75, discountPct: 20,
        competitorPrices: [
          { platform: "Zomato", price: 79, url: "https://zomato.com" },
          { platform: "Swiggy", price: 75, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cheese Sandwich", slug: "cheese-sandwich",
        description: "Loaded cheese sandwich with veggies and butter.",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400",
        sellingPrice: 80, mrp: 99, discountPct: 19,
        competitorPrices: [
          { platform: "Zomato", price: 99, url: "https://zomato.com" },
          { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Masala Sandwich", slug: "masala-sandwich",
        description: "Spicy masala-loaded sandwich with vegetables and chutneys.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Veg Grill Sandwich", slug: "veg-grill-sandwich",
        description: "Grilled vegetable sandwich with melted butter and chutneys.",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400",
        sellingPrice: 70, mrp: 89, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 89, url: "https://zomato.com" },
          { platform: "Swiggy", price: 85, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Cheese Grill Sandwich", slug: "cheese-grill-sandwich",
        description: "Grilled cheese sandwich with mixed veggies and melted cheese.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
        sellingPrice: 90, mrp: 109, discountPct: 17,
        competitorPrices: [
          { platform: "Zomato", price: 109, url: "https://zomato.com" },
          { platform: "Swiggy", price: 99, url: "https://swiggy.com" },
        ],
      },
      {
        name: "Paneer Cheese Grill Sandwich", slug: "paneer-cheese-grill-sandwich",
        description: "Premium grilled sandwich with paneer, cheese, and veggies.",
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400",
        sellingPrice: 110, mrp: 139, discountPct: 21,
        competitorPrices: [
          { platform: "Zomato", price: 139, url: "https://zomato.com" },
          { platform: "Swiggy", price: 129, url: "https://swiggy.com" },
        ],
      },
    ],
  },
];

const COMBOS: SeedCombo[] = [
  {
    slug: "pav-bhaji-vada-pav-pani-puri-combo",
    name: "Pav Bhaji + Vada Pav + Pani Puri",
    description: "The ultimate Bombaiwala combo — butter pav bhaji, classic vada pav, and pani puri.",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400",
    itemSlugs: ["butter-pav-bhaji-2-pav", "vada-pav", "pani-puri"],
    comboPrice: 140, competitorPrices: [{ platform: "Zomato", price: 180, url: "https://zomato.com" }],
  },
  {
    slug: "cheese-pav-bhaji-masala-puri-papdi-chaat-combo",
    name: "Cheese Pav Bhaji + Masala Puri + Papdi Chaat",
    description: "Cheesy pav bhaji paired with tangy masala puri and classic papdi chaat.",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400",
    itemSlugs: ["cheese-pav-bhaji-2-pav", "masala-puri", "papdi-chaat"],
    comboPrice: 199, competitorPrices: [{ platform: "Zomato", price: 259, url: "https://zomato.com" }],
  },
  {
    slug: "masala-pav-bhaji-paneer-grill-dahi-samosa-combo",
    name: "Masala Pav Bhaji + Paneer Cheese Grill Sandwich + Dahi Samosa",
    description: "Spicy masala pav bhaji with a loaded paneer grill and creamy dahi samosa.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400",
    itemSlugs: ["masala-pav-bhaji-2-pav", "paneer-cheese-grill-sandwich", "dahi-samosa"],
    comboPrice: 239, competitorPrices: [{ platform: "Zomato", price: 299, url: "https://zomato.com" }],
  },
  {
    slug: "vada-pav-sev-puri-cheese-sandwich-combo",
    name: "Vada Pav + Sev Puri + Cheese Sandwich",
    description: "Street food trio — vada pav, sev puri, and a cheesy sandwich.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
    itemSlugs: ["vada-pav", "sev-puri", "cheese-sandwich"],
    comboPrice: 139, competitorPrices: [{ platform: "Zomato", price: 179, url: "https://zomato.com" }],
  },
  {
    slug: "butter-pav-bhaji-bhel-puri-combo",
    name: "Butter Pav Bhaji + Bhel Puri",
    description: "Classic butter pav bhaji with a side of tangy bhel puri.",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400",
    itemSlugs: ["butter-pav-bhaji-2-pav", "bhel-puri"],
    comboPrice: 125, competitorPrices: [{ platform: "Zomato", price: 165, url: "https://zomato.com" }],
  },
  {
    slug: "paneer-pav-bhaji-dahi-puri-samosa-chaat-combo",
    name: "Paneer Pav Bhaji + Dahi Puri + Samosa Chaat",
    description: "Rich paneer pav bhaji, creamy dahi puri, and crispy samosa chaat.",
    image: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400",
    itemSlugs: ["paneer-pav-bhaji-2-pav", "dahi-puri", "samosa-chaat"],
    comboPrice: 199, competitorPrices: [{ platform: "Zomato", price: 249, url: "https://zomato.com" }],
  },
  {
    slug: "cheese-vada-pav-pani-puri-veg-grill-combo",
    name: "Cheese Vada Pav + Pani Puri + Veg Grill Sandwich",
    description: "Cheese vada pav, refreshing pani puri, and a toasted veg grill sandwich.",
    image: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    itemSlugs: ["cheese-vada-pav", "pani-puri", "veg-grill-sandwich"],
    comboPrice: 149, competitorPrices: [{ platform: "Zomato", price: 189, url: "https://zomato.com" }],
  },
  {
    slug: "aloo-tikki-ragda-masala-sandwich-combo",
    name: "Aloo Tikki Chaat + Ragda Pattice + Masala Sandwich",
    description: "Crispy aloo tikki chaat, spicy ragda pattice, and a masala sandwich.",
    image: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=400",
    itemSlugs: ["aloo-tikki-chaat", "ragda-pattice", "masala-sandwich"],
    comboPrice: 179, competitorPrices: [{ platform: "Zomato", price: 229, url: "https://zomato.com" }],
  },
];

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
    const docId = `chaat-${c.slug}`;
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
      const docId = `chaat-${p.slug}`;
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
      // Find the product name from the categories
      let productName = slug;
      for (const cat of CATEGORIES) {
        const found = cat.products.find((p) => p.slug === slug);
        if (found) { productName = found.name; break; }
      }
      return { productId, productName, qty: 1 };
    }).filter((it) => it.productId);
    if (items.length === 0) continue;
    const docId = `chaat-${c.slug}`;
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
