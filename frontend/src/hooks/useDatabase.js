import { useState, useEffect, useCallback } from "react";
import { initialMockDatabase } from "../mockDb.js";
import { DEFAULT_CATEGORIES } from "../utils/catalogUtils.js";
import { 
  fetchProducts, fetchCustomers, fetchTransactions, fetchExpenses,
  fetchCatalogCategories, subscribeToDatabaseChanges 
} from "../lib/supabaseService.js";

export function useDatabase(activeBusinessId) {
  const [db, setDb] = useState(() => {
    const saved = localStorage.getItem("vyapaar_db_v2_clean");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
          parsed.categories = DEFAULT_CATEGORIES;
        }
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return initialMockDatabase;
  });

  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [supabaseError, setSupabaseError] = useState(null);

  // Save database to localStorage
  useEffect(() => {
    localStorage.setItem("vyapaar_db_v2_clean", JSON.stringify(db));
  }, [db]);

  const refreshCatalogCategories = useCallback(async () => {
    try {
      const cats = await fetchCatalogCategories(activeBusinessId);
      if (cats && Array.isArray(cats) && cats.length > 0) {
        setDb(prev => ({
          ...prev,
          categories: cats
        }));
        return cats;
      }
    } catch (err) {
      console.warn("Failed to refresh catalog categories:", err);
    }
    return null;
  }, [activeBusinessId]);

  const loadSupabaseData = async () => {
    setIsSupabaseLoading(true);
    setSupabaseError(null);
    try {
      const [prods, custs, txs, exps, cats] = await Promise.all([
        fetchProducts(activeBusinessId).catch(() => []),
        fetchCustomers(activeBusinessId).catch(() => []),
        fetchTransactions(activeBusinessId).catch(() => []),
        fetchExpenses(activeBusinessId).catch(() => []),
        fetchCatalogCategories(activeBusinessId).catch(() => [])
      ]);

      setDb(prev => ({
        ...prev,
        categories: cats && cats.length > 0 ? cats : (prev.categories && prev.categories.length > 0 ? prev.categories : DEFAULT_CATEGORIES),
        products: prods.length > 0 ? prods : prev.products,
        customers: custs.length > 0 ? custs : prev.customers,
        bills: txs.length > 0 ? txs : prev.bills,
        journal: exps.length > 0 ? [...prev.journal, ...exps] : prev.journal
      }));
    } catch (err) {
      console.warn("Supabase initial fetch warning:", err);
      setSupabaseError(err.message || "Failed to load from Supabase cloud database");
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();

    const unsubscribe = subscribeToDatabaseChanges((payload) => {
      console.log("PostgreSQL Real-time change received:", payload);
      loadSupabaseData();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeBusinessId]);

  return {
    db,
    setDb,
    isSupabaseLoading,
    supabaseError,
    loadSupabaseData,
    refreshCatalogCategories
  };
}
