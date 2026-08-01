import React from "react";
import { 
  PlusCircle, User, UserPlus, XCircle, Mail, Send, RefreshCw, Printer, Download, Receipt
} from "lucide-react";
import { PaymentMethod } from "../../types";

export function AddCatalogModal({
  showAddCatalogModal,
  setShowAddCatalogModal,
  handleAddCatalogProduct,
  newCatalogProdName,
  setNewCatalogProdName,
  newCatalogProdSku,
  setNewCatalogProdSku,
  newCatalogProdBarcode,
  setNewCatalogProdBarcode,
  newCatalogProdPurchasePrice,
  setNewCatalogProdPurchasePrice,
  newCatalogProdSalePrice,
  setNewCatalogProdSalePrice,
  newCatalogProdGst,
  setNewCatalogProdGst,
  newCatalogProdCategory,
  setNewCatalogProdCategory,
  newCatalogProdUnit,
  setNewCatalogProdUnit,
  newCatalogProdStock,
  setNewCatalogProdStock,
  newCatalogProdMinStock,
  setNewCatalogProdMinStock,
  categories = []
}) {
  if (!showAddCatalogModal) return null;

  return (
    <div id="modal-add-catalog-product" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <PlusCircle className="text-[#5C52FB] w-4.5 h-4.5" />
            Add New Product to Catalog
          </h4>
          <button 
            id="btn-close-catalog-modal"
            onClick={() => setShowAddCatalogModal(false)}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Create a permanent item in your product catalog. This saves the product SKU, barcode, and pricing to the master inventory database. Price values are in <strong>Indian Rupee (₹)</strong>.
        </p>

        <form onSubmit={handleAddCatalogProduct} className="space-y-4 text-xs">
          <div>
            <label className="label-elevate">PRODUCT NAME *</label>
            <input 
              id="catalog-prod-name"
              type="text"
              required
              placeholder="e.g. Fortune Mustard Oil 1L"
              value={newCatalogProdName}
              onChange={(e) => setNewCatalogProdName(e.target.value)}
              className="input-elevate"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-elevate">SKU / CODE (OPTIONAL)</label>
              <input 
                id="catalog-prod-sku"
                type="text"
                placeholder="Auto-generated if blank"
                value={newCatalogProdSku}
                onChange={(e) => setNewCatalogProdSku(e.target.value)}
                className="input-elevate"
              />
            </div>
            <div>
              <label className="label-elevate">BARCODE (OPTIONAL)</label>
              <input 
                id="catalog-prod-barcode"
                type="text"
                placeholder="Auto-generated if blank"
                value={newCatalogProdBarcode}
                onChange={(e) => setNewCatalogProdBarcode(e.target.value)}
                className="input-elevate"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-elevate">PURCHASE PRICE (₹)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-[#94A3B8] font-bold font-mono text-xs">₹</span>
                <input 
                  id="catalog-prod-purchase-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newCatalogProdPurchasePrice || ""}
                  onChange={(e) => setNewCatalogProdPurchasePrice(Number(e.target.value))}
                  className="input-elevate pl-6 font-mono font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="label-elevate">SALE PRICE (₹) *</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-[#94A3B8] font-bold font-mono text-xs">₹</span>
                <input 
                  id="catalog-prod-sale-price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newCatalogProdSalePrice || ""}
                  onChange={(e) => setNewCatalogProdSalePrice(Number(e.target.value))}
                  className="input-elevate pl-6 font-mono font-bold text-[#0F172A]"
                />
              </div>
            </div>
            <div>
              <label className="label-elevate">GST TAX RATE</label>
              <select
                id="catalog-prod-gst"
                value={newCatalogProdGst}
                onChange={(e) => setNewCatalogProdGst(Number(e.target.value))}
                className="input-elevate"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="label-elevate">CATEGORY</label>
              <select
                id="catalog-prod-category"
                value={newCatalogProdCategory}
                onChange={(e) => setNewCatalogProdCategory(e.target.value)}
                className="input-elevate text-[11px]"
              >
                {categories.filter(c => (c.status || "Active") === "Active" || c.name === newCatalogProdCategory).map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.code || "GEN"})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="label-elevate">UNIT</label>
              <select
                value={newCatalogProdUnit}
                onChange={(e) => setNewCatalogProdUnit(e.target.value)}
                className="input-elevate text-[11px]"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="liters">liters</option>
                <option value="ml">ml</option>
                <option value="meters">meters</option>
                <option value="strip">strip</option>
                <option value="tablet">tablet</option>
                <option value="box">box</option>
                <option value="packet">packet</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="label-elevate">STOCK QTY</label>
              <input 
                id="catalog-prod-stock"
                type="number"
                min="0"
                value={newCatalogProdStock}
                onChange={(e) => setNewCatalogProdStock(Number(e.target.value))}
                className="input-elevate font-mono text-[11px]"
              />
            </div>
            <div className="col-span-1">
              <label className="label-elevate">MIN STOCK</label>
              <input 
                id="catalog-prod-min-stock"
                type="number"
                min="0"
                value={newCatalogProdMinStock}
                onChange={(e) => setNewCatalogProdMinStock(Number(e.target.value))}
                className="input-elevate font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              id="btn-add-catalog-cancel"
              type="button"
              onClick={() => setShowAddCatalogModal(false)}
              className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-add-catalog-submit"
              type="submit"
              className="btn-elevate-primary flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save & Add to Bill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddManualModal({
  showManualForm,
  setShowManualForm,
  manualName,
  setManualName,
  manualPrice,
  setManualPrice,
  manualGst,
  setManualGst,
  manualQty,
  setManualQty,
  manualUnit,
  setManualUnit,
  addCustomItemDirectly
}) {
  if (!showManualForm) return null;

  return (
    <div id="modal-add-manual-item" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <PlusCircle className="text-[#5C52FB] w-4 h-4" />
            Add Manual/Custom Item
          </h4>
          <button 
            id="btn-close-manual-modal"
            onClick={() => {
              setShowManualForm(false);
              setManualName("");
              setManualPrice(0);
              setManualQty(1);
              setManualGst(18);
            }}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Directly append a custom or unlisted product into the current billing cart. Price values are formatted in <strong>Indian Rupee (₹)</strong>.
        </p>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="label-elevate">ITEM / PRODUCT NAME</label>
            <input 
              id="input-manual-name"
              type="text"
              placeholder="e.g. Custom Fitting, Service Charge"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="input-elevate"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-elevate">SALE PRICE (₹ INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#94A3B8] font-bold font-mono">₹</span>
                <input 
                  id="input-manual-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={manualPrice || ""}
                  onChange={(e) => setManualPrice(Number(e.target.value))}
                  className="input-elevate pl-7 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="label-elevate">GST TAX RATE</label>
              <select
                id="select-manual-gst"
                value={manualGst}
                onChange={(e) => setManualGst(Number(e.target.value))}
                className="input-elevate"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (GST 5)</option>
                <option value="12">12% (GST 12)</option>
                <option value="18">18% (GST 18)</option>
                <option value="28">28% (GST 28)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-elevate">QUANTITY TO ADD</label>
              <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setManualQty(q => Math.max(0.01, Number((q - 1).toFixed(2))))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-[#E2E8F0] font-bold text-[#0F172A] flex items-center justify-center transition-all text-xs cursor-pointer shadow-xs"
                >
                  -
                </button>
                <input 
                  id="input-manual-qty"
                  type="number"
                  step="any"
                  min="0.01"
                  value={manualQty}
                  onChange={(e) => setManualQty(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-transparent text-center font-bold font-mono text-[#0F172A] text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setManualQty(q => Number((q + 1).toFixed(2)))}
                  className="w-7 h-7 rounded bg-white hover:bg-slate-100 border border-[#E2E8F0] font-bold text-[#0F172A] flex items-center justify-center transition-all text-xs cursor-pointer shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="label-elevate">UNIT OF MEASURE</label>
              <select
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value)}
                className="input-elevate"
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
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between items-center text-xs">
            <span className="text-[#94A3B8] font-bold">Estimated Row Total:</span>
            <span className="text-[#5C52FB] font-extrabold font-mono text-sm">
              ₹{((manualPrice || 0) * (manualQty || 1)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            id="btn-manual-cancel"
            type="button"
            onClick={() => {
              setShowManualForm(false);
              setManualName("");
              setManualPrice(0);
              setManualQty(1);
              setManualGst(18);
            }}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-manual-submit"
            type="button"
            onClick={addCustomItemDirectly}
            className="btn-elevate-primary flex-1 cursor-pointer"
          >
            Add to Bill Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditCustomerModal({
  editingCustomerPOS,
  setEditingCustomerPOS,
  editFormPOS,
  setEditFormPOS,
  handleSaveCustomerEditPOS
}) {
  if (!editingCustomerPOS) return null;

  return (
    <div id="modal-edit-customer-pos" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <User className="text-[#5C52FB] w-4 h-4" />
            Edit Customer Details
          </h4>
          <button 
            onClick={() => setEditingCustomerPOS(null)}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="label-elevate">CUSTOMER FULL NAME *</label>
            <input 
              type="text"
              value={editFormPOS.name}
              onChange={(e) => setEditFormPOS(prev => ({ ...prev, name: e.target.value }))}
              className="input-elevate"
            />
          </div>

          <div>
            <label className="label-elevate">WHATSAPP PHONE NUMBER *</label>
            <input 
              type="text"
              value={editFormPOS.phone}
              onChange={(e) => setEditFormPOS(prev => ({ ...prev, phone: e.target.value }))}
              className="input-elevate"
            />
          </div>

          <div>
            <label className="label-elevate">EMAIL ADDRESS</label>
            <input 
              type="email"
              value={editFormPOS.email}
              onChange={(e) => setEditFormPOS(prev => ({ ...prev, email: e.target.value }))}
              className="input-elevate"
            />
          </div>

          <div>
            <label className="label-elevate">GSTIN</label>
            <input 
              type="text"
              value={editFormPOS.gstin}
              onChange={(e) => setEditFormPOS(prev => ({ ...prev, gstin: e.target.value }))}
              className="input-elevate font-mono"
              placeholder="e.g. 27AAAAA1111A1Z1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-elevate">
                CREDIT LIMIT (₹) <span className="text-[8px] text-[#94A3B8] lowercase">(0 = Unlimited)</span>
              </label>
              <input 
                type="number"
                value={editFormPOS.creditLimit}
                onChange={(e) => setEditFormPOS(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                className="input-elevate font-mono font-bold"
              />
            </div>

            <div>
              <label className="label-elevate">LOYALTY TIER</label>
              <select
                value={editFormPOS.membershipTier}
                onChange={(e) => setEditFormPOS(prev => ({ ...prev, membershipTier: e.target.value }))}
                className="input-elevate"
              >
                <option value="Regular">Regular</option>
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Elite</option>
                <option value="VIP">VIP Lounge</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setEditingCustomerPOS(null)}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCustomerEditPOS}
            className="btn-elevate-primary flex-1 cursor-pointer"
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuickCustomerModal({
  showCustomerForm,
  setShowCustomerForm,
  newCustName,
  setNewCustName,
  newCustPhone,
  setNewCustPhone,
  newCustEmail,
  setNewCustEmail,
  newCustCreditLimit,
  setNewCustCreditLimit,
  newCustTier,
  setNewCustTier,
  quickRegisterCustomer
}) {
  if (!showCustomerForm) return null;

  return (
    <div id="modal-quick-customer" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <UserPlus className="text-[#5C52FB] w-4 h-4" />
            Register New Customer
          </h4>
          <button 
            id="btn-close-customer-modal"
            onClick={() => {
              setShowCustomerForm(false);
              setNewCustName("");
              setNewCustPhone("");
              setNewCustEmail("");
            }}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Register a persistent customer account to track credit balances (Udhaar), loyalty tiers, and automated billing dispatches.
        </p>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="label-elevate">CUSTOMER FULL NAME *</label>
            <input 
              id="input-cust-name"
              type="text"
              placeholder="e.g. Amit Kumar"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="input-elevate"
            />
          </div>

          <div>
            <label className="label-elevate">WHATSAPP PHONE NUMBER *</label>
            <input 
              id="input-cust-phone"
              type="text"
              placeholder="e.g. +91 9876543210"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              className="input-elevate"
            />
          </div>

          <div>
            <label className="label-elevate">EMAIL ADDRESS (OPTIONAL)</label>
            <input 
              id="input-cust-email"
              type="email"
              placeholder="e.g. amit.kumar@example.com"
              value={newCustEmail}
              onChange={(e) => setNewCustEmail(e.target.value)}
              className="input-elevate"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-elevate">
                CREDIT LIMIT (₹) <span className="text-[9px] text-[#94A3B8] lowercase">(0 = Unlimited)</span>
              </label>
              <input 
                id="input-cust-credit"
                type="number"
                value={newCustCreditLimit}
                onChange={(e) => setNewCustCreditLimit(Number(e.target.value))}
                className="input-elevate font-mono font-bold"
              />
            </div>

            <div>
              <label className="label-elevate">LOYALTY TIER</label>
              <select
                id="select-cust-tier"
                value={newCustTier}
                onChange={(e) => setNewCustTier(e.target.value)}
                className="input-elevate"
              >
                <option value="Standard">Standard</option>
                <option value="Gold">Gold Elite</option>
                <option value="VIP">VIP Lounge</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            id="btn-cust-cancel"
            type="button"
            onClick={() => {
              setShowCustomerForm(false);
              setNewCustName("");
              setNewCustPhone("");
              setNewCustEmail("");
            }}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-cust-submit"
            type="button"
            onClick={quickRegisterCustomer}
            className="btn-elevate-primary flex-1 cursor-pointer"
          >
            Register & Select
          </button>
        </div>
      </div>
    </div>
  );
}

export function VoidModal({
  showVoidModal,
  setShowVoidModal,
  invoiceToVoid,
  setInvoiceToVoid,
  voidReason,
  setVoidReason,
  voidOperatorRole,
  setVoidOperatorRole,
  voidFinalizedBill
}) {
  if (!showVoidModal || !invoiceToVoid) return null;

  return (
    <div id="modal-void-invoice" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-rose-600 flex items-center gap-2 text-sm">
            <XCircle className="text-rose-500 w-4 h-4" />
            Authorize Invoice Voiding
          </h4>
          <button 
            id="btn-close-void-modal"
            onClick={() => {
              setShowVoidModal(false);
              setInvoiceToVoid(null);
              setVoidReason("");
            }}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Voiding invoice <strong className="text-[#0F172A]">{invoiceToVoid.invoiceNumber}</strong> (Customer: {invoiceToVoid.customerName}) will automatically restore product inventory stocks and reverse customer due accounts.
        </p>

        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-semibold">Total Amount Reversing:</span>
            <span className="text-rose-700 font-bold font-mono">₹{invoiceToVoid.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-semibold">Items Count to Refund:</span>
            <span className="text-[#0F172A] font-bold">{invoiceToVoid.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="label-elevate">OPERATOR ROLE OVERRIDE</label>
            <select
              id="select-void-role"
              value={voidOperatorRole}
              onChange={(e) => setVoidOperatorRole(e.target.value)}
              className="input-elevate"
            >
              <option value="Manager">Manager Override</option>
              <option value="Owner">Owner Override</option>
              <option value="Admin">Administrator</option>
            </select>
          </div>

          <div>
            <label className="label-elevate">MANDATORY CANCELLATION REASON *</label>
            <input 
              id="input-void-reason"
              type="text"
              placeholder="e.g. Double entry, customer return"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="input-elevate border-rose-300 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            id="btn-void-cancel"
            type="button"
            onClick={() => {
              setShowVoidModal(false);
              setInvoiceToVoid(null);
              setVoidReason("");
            }}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Keep Active
          </button>
          <button
            id="btn-void-submit"
            type="button"
            onClick={() => voidFinalizedBill(invoiceToVoid, voidReason, voidOperatorRole)}
            className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Void Bill Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmailModal({
  showEmailModal,
  setShowEmailModal,
  emailInvoiceRef,
  setEmailInvoiceRef,
  emailAddress,
  setEmailAddress,
  handleMockSendEmail,
  isSendingEmail
}) {
  if (!showEmailModal || !emailInvoiceRef) return null;

  return (
    <div id="modal-email-invoice" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <Mail className="text-[#5C52FB] w-4 h-4" />
            Dispatch Email Invoice
          </h4>
          <button 
            id="btn-close-email-modal"
            onClick={() => {
              setShowEmailModal(false);
              setEmailAddress("");
              setEmailInvoiceRef(null);
            }}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Enter customer email address to dispatch the electronic PDF receipt copy of invoice <strong className="text-[#0F172A]">{emailInvoiceRef.invoiceNumber}</strong>.
        </p>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="label-elevate">RECIPIENT EMAIL ADDRESS</label>
            <input 
              id="input-email-address"
              type="email"
              placeholder="e.g. consumer@elevatebusiness.ai"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="input-elevate"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            id="btn-email-cancel"
            type="button"
            onClick={() => {
              setShowEmailModal(false);
              setEmailAddress("");
              setEmailInvoiceRef(null);
            }}
            className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-email-submit"
            type="button"
            onClick={handleMockSendEmail}
            disabled={isSendingEmail}
            className="btn-elevate-primary flex-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isSendingEmail ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InvoicePreviewModal({
  invoicePreviewBill,
  setInvoicePreviewBill,
  activeBusiness,
  getBusinessUPI,
  taxMode,
  isIntraState,
  addNotification
}) {
  if (!invoicePreviewBill) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] text-[#0F172A]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <h4 className="font-bold text-[#0F172A] flex items-center gap-2 text-sm">
            <Printer className="text-[#5C52FB] w-4 h-4" />
            GST Invoice Generated
          </h4>
          <button 
            onClick={() => setInvoicePreviewBill(null)}
            className="text-[#94A3B8] hover:text-[#0F172A] font-bold cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl my-4 font-mono text-xs text-[#0F172A]">
          <div className="text-center space-y-1">
            <p className="font-extrabold text-sm text-[#0F172A]">{activeBusiness.name}</p>
            <p className="text-[#94A3B8] text-[11px]">{activeBusiness.address}</p>
            <p className="text-[#94A3B8] text-[11px]">Phone: {activeBusiness.phone} · GSTIN: {activeBusiness.gstin}</p>
            <p className="border-t border-dashed border-[#E2E8F0] pt-1 font-bold text-[#5C52FB]">GST TAX INVOICE</p>
          </div>

          <div className="flex justify-between border-y border-dashed border-[#E2E8F0] py-2 text-[#0F172A]">
            <div>
              <p>Invoice: {invoicePreviewBill.invoiceNumber}</p>
              <p>Date: {invoicePreviewBill.date}</p>
            </div>
            <div className="text-right">
              <p>Party: {invoicePreviewBill.customerName}</p>
              <p>Phone: {invoicePreviewBill.customerPhone}</p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#94A3B8] text-[10px] uppercase">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoicePreviewBill.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-200">
                  <td className="py-1 font-semibold">{item.productName}</td>
                  <td className="text-center py-1 font-mono font-bold text-slate-700">{item.quantity} <span className="text-[10px] text-[#5C52FB] uppercase">{item.unit || "pcs"}</span></td>
                  <td className="text-right py-1 font-mono font-bold">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-right text-xs">
            <p className="text-[#94A3B8]">Tax Mode: {taxMode === "inclusive" ? "GST Inclusive" : "GST Exclusive"}</p>
            <p className="text-[#94A3B8]">Taxable Value (Sub-Total): ₹{invoicePreviewBill.subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            {isIntraState ? (
              <>
                <p className="text-[#94A3B8]">CGST (Central Tax - 50%): ₹{(invoicePreviewBill.gstAmount / 2).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-[#94A3B8]">SGST (State Tax - 50%): ₹{(invoicePreviewBill.gstAmount / 2).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </>
            ) : (
              <p className="text-[#94A3B8]">IGST (Integrated Tax - 100%): ₹{invoicePreviewBill.gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            )}
            <p className="font-extrabold text-sm border-t border-dashed border-[#E2E8F0] pt-1 text-[#5C52FB]">
              Grand Total: ₹{invoicePreviewBill.totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p>Paid Amount: ₹{invoicePreviewBill.paidAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            <p className="text-rose-600 font-bold">Due Amount: ₹{Math.max(0, invoicePreviewBill.totalAmount - invoicePreviewBill.paidAmount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>

          {invoicePreviewBill.paymentMethod === PaymentMethod.UPI && (
            <div className="flex flex-col items-center justify-center pt-2.5 border-t border-dashed border-[#E2E8F0] space-y-1">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Scan to pay instantly via UPI</p>
              <div className="bg-white p-1.5 border border-[#E2E8F0] rounded-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=4&data=${encodeURIComponent(
                    `upi://pay?pa=${getBusinessUPI()}&pn=${encodeURIComponent(activeBusiness.name)}&am=${invoicePreviewBill.totalAmount.toFixed(2)}&tn=${invoicePreviewBill.invoiceNumber}&cu=INR`
                  )}`}
                  alt="UPI Bill Receipt QR"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[8px] text-[#94A3B8] font-mono">VPA: {getBusinessUPI()}</p>
            </div>
          )}

          <div className="text-center border-t border-dashed border-[#E2E8F0] pt-2 text-[#94A3B8] text-[10px]">
            <p className="font-bold text-[#0F172A]">THANK YOU! VISIT AGAIN!</p>
            <p className="text-[#3B38FA] underline">https://elevatebusiness.ai/pay?invoice={invoicePreviewBill.invoiceNumber}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => window.print()}
            className="flex-1 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#0F172A] font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Thermal Print
          </button>
          <button 
            onClick={() => addNotification(`Exported invoice PDF for ${invoicePreviewBill.invoiceNumber}`, "success")}
            className="btn-elevate-primary flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download A4 PDF
          </button>
        </div>
      </div>
    </div>
  );
}
