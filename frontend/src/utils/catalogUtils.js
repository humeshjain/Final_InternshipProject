export const DEFAULT_CATEGORIES = [
  { id: "cat-1", name: "General", code: "GEN", description: "General items and uncategorized master products", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-2", name: "Pharmacy", code: "MED", description: "Prescription medicines, tablets, and healthcare supplies", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-3", name: "Grocery", code: "GRO", description: "Grains, pulses, oils, and provisions", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-4", name: "Electronics", code: "ELE", description: "Consumer gadgets, cables, and appliances", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-5", name: "Clothing", code: "CLO", description: "Apparel, garments, and textiles", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cat-6", name: "Cosmetics", code: "COSM", description: "Skincare, haircare, and beauty products", status: "Active", image: "", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }
];

/**
 * Normalizes categories list from database or default fallback
 */
export function getCategories(db) {
  if (!db || !db.categories || !Array.isArray(db.categories) || db.categories.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  return db.categories.map((c, idx) => {
    if (typeof c === "string") {
      const code = c.substring(0, 3).toUpperCase();
      return {
        id: `cat-${idx + 1}`,
        name: c,
        code: code,
        description: `${c} catalog category`,
        status: "Active",
        image: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      };
    }
    return {
      id: c.id || `cat-${idx + 1}`,
      name: c.name || "Unassigned",
      code: c.code || (c.name ? c.name.substring(0, 3).toUpperCase() : "GEN"),
      description: c.description || "",
      status: c.status || "Active",
      image: c.image || "",
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString()
    };
  });
}

/**
 * Returns clean category code prefix for SKU generation (e.g. ELE, GRO, MED)
 */
export function getCategoryCodePrefix(category) {
  if (!category) return "GEN";

  let rawCode = category.code || "";
  if (rawCode) {
    // Strip "CAT-" or "CAT_" prefix if present
    const cleaned = rawCode.replace(/^CAT[-_]?/i, "").trim().toUpperCase();
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 5);
    }
  }

  // Fallback to name prefix
  const rawName = (category.name || "GEN").trim();
  if (rawName.toLowerCase().includes("pharmacy") || rawName.toLowerCase().includes("medicine")) {
    return "MED";
  }
  if (rawName.toLowerCase().includes("grocery") || rawName.toLowerCase().includes("food")) {
    return "GRO";
  }
  if (rawName.toLowerCase().includes("electronic") || rawName.toLowerCase().includes("gadget")) {
    return "ELE";
  }

  return rawName.substring(0, 3).toUpperCase();
}

/**
 * Auto-generates unique SKU for product based on selected category (e.g., ELE-0001, GRO-0001)
 */
export function generateSkuForCategory(category, products = [], currentProductId = null) {
  const prefix = getCategoryCodePrefix(category);
  const prefixRegex = new RegExp(`^${prefix}-(\\d+)$`, "i");

  let maxSeq = 0;

  (products || []).forEach(p => {
    if (p.id === currentProductId) return;
    if (p.sku) {
      const match = p.sku.trim().match(prefixRegex);
      if (match && match[1]) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let sku = `${prefix}-${String(nextSeq).padStart(4, "0")}`;

  // Ensure strict uniqueness in case existing SKUs are formatted differently
  while ((products || []).some(p => p.id !== currentProductId && (p.sku || "").trim().toLowerCase() === sku.toLowerCase())) {
    nextSeq += 1;
    sku = `${prefix}-${String(nextSeq).padStart(4, "0")}`;
  }

  return sku;
}

/**
 * Validates Category before saving
 */
export function validateCategory(categoryData, existingCategories = [], editingId = null) {
  const name = (categoryData.name || "").trim();
  if (!name) {
    return { isValid: false, error: "Category Name is required." };
  }

  // Check duplicate category name
  const isDuplicateName = existingCategories.some(
    c => c.id !== editingId && (c.name || "").trim().toLowerCase() === name.toLowerCase()
  );
  if (isDuplicateName) {
    return { isValid: false, error: `Category with name "${name}" already exists.` };
  }

  // Check duplicate category code if provided
  const code = (categoryData.code || "").trim();
  if (code) {
    const isDuplicateCode = existingCategories.some(
      c => c.id !== editingId && (c.code || "").trim().toLowerCase() === code.toLowerCase()
    );
    if (isDuplicateCode) {
      return { isValid: false, error: `Category code "${code}" is already assigned to another category.` };
    }
  }

  return { isValid: true };
}

/**
 * Validates SKU before saving product
 */
export function validateSku(sku, products = [], editingProductId = null) {
  const cleanSku = (sku || "").trim();
  if (!cleanSku) {
    return { isValid: false, error: "SKU is required." };
  }

  const isDuplicate = (products || []).some(
    p => p.id !== editingProductId && (p.sku || "").trim().toLowerCase() === cleanSku.toLowerCase()
  );

  if (isDuplicate) {
    return { isValid: false, error: `SKU "${cleanSku}" is already assigned to another product. SKUs must be unique.` };
  }

  return { isValid: true };
}
