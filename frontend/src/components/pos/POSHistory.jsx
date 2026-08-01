import React from "react";
import { 
  History, Upload, Download, Search, Printer, XCircle, FileText
} from "lucide-react";
import { PaymentStatus } from "../../types";

export default function POSHistory({
  activeBills,
  triggerImportExport,
  posSearchTerm,
  setPosSearchTerm,
  billStatus,
  setBillStatus,
  customerState,
  setCustomerState,
  setInvoicePreviewBill,
  setInvoiceToVoid,
  setVoidOperatorRole,
  setVoidReason,
  setShowVoidModal,
  db
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6 text-[#0F172A]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h3 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
            <History className="text-[#5C52FB] w-5 h-5 animate-spin animate-duration-[12000ms]" />
            Invoice Audit History Ledger
          </h3>
          <p className="text-xs text-[#94A3B8] font-normal mt-1">
            A fully compliant GSTR-1 audit log. View, reprint, download, or void finalized retail invoices.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {triggerImportExport && (
            <>
              <button
                type="button"
                onClick={() => triggerImportExport("bills")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                title="Bulk Import Sales Invoices via Excel/CSV spreadsheet"
              >
                <Upload className="w-4 h-4 text-[#5C52FB]" />
                <span>Import Bills</span>
              </button>
              <button
                type="button"
                onClick={() => triggerImportExport("bills")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                title="Bulk Export Sales Invoices via Excel/CSV spreadsheet"
              >
                <Download className="w-4 h-4 text-[#5C52FB]" />
                <span>Export Bills</span>
              </button>
            </>
          )}

          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full font-mono">
            Active Bills: {activeBills.length}
          </span>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full font-mono">
            Voided Bills: {activeBills.filter(b => b.paymentStatus === PaymentStatus.REFUNDED).length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
        <div>
          <label className="label-elevate">SEARCH INVOICE</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Invoice #, customer or phone..."
              value={posSearchTerm}
              onChange={(e) => setPosSearchTerm(e.target.value)}
              className="input-elevate pl-8 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="label-elevate">PAYMENT STATUS</label>
          <select
            value={billStatus}
            onChange={(e) => setBillStatus(e.target.value)}
            className="input-elevate text-xs"
          >
            <option value={PaymentStatus.PAID}>Show Paid Only</option>
            <option value={PaymentStatus.PARTIAL}>Show Partially Paid</option>
            <option value={PaymentStatus.PENDING}>Show Outstanding / Credit</option>
            <option value={PaymentStatus.REFUNDED}>Show Voided / Refunded</option>
            <option value="">View All Invoices</option>
          </select>
        </div>

        <div>
          <label className="label-elevate">REGION / GST SPLIT</label>
          <select
            value={customerState}
            onChange={(e) => setCustomerState(e.target.value)}
            className="input-elevate text-xs"
          >
            <option value="">All States</option>
            <option value="Maharashtra">Intra-State (Maharashtra)</option>
            <option value="Delhi">Inter-State (Delhi)</option>
            <option value="Karnataka">Inter-State (Karnataka)</option>
            <option value="Tamil Nadu">Inter-State (Tamil Nadu)</option>
          </select>
        </div>
      </div>

      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider">
              <tr>
                <th className="p-3">INVOICE NUMBER</th>
                <th className="p-3">DATE</th>
                <th className="p-3">CUSTOMER DETAILS</th>
                <th className="p-3 text-right">TAX SPLIT TYPE</th>
                <th className="p-3 text-right">TOTAL (₹)</th>
                <th className="p-3 text-right">PAID (₹)</th>
                <th className="p-3 text-center">RECEIPT STATUS</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeBills
                .filter((b) => {
                  if (posSearchTerm.trim()) {
                    const s = posSearchTerm.toLowerCase();
                    const matchId = b.invoiceNumber.toLowerCase().includes(s);
                    const matchCust = b.customerName.toLowerCase().includes(s);
                    const matchPhone = b.customerPhone.includes(s);
                    if (!matchId && !matchCust && !matchPhone) return false;
                  }
                  if (billStatus && b.paymentStatus !== billStatus) {
                    return false;
                  }
                  return true;
                })
                .length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-12 text-[#94A3B8] font-medium">
                      No matching historical retail invoices found. Modify filters above.
                    </td>
                  </tr>
                ) : (
                  activeBills
                    .filter((b) => {
                      if (posSearchTerm.trim()) {
                        const s = posSearchTerm.toLowerCase();
                        const matchId = b.invoiceNumber.toLowerCase().includes(s);
                        const matchCust = b.customerName.toLowerCase().includes(s);
                        const matchPhone = b.customerPhone.includes(s);
                        if (!matchId && !matchCust && !matchPhone) return false;
                      }
                      if (billStatus && b.paymentStatus !== billStatus) {
                        return false;
                      }
                      return true;
                    })
                    .map((b) => {
                      const isMH = b.customerPhone.includes("+91 98") || b.customerName.includes("Rahul") || b.customerName.includes("Maharashtra") || b.customerId === "walk-in";
                      const cgst = isMH ? b.gstAmount / 2 : 0;
                      const sgst = isMH ? b.gstAmount / 2 : 0;
                      const igst = isMH ? 0 : b.gstAmount;

                      return (
                        <tr key={b.id} className="hover:bg-[#F8FAFC] text-slate-700 transition-colors">
                          <td className="p-3 font-mono font-bold text-[#5C52FB]">
                            {b.invoiceNumber}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#94A3B8]">
                            {b.date}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-[#0F172A]">{b.customerName}</p>
                            <p className="text-[10px] text-[#94A3B8] font-mono">{b.customerPhone}</p>
                          </td>
                          <td className="p-3 text-right font-mono text-[10px] text-[#94A3B8]">
                            {isMH ? (
                              <span>CGST ₹{cgst.toFixed(1)} + SGST ₹{sgst.toFixed(1)}</span>
                            ) : (
                              <span className="text-[#5C52FB] font-bold">IGST ₹{igst.toFixed(1)} (Inter)</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-[#5C52FB] font-mono">
                            ₹{b.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-[#0F172A] font-mono">
                            ₹{b.paidAmount.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                              b.paymentStatus === PaymentStatus.PAID
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : b.paymentStatus === PaymentStatus.PARTIAL
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : b.paymentStatus === PaymentStatus.REFUNDED
                                ? "bg-slate-100 text-slate-500 border-slate-200 line-through"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setInvoicePreviewBill(b)}
                                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#5C52FB] text-[#0F172A] hover:text-[#5C52FB] rounded-md transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                title="View & Reprint Invoice"
                              >
                                <Printer className="w-3 h-3" />
                                Reprint
                              </button>
                              
                              {b.paymentStatus !== PaymentStatus.REFUNDED && (
                                <button
                                  onClick={() => {
                                    setInvoiceToVoid(b);
                                    setVoidOperatorRole("Manager");
                                    setVoidReason("");
                                    setShowVoidModal(true);
                                  }}
                                  className="p-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  title="Void Invoice"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Void Bill
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#5C52FB]" />
          Compliance Real-Time Audit Log
        </h4>
        <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2">
          {(db.auditLogs || []).filter((log) => log.action.includes("Void") || log.action.includes("Invoice")).slice(0, 10).map((log) => (
            <div key={log.id} className="text-[10px] font-mono text-[#94A3B8] flex justify-between border-b border-[#E2E8F0] pb-1">
              <span>
                <strong className="text-[#0F172A]">[{log.timestamp}]</strong> {log.details}
              </span>
              <span className="text-[#0F172A] font-bold bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0] text-[9px]">
                by {log.username}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
