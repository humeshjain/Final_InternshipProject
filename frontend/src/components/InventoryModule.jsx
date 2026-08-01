import React, { useState, useEffect, useMemo } from "react";
import { 
  Package, Plus, TrendingUp, RefreshCw, AlertTriangle, Settings, 
  Tag, Edit2, Trash2, Check, X, Sparkles, Upload, Download, Lock, Unlock, Layers,
  Search, SlidersHorizontal, ArrowUpDown, Calendar, Filter
} from "lucide-react";
import { DEFAULT_PRODUCT_TYPES } from "../data/productTemplates";
import { saveProduct, deleteProduct } from "../lib/supabaseService";
import CategorySelect from "./common/CategorySelect.jsx";
import { 
  getCategories, generateSkuForCategory, validateSku 
} from "../utils/catalogUtils.js";

export default function InventoryModule({
  db,
  setDb,
  refreshCatalogCategories,
  activeProducts,
  isOffline,
  addNotification,
  activeBusinessId,
  runAutoReorder,
  triggerImportExport
}) {
  // Find active business configuration
  const activeBusiness = db.businesses?.find((b) => b.id === activeBusinessId) || db.businesses?.[0] || {};
  const enabledProductTypes = activeBusiness?.enabledProductTypes || ["Grocery", "Electronics", "Clothing", "Pharmacy"];
  const customProductTypes = activeBusiness?.customProductTypes || [];

  // Active product types combining standard ones that are enabled, and any custom ones
  const activeTypes = [
    ...DEFAULT_PRODUCT_TYPES.filter(t => enabledProductTypes.includes(t.id)),
    ...customProductTypes.filter((t) => enabledProductTypes.includes(t.name))
  ];

  // Retrieve Master Catalog Categories
  const categoriesList = useMemo(() => getCategories(db), [db?.categories]);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return categoriesList.find(c => (c.status || "Active").toLowerCase() === "active") || categoriesList[0] || null;
  });
  const [isSkuEditable, setIsSkuEditable] = useState(false);

  // Filters & Sorting States for Stock Registry
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");

  const [attributes, setAttributes] = useState({});

  const [newProductForm, setNewProductForm] = useState({
    name: "",
    sku: "",
    brand: "",
    barcode: "",
    purchasePrice: 0,
    salePrice: 0,
    mrp: 0,
    gstPercent: 18,
    hsnCode: "",
    stock: 0,
    minStock: 5,
    unit: "pcs",
    description: "",
    status: "Active"
  });

  // Fetch latest Catalog Categories from backend whenever Register New SKU form is opened
  useEffect(() => {
    if (isAddingProduct && refreshCatalogCategories) {
      refreshCatalogCategories().then(freshCats => {
        if (freshCats && freshCats.length > 0) {
          const activeCats = freshCats.filter(c => (c.status || "Active").toLowerCase() === "active");
          if (activeCats.length > 0) {
            setSelectedCategory(prev => {
              if (!prev) return activeCats[0];
              const match = activeCats.find(c => c.id === prev.id || c.name.toLowerCase() === prev.name.toLowerCase());
              return match || activeCats[0];
            });
          }
        }
      });
    }
  }, [isAddingProduct]);

  // Keep selectedCategory updated when categories list changes or initializes
  useEffect(() => {
    if (categoriesList.length > 0) {
      const activeCats = categoriesList.filter(c => (c.status || "Active").toLowerCase() === "active");
      if (!selectedCategory) {
        if (activeCats.length > 0) {
          setSelectedCategory(activeCats[0]);
        }
      } else {
        const found = activeCats.find(c => c.id === selectedCategory.id || c.name.toLowerCase() === selectedCategory.name.toLowerCase());
        if (found) {
          if (found.name !== selectedCategory.name || found.code !== selectedCategory.code) {
            setSelectedCategory(found);
          }
        } else if (activeCats.length > 0) {
          setSelectedCategory(activeCats[0]);
        }
      }
    } else {
      setSelectedCategory(null);
    }
  }, [categoriesList]);

  // When selectedCategory changes, auto-generate unique SKU based on Category
  useEffect(() => {
    if (selectedCategory && isAddingProduct) {
      const autoSku = generateSkuForCategory(selectedCategory, db.products || []);
      setNewProductForm(prev => ({
        ...prev,
        sku: autoSku
      }));
    }
  }, [selectedCategory, isAddingProduct]);

  // Product editing states
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductForm, setEditingProductForm] = useState(null);

  // Scanner Simulator States
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerTarget, setScannerTarget] = useState("create");

  const generateAutoBarcode = () => {
    const randomNum = Math.floor(100000000000 + Math.random() * 900000000000);
    setNewProductForm(prev => ({
      ...prev,
      barcode: String(randomNum)
    }));
    if (addNotification) addNotification("Auto-generated Barcode: " + randomNum, "success");
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setEditingProductForm({ ...product });
  };

  const handleSaveEdit = async () => {
    if (!editingProductForm) return;
    if (!editingProductForm.name.trim()) {
      if (addNotification) addNotification("Product Name is required.", "error");
      return;
    }
    if (editingProductForm.salePrice < 0) {
      if (addNotification) addNotification("Sale Price cannot be negative.", "error");
      return;
    }

    // Validate SKU uniqueness
    const skuValidation = validateSku(editingProductForm.sku, db.products || [], editingProductId);
    if (!skuValidation.isValid) {
      if (addNotification) addNotification(skuValidation.error, "error");
      return;
    }

    try {
      await saveProduct(editingProductForm);
    } catch (err) {
      console.warn("Supabase product edit notice:", err);
    }

    setDb((prev) => ({
      ...prev,
      products: (prev.products || []).map((p) => p.id === editingProductId ? { ...editingProductForm } : p)
    }));

    if (addNotification) addNotification(`Product "${editingProductForm.name}" updated successfully.`, "success");
    setEditingProductId(null);
    setEditingProductForm(null);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}" from your inventory catalog?`)) {
      try {
        await deleteProduct(productId);
      } catch (err) {
        console.warn("Supabase product delete notice:", err);
      }

      setDb((prev) => ({
        ...prev,
        products: (prev.products || []).filter((p) => p.id !== productId)
      }));
      if (addNotification) addNotification(`Product "${productName}" removed from catalog.`, "success");
    }
  };

  // Set default selected product type
  useEffect(() => {
    if (activeTypes.length > 0 && !selectedType) {
      setSelectedType(activeTypes[0].id || activeTypes[0].name);
    }
  }, [activeTypes, selectedType]);

  const handleTypeChange = (typeName) => {
    setSelectedType(typeName);
    const selectedTypeObj = activeTypes.find(t => t.id === typeName || t.name === typeName);
    if (selectedTypeObj) {
      const initialAttrs = {};
      selectedTypeObj.defaultFields.forEach(field => {
        initialAttrs[field] = "";
      });
      setAttributes(initialAttrs);
    } else {
      setAttributes({});
    }
  };

  const handleCategorySelect = (catObj) => {
    setSelectedCategory(catObj);
    const autoSku = generateSkuForCategory(catObj, db.products || []);
    setNewProductForm(prev => ({
      ...prev,
      sku: autoSku
    }));
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      if (addNotification) addNotification("Product Name is required.", "error");
      return;
    }

    if (!selectedCategory) {
      if (addNotification) addNotification("Please select a valid Catalog Category.", "error");
      return;
    }

    // Validate SKU uniqueness
    const skuValidation = validateSku(newProductForm.sku, db.products || []);
    if (!skuValidation.isValid) {
      if (addNotification) addNotification(skuValidation.error, "error");
      return;
    }

    const batch = attributes["Batch Number"] || attributes["Batch"] || "";
    const expiry = attributes["Expiry Date"] || attributes["Expiry"] || "";

    const finalSku = newProductForm.sku.trim();
    const finalBarcode = newProductForm.barcode.trim() || Date.now().toString();
    const finalQrCode = finalSku ? `QR-${finalSku}` : "";

    const newProd = {
      id: "prod-" + Date.now(),
      tenant_id: "tenant-main",
      business_id: activeBusinessId,
      created_by: "user-1",
      updated_by: "user-1",
      name: newProductForm.name.trim(),
      sku: finalSku,
      barcode: finalBarcode,
      qrCode: finalQrCode,
      categoryId: selectedCategory.id,
      category: selectedCategory.name,
      brand: newProductForm.brand ? newProductForm.brand.trim() : "",
      purchasePrice: Number(newProductForm.purchasePrice) || 0,
      salePrice: Number(newProductForm.salePrice) || 0,
      mrp: Number(newProductForm.mrp) || Number(newProductForm.salePrice) || 0,
      gstPercent: Number(newProductForm.gstPercent) || 0,
      hsnCode: newProductForm.hsnCode ? newProductForm.hsnCode.trim() : "",
      stock: Number(newProductForm.stock) || 0,
      minStockLevel: Number(newProductForm.minStock) || 0,
      description: newProductForm.description ? newProductForm.description.trim() : "",
      status: newProductForm.status || "Active",
      warehouseId: "wh-1",
      batchNumber: batch || undefined,
      expiryDate: expiry || undefined,
      productType: selectedCategory.name,
      attributes: attributes,
      unit: newProductForm.unit || "pcs",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isOffline) {
      if (addNotification) addNotification(`Added product "${newProd.name}" offline! Will sync with cloud soon.`, "success");
      setIsAddingProduct(false);
      resetForm();
      return;
    }

    // Persist to Supabase
    saveProduct(newProd).catch(err => console.warn("Supabase product save notice:", err));

    setDb((prev) => ({
      ...prev,
      products: [newProd, ...(prev.products || [])]
    }));

    if (addNotification) addNotification(`New product "${newProd.name}" with SKU "${newProd.sku}" registered successfully.`, "success");
    setIsAddingProduct(false);
    resetForm();
  };

  const resetForm = () => {
    const activeCats = categoriesList.filter(c => (c.status || "Active") === "Active");
    const defaultCat = activeCats[0] || categoriesList[0];
    setSelectedCategory(defaultCat);
    const defaultSku = defaultCat ? generateSkuForCategory(defaultCat, db.products || []) : "";

    setNewProductForm({
      name: "",
      sku: defaultSku,
      brand: "",
      barcode: "",
      purchasePrice: 0,
      salePrice: 0,
      mrp: 0,
      gstPercent: 18,
      hsnCode: "",
      stock: 0,
      minStock: 5,
      unit: "pcs",
      description: "",
      status: "Active"
    });
    setIsSkuEditable(false);
    setAttributes({});
    if (activeTypes.length > 0) {
      setSelectedType(activeTypes[0].id || activeTypes[0].name);
      handleTypeChange(activeTypes[0].id || activeTypes[0].name);
    }
  };

  // Filter and sort products for Stock Registry
  const filteredProducts = useMemo(() => {
    let list = activeProducts || [];

    // Search filter (Product Name, SKU, Barcode, Brand)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(p => 
        (p.name || "").toLowerCase().includes(term) ||
        (p.sku || "").toLowerCase().includes(term) ||
        (p.barcode || "").toLowerCase().includes(term) ||
        (p.brand || "").toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      list = list.filter(p => 
        p.categoryId === categoryFilter || (p.category || "").toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Stock Status filter
    if (stockStatusFilter === "in_stock") {
      list = list.filter(p => Number(p.stock) > Number(p.minStockLevel || 0));
    } else if (stockStatusFilter === "low_stock") {
      list = list.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStockLevel || 0));
    } else if (stockStatusFilter === "out_of_stock") {
      list = list.filter(p => Number(p.stock) === 0);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name_desc") return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "stock_desc") return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      if (sortBy === "stock_asc") return (Number(a.stock) || 0) - (Number(b.stock) || 0);
      if (sortBy === "price_desc") return (Number(b.salePrice) || 0) - (Number(a.salePrice) || 0);
      if (sortBy === "price_asc") return (Number(a.salePrice) || 0) - (Number(b.salePrice) || 0);
      return 0;
    });
  }, [activeProducts, searchTerm, categoryFilter, stockStatusFilter, sortBy]);

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      
      {/* Header and Add Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs">
        <div>
          <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
            <Package className="text-[#5C52FB] w-4 h-4" />
            Stock Ledger & Inventory Catalog
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            Linked to Master Catalog Categories. All products feature auto-generated unique SKUs.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {triggerImportExport && (
            <>
              <button 
                onClick={() => triggerImportExport("products")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#E2E8F0] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Bulk Import Products via spreadsheet"
              >
                <Upload className="w-4 h-4 text-[#5C52FB]" /> Import Products
              </button>
              <button 
                onClick={() => triggerImportExport("products")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#E2E8F0] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Bulk Export Products via spreadsheet"
              >
                <Download className="w-4 h-4 text-[#5C52FB]" /> Export Products
              </button>
            </>
          )}

          <button 
            onClick={runAutoReorder}
            className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold px-3.5 py-2 rounded-xl border border-[#E2E8F0] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-[#5C52FB]" /> AI Auto-Reorder
          </button>
          <button 
            onClick={() => {
              setIsAddingProduct(!isAddingProduct);
              if (!isAddingProduct) {
                resetForm();
              }
            }}
            className="btn-elevate-primary text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product SKU
          </button>
        </div>
      </div>

      {/* Register New SKU form expander */}
      {isAddingProduct && (
        <form onSubmit={handleAddProduct} className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-md space-y-5 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#5C52FB]" />
              Register New SKU (Central Catalog Linked)
            </h4>
            <span className="text-[10px] font-mono text-[#5C52FB] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md font-bold">
              SKU: {newProductForm.sku || "AUTO"}
            </span>
          </div>
          
          {/* Row 1: Catalog Category, Product Name, SKU, Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Searchable Master Catalog Category Dropdown */}
            <div>
              <label className="label-elevate block mb-1">
                Catalog Category *
              </label>
              <CategorySelect
                categories={categoriesList}
                value={selectedCategory?.id}
                onChange={handleCategorySelect}
                placeholder="Select Catalog Category..."
              />
            </div>

            {/* 2. Product Name */}
            <div>
              <label className="label-elevate block mb-1">
                Product Name *
              </label>
              <input 
                type="text"
                required
                value={newProductForm.name}
                onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                placeholder="e.g. Paracetamol 650mg, Basmati Rice 5kg"
                className="input-elevate"
              />
            </div>

            {/* 3. SKU (Auto-generated with optional manual override) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-elevate">
                  SKU Code *
                </label>
                <button
                  type="button"
                  onClick={() => setIsSkuEditable(!isSkuEditable)}
                  className="text-[9px] font-black text-[#5C52FB] uppercase tracking-wide hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isSkuEditable ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{isSkuEditable ? "Lock SKU" : "Edit SKU"}</span>
                </button>
              </div>
              <input 
                type="text"
                required
                readOnly={!isSkuEditable}
                value={newProductForm.sku}
                onChange={(e) => setNewProductForm({...newProductForm, sku: e.target.value.toUpperCase()})}
                placeholder="e.g. CATCODE-0001"
                className={`w-full border ${
                  isSkuEditable ? "border-[#5C52FB] bg-white text-[#0F172A]" : "border-[#E2E8F0] bg-[#F8FAFC] text-[#5C52FB]"
                } p-2.5 text-xs font-mono font-bold rounded-xl focus:outline-none`}
              />
            </div>

            {/* 4. Barcode (Optional) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label-elevate">
                  Barcode (Optional)
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={generateAutoBarcode}
                    className="text-[9px] font-black text-[#5C52FB] uppercase tracking-wide hover:underline cursor-pointer"
                  >
                    Auto
                  </button>
                  <span className="text-[#94A3B8]">·</span>
                  <button
                    type="button"
                    onClick={() => { setScannerTarget("create"); setShowScannerModal(true); }}
                    className="text-[9px] font-black text-[#5C52FB] uppercase tracking-wide hover:underline cursor-pointer"
                  >
                    Scan
                  </button>
                </div>
              </div>
              <input 
                type="text"
                value={newProductForm.barcode}
                onChange={(e) => setNewProductForm({...newProductForm, barcode: e.target.value})}
                placeholder="e.g. 890123456789"
                className="input-elevate"
              />
            </div>
          </div>

          {/* Row 2: Brand, Unit, HSN/SAC Code, Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 5. Brand */}
            <div>
              <label className="label-elevate block mb-1">
                Brand Name
              </label>
              <input 
                type="text"
                value={newProductForm.brand}
                onChange={(e) => setNewProductForm({...newProductForm, brand: e.target.value})}
                placeholder="e.g. Patanjali, Dabur, Samsung"
                className="input-elevate"
              />
            </div>

            {/* 6. Unit */}
            <div>
              <label className="label-elevate block mb-1">
                Unit of Measure *
              </label>
              <select
                value={newProductForm.unit}
                onChange={(e) => setNewProductForm({...newProductForm, unit: e.target.value})}
                className="input-elevate font-bold"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="g">g (Grams)</option>
                <option value="liters">liters (Liters)</option>
                <option value="ml">ml (Milliliters)</option>
                <option value="meters">meters (Meters)</option>
                <option value="strip">strip (Strips)</option>
                <option value="tablet">tablet (Tablets)</option>
                <option value="box">box (Boxes)</option>
                <option value="packet">packet (Packets)</option>
              </select>
            </div>

            {/* 7. HSN/SAC Code */}
            <div>
              <label className="label-elevate block mb-1">
                HSN / SAC Code
              </label>
              <input 
                type="text"
                value={newProductForm.hsnCode}
                onChange={(e) => setNewProductForm({...newProductForm, hsnCode: e.target.value})}
                placeholder="e.g. 3004 or 8517"
                className="input-elevate font-mono"
              />
            </div>

            {/* 8. Status */}
            <div>
              <label className="label-elevate block mb-1">
                Status *
              </label>
              <select
                value={newProductForm.status}
                onChange={(e) => setNewProductForm({...newProductForm, status: e.target.value})}
                className="input-elevate font-bold"
              >
                <option value="Active">Active (Available for Sale)</option>
                <option value="Inactive">Inactive (Disabled)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Purchase Price, Selling Price, MRP, GST Rate, Opening Stock, Minimum Stock */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* 9. Purchase Price */}
            <div>
              <label className="label-elevate block mb-1">
                Purchase Price (₹)
              </label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={newProductForm.purchasePrice}
                onChange={(e) => setNewProductForm({...newProductForm, purchasePrice: Number(e.target.value)})}
                className="input-elevate font-mono font-semibold"
              />
            </div>

            {/* 10. Selling Price */}
            <div>
              <label className="label-elevate block mb-1">
                Selling Price (₹) *
              </label>
              <input 
                type="number"
                required
                min="0"
                step="0.01"
                value={newProductForm.salePrice}
                onChange={(e) => setNewProductForm({...newProductForm, salePrice: Number(e.target.value)})}
                className="input-elevate font-mono font-bold"
              />
            </div>

            {/* 11. MRP */}
            <div>
              <label className="label-elevate block mb-1">
                MRP (₹)
              </label>
              <input 
                type="number"
                min="0"
                step="0.01"
                value={newProductForm.mrp}
                onChange={(e) => setNewProductForm({...newProductForm, mrp: Number(e.target.value)})}
                className="input-elevate font-mono font-semibold"
              />
            </div>

            {/* 12. GST Rate */}
            <div>
              <label className="label-elevate block mb-1">
                GST Rate (%)
              </label>
              <select
                value={newProductForm.gstPercent}
                onChange={(e) => setNewProductForm({...newProductForm, gstPercent: Number(e.target.value)})}
                className="input-elevate font-semibold"
              >
                <option value={0}>0% GST (Exempt)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>

            {/* 13. Opening Stock */}
            <div>
              <label className="label-elevate block mb-1">
                Opening Stock
              </label>
              <input 
                type="number"
                min="0"
                value={newProductForm.stock}
                onChange={(e) => setNewProductForm({...newProductForm, stock: Number(e.target.value)})}
                className="input-elevate font-mono font-bold"
              />
            </div>

            {/* 14. Minimum Stock Level */}
            <div>
              <label className="label-elevate block mb-1">
                Min Stock Alert
              </label>
              <input 
                type="number"
                min="0"
                value={newProductForm.minStock}
                onChange={(e) => setNewProductForm({...newProductForm, minStock: Number(e.target.value)})}
                className="input-elevate font-mono font-semibold"
              />
            </div>
          </div>

          {/* Row 4: 15. Description */}
          <div>
            <label className="label-elevate block mb-1">
              Description / Notes
            </label>
            <input 
              type="text"
              value={newProductForm.description}
              onChange={(e) => setNewProductForm({...newProductForm, description: e.target.value})}
              placeholder="e.g. Key specifications, dosage instructions, warranty details or storage notes"
              className="input-elevate"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-[#E2E8F0]">
            <button 
              type="button" 
              onClick={() => setIsAddingProduct(false)}
              className="px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-bold text-xs rounded-xl border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-elevate-primary text-xs font-extrabold px-6 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New SKU</span>
            </button>
          </div>
        </form>
      )}

      {/* Stock Registry Filters & Control Bar */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl space-y-3.5 shadow-xs">
        {/* Top Controls Row: Search, Stock Status Filter, Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Product Name, SKU, Barcode, or Brand..."
              className="input-elevate pl-10"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stock Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-[#5C52FB]" />
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock Only</option>
                <option value="low_stock">Low Stock Alert</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#5C52FB]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer"
              >
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="name_desc">Sort: Name (Z-A)</option>
                <option value="stock_desc">Sort: Stock (High-Low)</option>
                <option value="stock_asc">Sort: Stock (Low-High)</option>
                <option value="price_desc">Sort: Price (High-Low)</option>
                <option value="price_asc">Sort: Price (Low-High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Linked to Catalog Categories) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#5C52FB]" /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === "all" ? "bg-[#5C52FB] text-white shadow-xs" : "bg-[#F8FAFC] text-slate-600 hover:text-[#0F172A] border border-[#E2E8F0]"
            }`}
          >
            All Categories ({activeProducts.length})
          </button>
          {categoriesList.filter(cat => (cat.status || "Active") === "Active" || activeProducts.some(p => p.categoryId === cat.id || (p.category || "").toLowerCase() === cat.name.toLowerCase())).map(cat => {
            const count = activeProducts.filter(p => 
              p.categoryId === cat.id || (p.category || "").toLowerCase() === cat.name.toLowerCase()
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  categoryFilter === cat.id ? "bg-[#5C52FB] text-white shadow-xs" : "bg-[#F8FAFC] text-slate-600 hover:text-[#0F172A] border border-[#E2E8F0]"
                }`}
              >
                <span>{cat.name}</span>
                {cat.status === "Inactive" && (
                  <span className="text-[8px] uppercase bg-amber-50 text-amber-700 px-1 py-0.2 rounded border border-amber-200">Archived</span>
                )}
                <span className={`px-1.5 py-0.2 font-mono text-[9px] rounded ${categoryFilter === cat.id ? "bg-white/20 text-white font-bold" : "bg-slate-200 text-slate-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DENSE STOCK LIST TABLE */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
              <tr>
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Name & Barcode</th>
                <th className="p-4">Catalog Category</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-center">Unit</th>
                <th className="p-4 text-right">Purchase (₹)</th>
                <th className="p-4 text-right">Selling (₹)</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[#94A3B8]">
                    <Package className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-[#0F172A] text-xs">No matching products found in Stock Registry</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">Try resetting your search or category filters</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isEditing = editingProductId === p.id;
                  const isLow = p.stock <= (p.minStockLevel || 0) && p.stock > 0;
                  const isOut = p.stock === 0;

                  if (isEditing) {
                    return (
                      <tr key={p.id} className="bg-purple-50/50 border-l-2 border-[#5C52FB]">
                        <td className="p-4 font-mono font-bold">
                          <input
                            type="text"
                            value={editingProductForm.sku}
                            onChange={(e) => setEditingProductForm({ ...editingProductForm, sku: e.target.value.toUpperCase() })}
                            className="w-28 bg-white border border-[#E2E8F0] p-1.5 text-xs text-[#5C52FB] font-mono font-bold rounded-lg"
                          />
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editingProductForm.name}
                              onChange={(e) => setEditingProductForm({ ...editingProductForm, name: e.target.value })}
                              className="w-full bg-white border border-[#E2E8F0] p-1.5 text-xs font-bold text-[#0F172A] rounded-lg"
                              placeholder="Product Name"
                            />
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={editingProductForm.barcode}
                                onChange={(e) => setEditingProductForm({ ...editingProductForm, barcode: e.target.value })}
                                className="w-full bg-white border border-[#E2E8F0] p-1 text-[10px] font-mono text-slate-500 rounded-lg"
                                placeholder="Barcode"
                              />
                              <button
                                type="button"
                                onClick={() => { setScannerTarget("edit"); setShowScannerModal(true); }}
                                className="text-[9px] text-[#5C52FB] px-1 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-bold uppercase cursor-pointer"
                              >
                                Scan
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={editingProductForm.categoryId || ""}
                            onChange={(e) => {
                              const selectedCat = categoriesList.find(c => c.id === e.target.value);
                              setEditingProductForm({
                                ...editingProductForm,
                                categoryId: e.target.value,
                                category: selectedCat ? selectedCat.name : editingProductForm.category
                              });
                            }}
                            className="w-36 bg-white border border-[#E2E8F0] p-1.5 text-xs text-[#0F172A] font-bold rounded-lg"
                          >
                            {categoriesList.filter(c => (c.status || "Active") === "Active" || c.id === editingProductForm.categoryId).map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.code || "GEN"}){cat.status === "Inactive" ? " [Archived]" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            value={editingProductForm.stock}
                            onChange={(e) => setEditingProductForm({ ...editingProductForm, stock: Number(e.target.value) })}
                            className="w-16 bg-white border border-[#E2E8F0] p-1 text-center font-mono font-bold text-[#0F172A] rounded-lg"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={editingProductForm.unit || "pcs"}
                            onChange={(e) => setEditingProductForm({ ...editingProductForm, unit: e.target.value })}
                            className="w-16 bg-white border border-[#E2E8F0] p-1 text-center text-xs text-[#0F172A] rounded font-bold focus:outline-none"
                          >
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="liters">liters</option>
                            <option value="ml">ml</option>
                            <option value="meters">meters</option>
                            <option value="strip">strip</option>
                            <option value="box">box</option>
                            <option value="packet">packet</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <input
                            type="number"
                            value={editingProductForm.purchasePrice}
                            onChange={(e) => setEditingProductForm({ ...editingProductForm, purchasePrice: Number(e.target.value) })}
                            className="w-16 bg-white border border-[#E2E8F0] p-1 text-right font-mono text-[#0F172A] rounded-lg"
                          />
                        </td>
                        <td className="p-4 text-right">
                          <input
                            type="number"
                            value={editingProductForm.salePrice}
                            onChange={(e) => setEditingProductForm({ ...editingProductForm, salePrice: Number(e.target.value) })}
                            className="w-16 bg-white border border-[#E2E8F0] p-1 text-right font-mono font-bold text-[#5C52FB] rounded-lg"
                          />
                        </td>
                        <td className="p-4">
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200">
                            Editing
                          </span>
                        </td>
                        <td className="p-4 text-[10px] text-[#94A3B8] font-mono">
                          Now
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer border border-emerald-200"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingProductId(null); setEditingProductForm(null); }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all cursor-pointer border border-slate-200"
                              title="Cancel Edit"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Resolve product category name from master categories list or product record
                  const categoryObj = categoriesList.find(c => c.id === p.categoryId || c.name.toLowerCase() === (p.category || "").toLowerCase());
                  const categoryDisplayName = categoryObj ? categoryObj.name : (p.category || "General");
                  const categoryCode = categoryObj ? categoryObj.code : "GEN";

                  const formattedDate = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today";

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#5C52FB]">
                        {p.sku || <span className="text-[#94A3B8] font-bold italic text-[11px]">-</span>}
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-[#0F172A]">{p.name}</p>
                        <p className="text-[10px] text-[#94A3B8] font-mono">
                          {p.brand ? <span className="text-slate-600 font-semibold">{p.brand} · </span> : null}
                          Barcode: {p.barcode || <span className="text-[#94A3B8] italic">None</span>}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-[10px] font-bold rounded-md">
                            {categoryDisplayName}
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#F8FAFC] text-[#5C52FB] font-mono text-[9px] font-bold rounded border border-[#E2E8F0]">
                            {categoryCode}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-black">
                        <span className={isOut ? "text-[#94A3B8]" : isLow ? "text-rose-600" : "text-[#0F172A]"}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-semibold block">Min: {p.minStockLevel || 0}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-[#94A3B8] uppercase text-[11px]">{p.unit || "pcs"}</td>
                      <td className="p-4 text-right font-mono text-[#94A3B8]">₹{p.purchasePrice}</td>
                      <td className="p-4 text-right font-mono font-bold text-[#0F172A]">₹{p.salePrice}</td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md border border-rose-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[10px] text-[#94A3B8] font-mono">
                        {formattedDate}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 bg-[#F8FAFC] hover:bg-[#5C52FB] hover:text-white text-slate-600 rounded-md transition-all border border-[#E2E8F0] cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-[#F8FAFC] hover:bg-rose-600 hover:text-white text-rose-600 rounded-md transition-all border border-[#E2E8F0] cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BARCODE SCANNER SIMULATOR MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-[#0F172A]">
            {/* Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5C52FB]" />
                Live Camera Barcode Scanner
              </h4>
              <button
                onClick={() => setShowScannerModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Scanner Emulator Window */}
            <div className="p-6 flex flex-col items-center justify-center bg-slate-50 relative">
              <div className="w-64 h-40 border-2 border-dashed border-[#5C52FB]/40 rounded-xl relative flex items-center justify-center overflow-hidden bg-white">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#5C52FB]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#5C52FB]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#5C52FB]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#5C52FB]"></div>
                
                <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce w-full"></div>
                
                <span className="text-[10px] font-black text-[#5C52FB]/80 uppercase tracking-widest animate-pulse">
                  Aligning Barcode...
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-4 text-center">
                The scanner will automatically decode the UPC/EAN standard code.
              </p>
            </div>

            {/* Preset simulator options */}
            <div className="p-4 bg-white space-y-3 border-t border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                Simulate Scanned Codes:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Rice Bag (10kg)", code: "890123400501" },
                  { label: "Dolo 650 Strip", code: "890100204432" },
                  { label: "Cotton Polo Shirt", code: "890255109204" },
                  { label: "Liquid Soap (1L)", code: "890150201123" }
                ].map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => {
                      if (scannerTarget === "create") {
                        setNewProductForm(prev => ({ ...prev, barcode: preset.code }));
                      } else {
                        setEditingProductForm((prev) => ({ ...prev, barcode: preset.code }));
                      }
                      setShowScannerModal(false);
                      if (addNotification) addNotification(`Successfully scanned barcode: ${preset.code} (${preset.label})`, "success");
                    }}
                    className="p-2 bg-[#F8FAFC] hover:bg-slate-100 text-left rounded-lg border border-[#E2E8F0] text-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <span className="font-bold text-[#0F172A] block truncate">{preset.label}</span>
                    <span className="text-[9px] font-mono text-[#5C52FB] mt-0.5">{preset.code}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Camera
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
