import React, { useState, useMemo } from "react";
import { 
  Search, Tag, Layers, Plus, Check, Edit2, Grid, List, 
  FolderPlus, CheckCircle2, PauseCircle, Package, AlertCircle
} from "lucide-react";
import { getCategories, validateCategory } from "../utils/catalogUtils.js";
import { saveCatalogCategory } from "../lib/supabaseService.js";

export default function CatalogModule({ 
  db, 
  setDb, 
  refreshCatalogCategories,
  activeBusinessId, 
  addNotification, 
  activeProducts = []
}) {
  // View states
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'

  // Modals & Selection
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Null for create, object for edit
  const [formError, setFormError] = useState("");

  // Form State for Category
  const initialFormState = {
    name: "",
    code: "",
    description: "",
    status: "Active",
    image: ""
  };

  const [formState, setFormState] = useState(initialFormState);

  // Retrieve Master Catalog Categories from central DB
  const categoriesList = useMemo(() => {
    return getCategories(db);
  }, [db?.categories]);

  // Filtering Categories
  const filteredCategories = useMemo(() => {
    return categoriesList.filter(cat => {
      const cStatus = (cat.status || "Active").toLowerCase();
      
      if (statusFilter === "active" && cStatus !== "active") return false;
      if (statusFilter === "inactive" && cStatus !== "inactive") return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = (cat.name || "").toLowerCase().includes(query);
        const matchesCode = (cat.code || "").toLowerCase().includes(query);
        const matchesDesc = (cat.description || "").toLowerCase().includes(query);
        return matchesName || matchesCode || matchesDesc;
      }

      return true;
    });
  }, [categoriesList, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const activeCount = categoriesList.filter(c => (c.status || "Active").toLowerCase() === "active").length;
    const inactiveCount = categoriesList.filter(c => (c.status || "Active").toLowerCase() === "inactive").length;

    return {
      total: categoriesList.length,
      active: activeCount,
      inactive: inactiveCount
    };
  }, [categoriesList]);

  // Open Create Category Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormState(initialFormState);
    setFormError("");
    setShowFormModal(true);
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormState({
      name: cat.name || "",
      code: cat.code || "",
      description: cat.description || "",
      status: cat.status || "Active",
      image: cat.image || ""
    });
    setFormError("");
    setShowFormModal(true);
  };

  // Save Category with Validation
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setFormError("");

    const validation = validateCategory(formState, categoriesList, editingCategory?.id);
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    const payload = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: formState.name.trim(),
      code: formState.code.trim().toUpperCase() || formState.name.slice(0, 3).toUpperCase(),
      description: formState.description.trim(),
      status: formState.status,
      image: formState.image.trim(),
      updatedAt: new Date().toISOString()
    };

    if (!editingCategory) {
      payload.createdAt = new Date().toISOString();
    }

    try {
      await saveCatalogCategory(payload);
      
      if (refreshCatalogCategories) {
        await refreshCatalogCategories();
      }

      if (setDb) {
        setDb(prev => {
          const currentList = getCategories(prev);
          let updatedCategories;
          if (editingCategory) {
            updatedCategories = currentList.map(c => c.id === payload.id ? { ...c, ...payload } : c);
          } else {
            updatedCategories = [payload, ...currentList];
          }
          return {
            ...prev,
            categories: updatedCategories
          };
        });
      }

      if (addNotification) {
        addNotification(`Category "${payload.name}" successfully ${editingCategory ? "updated" : "created"}.`, "success");
      }

      setShowFormModal(false);
      setFormState(initialFormState);
    } catch (err) {
      console.error("Error saving category:", err);
      setFormError("Failed to persist category to database. Please try again.");
    }
  };

  // Quick toggle Active/Inactive
  const handleToggleCategoryStatus = async (cat) => {
    const newStatus = cat.status === "Active" ? "Inactive" : "Active";
    const payload = { ...cat, status: newStatus, updatedAt: new Date().toISOString() };

    try {
      await saveCatalogCategory(payload);
    } catch (err) {
      console.warn("Local update fallback for status toggle:", err);
    }

    if (refreshCatalogCategories) {
      await refreshCatalogCategories();
    }

    if (setDb) {
      setDb(prev => {
        const currentList = getCategories(prev);
        const updatedCategories = currentList.map(c => 
          c.id === cat.id ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
        );
        return {
          ...prev,
          categories: updatedCategories
        };
      });
    }
    if (addNotification) addNotification(`Category "${cat.name}" status updated to ${newStatus}.`, "info");
  };

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      {/* Header & KPI Section */}
      <div className="space-y-4">
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#5C52FB]/10 text-[#5C52FB] border border-[#5C52FB]/20 text-[10px] font-bold uppercase tracking-wider">
                Catalog Repository
              </span>
            </div>
            <h3 className="font-bold text-[#0F172A] text-xl flex items-center gap-2.5 mt-2">
              <Layers className="text-[#5C52FB] w-5 h-5" />
              Master Catalog Categories
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl font-normal">
              Centralized master category management system. Categories defined here serve as the master data across Inventory, POS, Billing, Purchase, and Analytics.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              id="btn-add-catalog-master"
              onClick={handleOpenCreateModal}
              className="bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#5C52FB]/20 uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ADD CATEGORY</span>
            </button>
          </div>
        </div>

        {/* KPIs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">TOTAL CATEGORIES</p>
              <h4 className="text-xl font-bold text-[#0F172A] mt-0.5">{stats.total}</h4>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">Master classification groups</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#5C52FB]">
              <Tag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">ACTIVE CATEGORIES</p>
              <h4 className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</h4>
              <p className="text-[10px] text-emerald-600/80 mt-0.5">Active across product forms</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">ARCHIVED CATEGORIES</p>
              <h4 className="text-xl font-bold text-amber-600 mt-0.5">{stats.inactive}</h4>
              <p className="text-[10px] text-amber-600/80 mt-0.5">Hidden from new product creation</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <PauseCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category name or code..."
            className="input-elevate pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${statusFilter === "all" ? "bg-white text-[#5C52FB] shadow-xs border border-[#E2E8F0]" : "text-[#94A3B8] hover:text-[#0F172A]"}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${statusFilter === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-[#94A3B8] hover:text-[#0F172A]"}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${statusFilter === "inactive" ? "bg-amber-50 text-amber-700 border border-amber-200" : "text-[#94A3B8] hover:text-[#0F172A]"}`}
            >
              Inactive
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#5C52FB] shadow-xs border border-[#E2E8F0]" : "text-[#94A3B8] hover:text-[#0F172A]"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-[#5C52FB] shadow-xs border border-[#E2E8F0]" : "text-[#94A3B8] hover:text-[#0F172A]"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Display */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] p-12 rounded-2xl text-center space-y-3">
          <FolderPlus className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h4 className="text-sm font-bold text-[#0F172A]">No Catalog Categories Found</h4>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            {searchTerm ? "No categories match your search query." : "Your catalog database has no category records."}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#5C52FB] text-white font-bold text-xs rounded-xl hover:bg-[#4F46E5] transition-all cursor-pointer inline-flex items-center gap-2 uppercase tracking-wider shadow-md shadow-[#5C52FB]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Category</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(cat => {
            const productCount = activeProducts.filter(p => 
              p.categoryId === cat.id || (p.category || "").toLowerCase() === cat.name.toLowerCase()
            ).length;
            const isActive = cat.status === "Active";

            return (
              <div 
                key={cat.id} 
                className="bg-white border border-[#E2E8F0] hover:border-[#5C52FB]/40 p-5 rounded-2xl transition-all space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] text-[#5C52FB] font-mono text-[10px] font-bold rounded-md">
                      {cat.code || "GEN"}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                      isActive 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {cat.status || "Active"}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#0F172A] mt-1">{cat.name}</h4>
                  <p className="text-xs text-[#94A3B8] line-clamp-2">{cat.description || "No description specified for this category."}</p>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#94A3B8]">
                  <div className="flex items-center gap-1.5 text-[#0F172A] font-bold text-[11px]">
                    <Package className="w-3.5 h-3.5 text-[#5C52FB]" />
                    <span>{productCount} Linked Products</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-bold text-[11px] rounded-lg border border-[#E2E8F0] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleToggleCategoryStatus(cat)}
                      className={`px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 font-bold text-[11px] rounded-lg border border-[#E2E8F0] transition-all cursor-pointer ${
                        isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                      }`}
                    >
                      {isActive ? "Archive" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#94A3B8] uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-3.5">CATEGORY CODE</th>
                  <th className="p-3.5">CATEGORY NAME</th>
                  <th className="p-3.5">DESCRIPTION</th>
                  <th className="p-3.5 text-center">LINKED PRODUCTS</th>
                  <th className="p-3.5 text-center">STATUS</th>
                  <th className="p-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map(cat => {
                  const productCount = activeProducts.filter(p => 
                    p.categoryId === cat.id || (p.category || "").toLowerCase() === cat.name.toLowerCase()
                  ).length;
                  const isActive = cat.status === "Active";

                  return (
                    <tr key={cat.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-3.5 font-mono text-[#5C52FB] font-bold">{cat.code || "GEN"}</td>
                      <td className="p-3.5 font-bold text-[#0F172A]">{cat.name}</td>
                      <td className="p-3.5 text-[#94A3B8] max-w-xs truncate">{cat.description || "—"}</td>
                      <td className="p-3.5 text-center font-bold text-[#0F172A]">{productCount}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {cat.status || "Active"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-bold text-[10px] rounded-lg border border-[#E2E8F0] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleCategoryStatus(cat)}
                          className={`px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 font-bold text-[10px] rounded-lg border border-[#E2E8F0] transition-all cursor-pointer inline-flex items-center gap-1 ${
                            isActive ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {isActive ? "Archive" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#0F172A]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5 bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#5C52FB]/10 border border-[#5C52FB]/20 flex items-center justify-center text-[#5C52FB]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    {editingCategory ? "Edit Catalog Category" : "Add Catalog Category"}
                  </h3>
                  <p className="text-[10px] text-[#94A3B8]">Category record will be saved to Master Catalog Database</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 bg-white border border-[#E2E8F0] rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Validation Banner Error */}
            {formError && (
              <div className="bg-rose-50 border-b border-rose-200 p-3 px-5 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4 text-xs">
              <div>
                <label className="label-elevate">CATEGORY NAME *</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => {
                    setFormState({ ...formState, name: e.target.value });
                    if (formError) setFormError("");
                  }}
                  placeholder="e.g. Pharmacy, FMCG, Grocery, Electronics"
                  className="input-elevate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-elevate">CATEGORY CODE</label>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => {
                      setFormState({ ...formState, code: e.target.value.toUpperCase() });
                      if (formError) setFormError("");
                    }}
                    placeholder="e.g. ELE, GRO, MED"
                    className="input-elevate font-mono"
                  />
                  <p className="text-[10px] text-[#94A3B8] mt-1">Used for auto-generating product SKUs</p>
                </div>

                <div>
                  <label className="label-elevate">STATUS</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="input-elevate"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-elevate">DESCRIPTION</label>
                <textarea
                  rows="3"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Brief description of products under this master category..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#5C52FB]"
                />
              </div>

              <div>
                <label className="label-elevate">IMAGE / ICON URL</label>
                <input
                  type="text"
                  value={formState.image}
                  onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                  placeholder="https://..."
                  className="input-elevate"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-bold rounded-lg border border-[#E2E8F0] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#5C52FB]/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
