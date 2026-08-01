import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve('backend/data/catalog_categories.json');

const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "General", code: "GEN", description: "General items and uncategorized master products", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-2", name: "Pharmacy", code: "MED", description: "Prescription medicines, tablets, and healthcare supplies", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-3", name: "Grocery", code: "GRO", description: "Grains, pulses, oils, and provisions", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-4", name: "Electronics", code: "ELE", description: "Consumer gadgets, cables, and appliances", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-5", name: "Clothing", code: "CLO", description: "Apparel, garments, and textiles", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-6", name: "Cosmetics", code: "COSM", description: "Skincare, haircare, and beauty products", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }
];

let categoriesStore = null;

function ensureDataDirectory() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCategoriesFromFile() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading catalog categories from file:', err);
  }
  return [...DEFAULT_CATEGORIES];
}

function saveCategoriesToFile(categories) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(categories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving catalog categories to file:', err);
  }
}

export const catalogRepository = {
  getAll: async () => {
    if (!categoriesStore) {
      categoriesStore = loadCategoriesFromFile();
    }
    return categoriesStore;
  },

  getById: async (id) => {
    const categories = await catalogRepository.getAll();
    return categories.find(c => c.id === id) || null;
  },

  save: async (categoryData) => {
    const categories = await catalogRepository.getAll();
    const existingIndex = categories.findIndex(
      c => c.id === categoryData.id || (c.name && c.name.toLowerCase() === (categoryData.name || '').toLowerCase())
    );

    const cleanCode = categoryData.code && categoryData.code.trim()
      ? categoryData.code.trim().toUpperCase()
      : (categoryData.name || 'GEN').substring(0, 3).toUpperCase();

    const record = {
      id: categoryData.id || `cat-${Date.now()}`,
      name: (categoryData.name || '').trim(),
      code: cleanCode,
      description: (categoryData.description || '').trim(),
      status: categoryData.status || 'Active',
      image: (categoryData.image || '').trim(),
      createdAt: categoryData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex > -1) {
      categories[existingIndex] = { ...categories[existingIndex], ...record };
    } else {
      categories.unshift(record);
    }

    categoriesStore = categories;
    saveCategoriesToFile(categoriesStore);
    return record;
  },

  delete: async (id) => {
    let categories = await catalogRepository.getAll();
    categories = categories.filter(c => c.id !== id);
    categoriesStore = categories;
    saveCategoriesToFile(categoriesStore);
    return { success: true, id };
  }
};
