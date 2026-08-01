import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { EmployeeRole } from "../types";
import GeneralSettings from "./settings/GeneralSettings";
import TallySettings from "./settings/TallySettings";

export default function SettingsModule({
  db,
  setDb,
  currentUserRole,
  handleResetData,
  activeBusinessId,
  addNotification,
  sessionToken
}) {
  const activeBusiness = db.businesses?.find((b) => b.id === activeBusinessId) || db.businesses?.[0];
  const isOwnerAdmin = currentUserRole === EmployeeRole.OWNER || currentUserRole === EmployeeRole.CO_OWNER;

  const [settingsTab, setSettingsTab] = useState("general");

  const exportInventoryToCSV = () => {
    const activeProducts = (db.products || []).filter((p) => p.business_id === activeBusinessId);

    if (activeProducts.length === 0) {
      addNotification("No inventory products found for this business to export.", "error");
      return;
    }

    const headers = [
      "Product ID",
      "Product Name",
      "SKU",
      "Barcode",
      "Category",
      "Purchase Price (INR)",
      "Sale Price (INR)",
      "GST (%)",
      "Stock Qty",
      "Min Stock Level",
      "Expiry Date",
      "Batch Number"
    ];

    const escapeCSV = (val) => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [headers.join(",")];

    for (const p of activeProducts) {
      const row = [
        escapeCSV(p.id),
        escapeCSV(p.name),
        escapeCSV(p.sku),
        escapeCSV(p.barcode),
        escapeCSV(p.category),
        escapeCSV(p.purchasePrice),
        escapeCSV(p.salePrice),
        escapeCSV(p.gstPercent),
        escapeCSV(p.stock),
        escapeCSV(p.minStockLevel),
        escapeCSV(p.expiryDate || ""),
        escapeCSV(p.batchNumber || "")
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `inventory_${activeBusinessId}_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification("Inventory CSV export generated and downloaded successfully.", "success");
  };

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-[#E2E8F0] gap-6">
        <button
          type="button"
          onClick={() => setSettingsTab("general")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            settingsTab === "general" ? "text-[#5C52FB]" : "text-[#94A3B8] hover:text-[#0F172A]"
          }`}
        >
          General & Product Settings
          {settingsTab === "general" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C52FB]" />}
        </button>
        <button
          type="button"
          onClick={() => setSettingsTab("tally")}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
            settingsTab === "tally" ? "text-[#5C52FB]" : "text-[#94A3B8] hover:text-[#0F172A]"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tally ERP/Prime Integration
          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider scale-90 border border-amber-300">New</span>
          {settingsTab === "tally" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C52FB]" />}
        </button>
      </div>

      {settingsTab === "general" && (
        <GeneralSettings
          db={db}
          setDb={setDb}
          activeBusiness={activeBusiness}
          activeBusinessId={activeBusinessId}
          isOwnerAdmin={isOwnerAdmin}
          addNotification={addNotification}
          handleResetData={handleResetData}
          exportInventoryToCSV={exportInventoryToCSV}
        />
      )}

      {settingsTab === "tally" && (
        <TallySettings
          db={db}
          setDb={setDb}
          activeBusinessId={activeBusinessId}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}
