import React, { useState } from "react";
import { 
  Building, Tag, ShieldCheck, Lock, Save, ListPlus, Plus, Trash2, 
  Download, FileSpreadsheet 
} from "lucide-react";
import { DEFAULT_PRODUCT_TYPES } from "../../data/productTemplates";

export default function GeneralSettings({
  db,
  setDb,
  activeBusiness,
  activeBusinessId,
  isOwnerAdmin,
  addNotification,
  handleResetData,
  exportInventoryToCSV
}) {
  const [bizName, setBizName] = useState(activeBusiness?.name || "");
  const [bizCategory, setBizCategory] = useState(activeBusiness?.category || "Other");
  const [customCategoryText, setCustomCategoryText] = useState(activeBusiness?.customCategory || "");
  const [skuBarcodeRequired, setSkuBarcodeRequired] = useState(activeBusiness?.skuBarcodeRequired ?? false);

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeFields, setNewTypeFields] = useState("");

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!isOwnerAdmin) {
      addNotification("Access Restricted: Only Owner or Co-owners can update the business profile.", "error");
      return;
    }

    if (!bizName.trim()) {
      addNotification("Business Name cannot be empty.", "error");
      return;
    }

    setDb((prev) => {
      const updatedBusinesses = prev.businesses.map((b) => {
        if (b.id === activeBusinessId) {
          return {
            ...b,
            name: bizName,
            category: bizCategory,
            customCategory: bizCategory === "Other" ? customCategoryText : undefined,
            skuBarcodeRequired: skuBarcodeRequired,
            updatedBy: "user-1"
          };
        }
        return b;
      });

      const audit = {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "Profile Updated",
        userId: "user-1",
        username: "Workspace Owner",
        details: `Updated Business profile to Name: "${bizName}", Category: "${bizCategory}", Require SKU/Barcode: ${skuBarcodeRequired}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      return {
        ...prev,
        businesses: updatedBusinesses,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });

    addNotification("Business profile updated successfully.", "success");
  };

  const toggleProductType = (typeId) => {
    if (!isOwnerAdmin) {
      addNotification("Access Restricted: Only Owner/Admin can modify enabled product types.", "error");
      return;
    }

    const currentEnabled = activeBusiness.enabledProductTypes || ["Grocery", "Electronics", "Clothing", "Pharmacy"];
    let updatedEnabled;

    if (currentEnabled.includes(typeId)) {
      if (currentEnabled.length <= 1) {
        addNotification("You must keep at least one product type enabled.", "error");
        return;
      }
      updatedEnabled = currentEnabled.filter((t) => t !== typeId);
    } else {
      updatedEnabled = [...currentEnabled, typeId];
    }

    setDb((prev) => {
      const updatedBusinesses = prev.businesses.map((b) => {
        if (b.id === activeBusinessId) {
          return {
            ...b,
            enabledProductTypes: updatedEnabled
          };
        }
        return b;
      });
      return { ...prev, businesses: updatedBusinesses };
    });

    addNotification(`Product type "${typeId}" ${updatedEnabled.includes(typeId) ? 'enabled' : 'disabled'} successfully.`, "success");
  };

  const handleAddCustomProductType = (e) => {
    e.preventDefault();
    if (!isOwnerAdmin) {
      addNotification("Access Restricted: Only Owner/Admin can add custom product types.", "error");
      return;
    }

    if (!newTypeName.trim()) {
      addNotification("Product Type Name cannot be empty.", "error");
      return;
    }

    const fieldsArray = newTypeFields
      .split(",")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (fieldsArray.length === 0) {
      addNotification("Please specify at least one template field.", "error");
      return;
    }

    const newType = {
      id: "custom-" + Date.now(),
      name: newTypeName.trim(),
      defaultFields: fieldsArray
    };

    setDb((prev) => {
      const updatedBusinesses = prev.businesses.map((b) => {
        if (b.id === activeBusinessId) {
          const currentCustom = b.customProductTypes || [];
          const currentEnabled = b.enabledProductTypes || ["Grocery", "Electronics", "Clothing", "Pharmacy"];
          return {
            ...b,
            customProductTypes: [...currentCustom, newType],
            enabledProductTypes: [...currentEnabled, newType.name]
          };
        }
        return b;
      });

      const audit = {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "Custom Product Type Created",
        userId: "user-1",
        username: "Workspace Owner",
        details: `Created custom product type "${newType.name}" with fields: [${fieldsArray.join(", ")}]`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      return {
        ...prev,
        businesses: updatedBusinesses,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });

    setNewTypeName("");
    setNewTypeFields("");
    addNotification(`Custom product type "${newType.name}" created and enabled.`, "success");
  };

  const handleDeleteCustomProductType = (typeId, typeName) => {
    if (!isOwnerAdmin) {
      addNotification("Access Restricted: Only Owner/Admin can delete product types.", "error");
      return;
    }

    setDb((prev) => {
      const updatedBusinesses = prev.businesses.map((b) => {
        if (b.id === activeBusinessId) {
          const currentCustom = b.customProductTypes || [];
          const currentEnabled = b.enabledProductTypes || ["Grocery", "Electronics", "Clothing", "Pharmacy"];
          return {
            ...b,
            customProductTypes: currentCustom.filter((t) => t.id !== typeId),
            enabledProductTypes: currentEnabled.filter((t) => t !== typeName)
          };
        }
        return b;
      });
      return { ...prev, businesses: updatedBusinesses };
    });

    addNotification(`Custom product type "${typeName}" deleted successfully.`, "success");
  };

  const enabledProductTypes = activeBusiness?.enabledProductTypes || ["Grocery", "Electronics", "Clothing", "Pharmacy"];
  const customProductTypes = activeBusiness?.customProductTypes || [];

  return (
    <div className="space-y-6 animate-fadeIn text-[#0F172A]">
      {/* BUSINESS PROFILE & ACCESS GUARD CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Settings Editor */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <h3 className="font-extrabold text-[#0F172A] text-xs flex items-center gap-2">
              <Building className="text-[#5C52FB] w-4 h-4" />
              Business Profile
            </h3>
            {isOwnerAdmin ? (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Owner Access
              </span>
            ) : (
              <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-[#E2E8F0] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only Staff
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="label-elevate mb-1 block">Business Name</label>
              <input 
                type="text"
                disabled={!isOwnerAdmin}
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="Enter Business / Shop Name"
                className="input-elevate disabled:opacity-50"
              />
            </div>

            <div>
              <label className="label-elevate mb-1 block">Business Category</label>
              <select
                disabled={!isOwnerAdmin}
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value)}
                className="input-elevate font-semibold disabled:opacity-50"
              >
                <option value="Grocery">Grocery</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Hardware">Hardware</option>
                <option value="Furniture">Furniture</option>
                <option value="Stationery">Stationery</option>
                <option value="Restaurant/Food">Restaurant/Food</option>
                <option value="Bakery">Bakery</option>
                <option value="Cosmetics">Cosmetics</option>
                <option value="Sports">Sports</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Automotive">Automotive</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {bizCategory === "Other" && (
              <div>
                <label className="label-elevate mb-1 block">Custom Category Name</label>
                <input 
                  type="text"
                  disabled={!isOwnerAdmin}
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  placeholder="e.g. Footwear Shop"
                  className="input-elevate disabled:opacity-50"
                />
              </div>
            )}

            <div className="flex items-center gap-2.5 py-1.5">
              <input
                type="checkbox"
                id="skuBarcodeRequired"
                disabled={!isOwnerAdmin}
                checked={skuBarcodeRequired}
                onChange={(e) => setSkuBarcodeRequired(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E8F0] bg-[#F8FAFC] text-[#5C52FB] focus:ring-2 focus:ring-[#5C52FB] cursor-pointer"
              />
              <label htmlFor="skuBarcodeRequired" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                Enable strict SKU & Barcode requirements
              </label>
            </div>

            {isOwnerAdmin && (
              <button 
                type="submit"
                className="btn-elevate-primary w-full text-xs font-extrabold py-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Business Profile
              </button>
            )}
          </form>
        </div>

        {/* Product Types Configuration */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <h3 className="font-extrabold text-[#0F172A] text-xs flex items-center gap-2">
              <Tag className="text-[#5C52FB] w-4 h-4" />
              Product Types Configuration
            </h3>
            <span className="text-[10px] text-[#94A3B8] font-bold">Enabled categories trigger customized fields</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2.5">Toggle Standard Product Categories</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DEFAULT_PRODUCT_TYPES.map((type) => {
                  const enabled = enabledProductTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={!isOwnerAdmin}
                      onClick={() => toggleProductType(type.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer ${
                        enabled 
                          ? "bg-[#F8FAFC] border-[#5C52FB]/40 text-[#0F172A] shadow-xs" 
                          : "bg-white border-[#E2E8F0] text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold">{type.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-[#5C52FB]' : 'bg-transparent'}`}></div>
                      </div>
                      <span className="text-[9px] text-[#94A3B8] truncate mt-1.5 font-medium">
                        Fields: {type.defaultFields.slice(0, 3).join(", ")}...
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2.5">Custom Business Categories</p>
              
              {customProductTypes.length === 0 ? (
                <p className="text-xs text-[#94A3B8] italic">No custom categories defined yet.</p>
              ) : (
                <div className="space-y-2">
                  {customProductTypes.map((type) => (
                    <div key={type.id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#0F172A]">{type.name}</span>
                        <span className="text-[10px] text-[#94A3B8] block">Template Fields: {type.defaultFields.join(", ")}</span>
                      </div>
                      {isOwnerAdmin && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteCustomProductType(type.id, type.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Custom Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOwnerAdmin && (
                <form onSubmit={handleAddCustomProductType} className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#0F172A] uppercase tracking-wider">
                    <ListPlus className="w-3.5 h-3.5 text-[#5C52FB]" /> Add New Custom Product Category
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input 
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Type Name (e.g. Footwear)"
                        className="input-elevate"
                      />
                    </div>
                    <div>
                      <input 
                        type="text"
                        value={newTypeFields}
                        onChange={(e) => setNewTypeFields(e.target.value)}
                        placeholder="Fields comma-separated (e.g. Size, Heel, Sole)"
                        className="input-elevate"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn-elevate-primary text-xs font-extrabold py-1.5 px-4 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Category
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BACKUP & LOG VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] text-xs border-b border-[#E2E8F0] pb-2">Multi-Tenant Cloud Backup Shield</h3>
            
            <div className="space-y-3 mt-4">
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl text-xs text-slate-700 border border-[#E2E8F0] space-y-1">
                <p className="font-bold text-[#0F172A]">Cloud Shield Mode Active</p>
                <p className="text-[10px] text-[#94A3B8] leading-relaxed">
                  Every invoice and ledger payment registers onto secure Cloud databases. Backup version history is kept synchronized across workspace boundaries.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    const fileData = JSON.stringify(db, null, 2);
                    const blob = new Blob([fileData], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    const dateStr = new Date().toISOString().slice(0, 10);
                    link.download = `vyapaar_db_backup_${activeBusinessId}_${dateStr}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                    addNotification("Manual backup JSON generated and downloaded successfully.", "success");
                  }}
                  className="btn-elevate-primary text-xs font-extrabold py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Manual JSON Backup</span>
                </button>

                <button 
                  type="button"
                  onClick={exportInventoryToCSV}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-extrabold py-2.5 rounded-xl text-xs transition-all border border-[#E2E8F0] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#5C52FB]" />
                  <span>Export Inventory to CSV</span>
                </button>

                <button 
                  type="button"
                  onClick={handleResetData}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2 rounded-xl text-xs transition-all border border-rose-200 cursor-pointer"
                >
                  Clear Storage / Re-seed Database
                </button>
              </div>

              <hr className="border-[#E2E8F0]" />
              
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Device Hardware Diagnostics</p>
                <div className="text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>POS Thermal Printer Connection:</span>
                    <span className="text-emerald-600 font-bold text-[10px]">CONNECTED</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Barcode Handheld Scanner:</span>
                    <span className="text-emerald-600 font-bold text-[10px]">CONNECTED</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Weighing Scale Integration:</span>
                    <span className="text-amber-600 font-bold text-[10px]">STANDBY</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-[#0F172A] text-xs border-b border-[#E2E8F0] pb-2">Multi-Tenant System Compliance Audit Logs</h3>
          
          <div className="space-y-2.5 overflow-y-auto max-h-80">
            {db.auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs leading-relaxed flex items-start gap-2 justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0F172A]">[{log.action}]</span>
                    <span className="px-1.5 py-0.5 bg-white text-slate-600 text-[9px] font-bold rounded-full border border-[#E2E8F0]">
                      @{log.username}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">{log.details}</p>
                </div>
                <span className="text-[9px] text-[#94A3B8] font-mono font-bold flex-shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
