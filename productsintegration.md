# Bombaiwala — Products Integration Guide (for Frontend Devs)

## Overview

Bombaiwala runs **two brands** from the same Firestore database. Both brands share the same three collections but are separated by the `brand` field.

| Brand | `brand` value | What it sells |
|-------|--------------|---------------|
| Bombaiwala Chaat | `"chaat"` | Pav Bhaji, Vada Pav, Chaat, Sandwiches |
| Bombaiwala Juice | `"juice"` | Fresh Juices, Fruit Bowls, Milkshakes, Desserts |

---

## Firestore Collections

All data lives in **3 collections**:

```
firestore/
├── categories/     ← Both chaat + juice categories
├── products/       ← Both chaat + juice products
└── combos/         ← Both chaat + juice combos
```

### How to Separate Brands

Every document has a `brand` field. **Always filter by brand** when querying:

```typescript
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Get all CHAAT categories
const chaatCats = await getDocs(
  query(collection(db, "categories"), where("brand", "==", "chaat"), orderBy("sortOrder"))
);

// Get all JUICE products
const juiceProds = await getDocs(
  query(collection(db, "products"), where("brand", "==", "juice"))
);

// Get all CHAAT combos
const chaatCombos = await getDocs(
  query(collection(db, "combos"), where("brand", "==", "chaat"), where("active", "==", true))
);
```

### Real-time Listener Example

```typescript
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

function subscribeToChaatProducts(callback: (products: Product[]) => void) {
  const q = query(
    collection(db, "products"),
    where("brand", "==", "chaat"),
    where("active", "==", true)
  );
  return onSnapshot(q, (snap) => {
    const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(products);
  });
}
```

---

## Document ID Format

All documents use **slug-based IDs** prefixed with the brand:

| Collection | ID Format | Example |
|------------|-----------|---------|
| categories | `{brand}-{slug}` | `chaat-pav-bhaji`, `juice-milkshakes` |
| products | `{brand}-{slug}` | `chaat-butter-pav-bhaji-2-pav`, `juice-apple-juice-350ml` |
| combos | `{brand}-{slug}` | `chaat-pav-bhaji-vada-pav-pani-puri-combo` |

This means you can directly access a doc by its slug-based ID:

```typescript
import { doc, getDoc } from "firebase/firestore";

// Direct access by ID
const pavBhaji = await getDoc(doc(db, "products", "chaat-butter-pav-bhaji-2-pav"));
```

---

## Document Schemas

### Category

```typescript
{
  brand: "chaat" | "juice",        // ← filter by this
  name: "Pav Bhaji",
  slug: "pav-bhaji",
  image: "https://...",            // category cover image
  sortOrder: 0,                    // display order
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Product

```typescript
{
  brand: "chaat" | "juice",        // ← filter by this
  categoryId: "chaat-pav-bhaji",   // references categories/{id}
  name: "Butter Pav Bhaji [2 Pav]",
  slug: "butter-pav-bhaji-2-pav",
  description: "Classic butter pav bhaji...",
  images: ["https://..."],         // array of image URLs
  sellingPrice: 80,                // ₹ — the price customers pay
  mrp: 99,                         // ₹ — maximum retail price
  discountPct: 19,                 // % discount from MRP
  competitorPrices: [
    { platform: "Zomato", price: 99, url: "https://zomato.com" },
    { platform: "Swiggy", price: 95, url: "https://swiggy.com" },
  ],
  inStock: true,
  tags: [],
  isVeg: true,
  featured: false,
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Combo

```typescript
{
  brand: "chaat" | "juice",        // ← filter by this
  name: "Pav Bhaji + Vada Pav + Pani Puri",
  slug: "pav-bhaji-vada-pav-pani-puri-combo",
  description: "The ultimate Bombaiwala combo...",
  image: "https://...",
  items: [
    { productId: "chaat-butter-pav-bhaji-2-pav", productName: "Butter Pav Bhaji [2 Pav]", qty: 1 },
    { productId: "chaat-vada-pav", productName: "Vada Pav", qty: 1 },
    { productId: "chaat-pani-puri", productName: "Pani Puri", qty: 1 },
  ],
  comboPrice: 140,                 // ₹ — combo deal price
  competitorPrices: [
    { platform: "Zomato", price: 180, url: "https://zomato.com" },
  ],
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## Frontend Page Structure (Suggested)

```
/                          ← Landing page with both brands
/chaat                     ← Chaat brand page (filter brand="chaat")
/chaat/pav-bhaji           ← Category page (filter categoryId="chaat-pav-bhaji")
/chaat/butter-pav-bhaji    ← Product detail page (doc ID: "chaat-butter-pav-bhaji-2-pav")
/juice                     ← Juice brand page (filter brand="juice")
/juice/milkshakes          ← Category page (filter categoryId="juice-milkshakes")
/juice/apple-juice-350ml   ← Product detail page
/combos                    ← All combos from both brands
```

---

## Pricing Display Logic

```typescript
function getPriceDisplay(product: Product) {
  const hasDiscount = product.discountPct > 0 && product.mrp > product.sellingPrice;
  return {
    price: product.sellingPrice,           // Show this as the main price
    originalPrice: hasDiscount ? product.mrp : null,   // Strikethrough price
    discount: hasDiscount ? `${product.discountPct}% OFF` : null,
    savingsText: hasDiscount ? `Save ₹${product.mrp - product.sellingPrice}` : null,
  };
}
```

---

## Getting Products by Category

```typescript
// Step 1: Get all chaat categories
const catsSnap = await getDocs(
  query(collection(db, "categories"), where("brand", "==", "chaat"), orderBy("sortOrder"))
);
const categories = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

// Step 2: For each category, get its products
for (const cat of categories) {
  const prodsSnap = await getDocs(
    query(
      collection(db, "products"),
      where("brand", "==", "chaat"),
      where("categoryId", "==", cat.id),
      where("active", "==", true)
    )
  );
  const products = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`${cat.name}: ${products.length} products`);
}
```

---

## Competitor Price Comparison

Use `competitorPrices` to show a price comparison table or badge:

```typescript
function getSavingsFromCompetitor(product: Product) {
  return product.competitorPrices.map(cp => ({
    platform: cp.platform,
    theirPrice: cp.price,
    ourPrice: product.sellingPrice,
    savings: cp.price - product.sellingPrice,
    savingsText: `₹${cp.price - product.sellingPrice} cheaper than ${cp.platform}`,
  }));
}
```

---

## Firestore Index Requirements

Create these **composite indexes** in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|------------|--------|-------|
| `categories` | `brand` (==), `sortOrder` (Asc) | Ascending |
| `products` | `brand` (==), `categoryId` (==), `active` (==) | — |
| `products` | `brand` (==), `active` (==) | — |
| `combos` | `brand` (==), `active` (==) | — |

> **Tip:** Firestore will auto-suggest these indexes when you first run a query that needs them. Just click the link in the console error.

---

## Quick Reference: All Chaat Product Slugs

| Product | Doc ID |
|---------|--------|
| Butter Pav Bhaji [2 Pav] | `chaat-butter-pav-bhaji-2-pav` |
| Paneer Pav Bhaji [2 Pav] | `chaat-paneer-pav-bhaji-2-pav` |
| Cheese Pav Bhaji [2 Pav] | `chaat-cheese-pav-bhaji-2-pav` |
| Masala Pav Bhaji [2 Pav] | `chaat-masala-pav-bhaji-2-pav` |
| Khada Pav Bhaji [2 Pav] | `chaat-khada-pav-bhaji-2-pav` |
| Jain Pav Bhaji [2 Pav] | `chaat-jain-pav-bhaji-2-pav` |
| Vada Pav | `chaat-vada-pav` |
| Vada Pav (Butter) | `chaat-vada-pav-butter` |
| Cheese Vada Pav | `chaat-cheese-vada-pav` |
| Pani Puri | `chaat-pani-puri` |
| Dahi Puri | `chaat-dahi-puri` |
| Sev Puri | `chaat-sev-puri` |
| Bhel Puri | `chaat-bhel-puri` |
| Masala Puri | `chaat-masala-puri` |
| Papdi Chaat | `chaat-papdi-chaat` |
| Dahi Papdi Chaat | `chaat-dahi-papdi-chaat` |
| Samosa Chaat | `chaat-samosa-chaat` |
| Dahi Samosa | `chaat-dahi-samosa` |
| Aloo Tikki Chaat | `chaat-aloo-tikki-chaat` |
| Aloo Tikki (Cutlet) Chaat | `chaat-aloo-tikki-cutlet-chaat` |
| Ragda Pattice | `chaat-ragda-pattice` |
| Veg Sandwich | `chaat-veg-sandwich` |
| Cheese Sandwich | `chaat-cheese-sandwich` |
| Masala Sandwich | `chaat-masala-sandwich` |
| Veg Grill Sandwich | `chaat-veg-grill-sandwich` |
| Cheese Grill Sandwich | `chaat-cheese-grill-sandwich` |
| Paneer Cheese Grill Sandwich | `chaat-paneer-cheese-grill-sandwich` |

## Quick Reference: All Juice Product Slugs

| Product | Doc ID |
|---------|--------|
| Apple Juice (350ml) | `juice-apple-juice-350ml` |
| Pineapple Juice (350ml) | `juice-pineapple-juice-350ml` |
| Black Grapes Juice (350ml) | `juice-black-grapes-juice-350ml` |
| Watermelon Juice (350ml) | `juice-watermelon-juice-350ml` |
| Muskmelon Juice (350ml) | `juice-muskmelon-juice-350ml` |
| Papaya Juice (350ml) | `juice-papaya-juice-350ml` |
| Sapota Juice (350ml) | `juice-sapota-juice-350ml` |
| Anar Juice (350ml) | `juice-anar-juice-350ml` |
| Cocktail Juice (350ml) | `juice-cocktail-juice-350ml` |
| Avocado Juice (350ml) | `juice-avocado-juice-350ml` |
| Fruits Bowl (Regular) | `juice-fruits-bowl-regular` |
| Watermelon Bowl (500ml) | `juice-watermelon-bowl-500ml` |
| Papaya Bowl (500ml) | `juice-papaya-bowl-500ml` |
| Pineapple Bowl (500ml) | `juice-pineapple-bowl-500ml` |
| Special Fruit Fusion Bowl | `juice-special-fruit-fusion-bowl` |
| Litchi Milkshake | `juice-litchi-milkshake` |
| Blackcurrant Milkshake | `juice-blackcurrant-milkshake` |
| Blueberry Milkshake | `juice-blueberry-milkshake` |
| Cold Coffee Milkshake | `juice-cold-coffee-milkshake` |
| Fruit Custard | `juice-fruit-custard` |
