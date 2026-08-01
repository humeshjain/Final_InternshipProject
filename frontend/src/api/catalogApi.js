import { supabase } from '../lib/supabaseClient.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchCatalogCategories(businessId) {
  try {
    // 1. Fetch directly from Backend Catalog Categories API
    const response = await fetch(`${API_BASE_URL}/api/catalog/categories`);
    if (response.ok) {
      const result = await response.json();
      const categories = result.data || result.categories || result;
      if (Array.isArray(categories) && categories.length > 0) {
        return categories.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code || (c.name || 'GEN').substring(0, 3).toUpperCase(),
          description: c.description || '',
          status: c.status || 'Active',
          image: c.image || '',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString()
        }));
      }
    }
  } catch (err) {
    console.warn('Backend Catalog API fetch notice:', err);
  }

  // 2. Fallback to Supabase if configured
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (!error && data && data.length > 0) {
        return data.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code || (c.name || 'GEN').substring(0, 3).toUpperCase(),
          description: c.description || '',
          status: c.status || 'Active',
          image: c.image || '',
          createdAt: c.created_at || new Date().toISOString(),
          updatedAt: c.updated_at || new Date().toISOString()
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase categories fetch notice:', err);
  }

  return [];
}

export async function saveCatalogCategory(categoryData) {
  let savedRecord = null;

  // 1. Save directly to Backend Catalog Categories API
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    if (response.ok) {
      const result = await response.json();
      savedRecord = result.data || categoryData;
    }
  } catch (err) {
    console.warn('Backend Catalog API save notice:', err);
  }

  // 2. Sync to Supabase if configured
  try {
    if (supabase) {
      await supabase.from('categories').upsert({
        id: categoryData.id,
        name: categoryData.name,
        code: categoryData.code,
        description: categoryData.description,
        status: categoryData.status || 'Active'
      });
    }
  } catch (err) {
    console.warn('Supabase categories save notice:', err);
  }

  return savedRecord || categoryData;
}

export async function deleteCatalogCategory(id) {
  try {
    await fetch(`${API_BASE_URL}/api/catalog/categories/${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Backend Catalog API delete notice:', err);
  }

  try {
    if (supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase categories delete notice:', err);
  }
}
