import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { normalizeOrder, type NormalizedOrder } from "@/lib/orders";

export function useOrders(limitN = 200) {
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), fsLimit(limitN));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => normalizeOrder(d.id, d.data() as Record<string, unknown>)));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [limitN]);
  return { orders, loading };
}

export function useCollection<T>(name: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, name),
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [name]);
  return { rows, loading };
}
