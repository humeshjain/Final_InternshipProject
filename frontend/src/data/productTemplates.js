export const DEFAULT_PRODUCT_TYPES = [
  { id: "Grocery", name: "Grocery", defaultFields: ["Weight", "Unit", "Brand", "MRP", "Purchase Price", "Selling Price", "GST"] },
  { id: "Electronics", name: "Electronics", defaultFields: ["Brand", "Model", "Warranty", "Serial Number", "Specifications"] },
  { id: "Clothing", name: "Clothing", defaultFields: ["Size", "Color", "Material", "Brand", "Gender", "Season"] },
  { id: "Pharmacy", name: "Pharmacy", defaultFields: ["Batch Number", "Expiry Date", "Manufacturer", "Dosage", "Schedule Type"] },
  { id: "Hardware", name: "Hardware", defaultFields: ["Brand", "Material", "Size", "Grade"] },
  { id: "Furniture", name: "Furniture", defaultFields: ["Material", "Dimensions", "Weight", "Color"] },
  { id: "Stationery", name: "Stationery", defaultFields: ["Brand", "Quantity Per Pack", "Color"] },
  { id: "Restaurant/Food", name: "Restaurant/Food", defaultFields: ["Portion Size", "Ingredients", "Preparation Time"] },
  { id: "Bakery", name: "Bakery", defaultFields: ["Shelf Life", "Egg/Eggless", "Allergens"] },
  { id: "Cosmetics", name: "Cosmetics", defaultFields: ["Brand", "Volume/Weight", "Skin Type", "Expiry Date"] },
  { id: "Sports", name: "Sports", defaultFields: ["Brand", "Size", "Material", "Warranty"] },
  { id: "Jewelry", name: "Jewelry", defaultFields: ["Material", "Purity", "Weight", "Certification"] },
  { id: "Automotive", name: "Automotive", defaultFields: ["Brand", "Part Number", "Model Compatibility", "Warranty"] },
  { id: "Agriculture", name: "Agriculture", defaultFields: ["Type", "Shelf Life", "Usage Instructions"] },
  { id: "Services", name: "Services", defaultFields: ["Duration", "Service Specialist", "SLA Support"] }
];

export const CATEGORY_TO_PRODUCT_TYPES_MAP = {
  "Grocery": ["Grocery", "Bakery", "Stationery"],
  "Electronics": ["Electronics", "Services"],
  "Clothing": ["Clothing", "Cosmetics"],
  "Pharmacy": ["Pharmacy", "Cosmetics"],
  "Hardware": ["Hardware", "Furniture", "Automotive"],
  "Furniture": ["Furniture", "Services"],
  "Stationery": ["Stationery"],
  "Restaurant/Food": ["Restaurant/Food", "Bakery"],
  "Bakery": ["Bakery", "Restaurant/Food"],
  "Cosmetics": ["Cosmetics", "Services"],
  "Sports": ["Sports", "Clothing"],
  "Jewelry": ["Jewelry"],
  "Automotive": ["Automotive", "Services"],
  "Agriculture": ["Agriculture", "Grocery"],
  "Services": ["Services"]
};
