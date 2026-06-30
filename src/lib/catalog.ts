// Firestore CRUD helpers
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export type Brand = "chaat" | "juice";

export interface Category {
  id: string;
  brand: Brand;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  active: boolean;
}

export interface CompetitorPrice {
  platform: string;
  price: number;
  url?: string;
}

export interface Variant {
  name: string;
  price: number;
  sku?: string;
}

export interface Product {
  id: string;
  brand: Brand;
  categoryId: string;
  name: string;
  description?: string;
  images: string[];
  sellingPrice: number;
  mrp: number;
  discountPct: number;
  competitorPrices: CompetitorPrice[];
  variants: Variant[];
  inStock: boolean;
  stockQty?: number;
  tags: string[];
  prepTimeMin?: number;
  isVeg: boolean;
  spiceLevel?: number;
  featured: boolean;
  active: boolean;
}

export interface ComboItem {
  productId: string;
  productName: string;
  variant?: string;
  qty: number;
}

export interface Combo {
  id: string;
  brand: Brand;
  name: string;
  description?: string;
  image?: string;
  items: ComboItem[];
  comboPrice: number;
  competitorPrices: CompetitorPrice[];
  active: boolean;
}

export function subscribeCollection<T>(
  name: string,
  constraints: QueryConstraint[],
  cb: (rows: T[]) => void,
): Unsubscribe {
  const q = query(collection(db, name), ...constraints);
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T));
  });
}

export const byBrand = (brand: Brand) => where("brand", "==", brand);
export const sorted = (field: string, dir: "asc" | "desc" = "asc") => orderBy(field, dir);

export async function createDoc<T extends object>(name: string, data: T) {
  return addDoc(collection(db, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDocById(name: string, id: string, data: object) {
  return updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocById(name: string, id: string) {
  return deleteDoc(doc(db, name, id));
}
