import React from "react";
import { FileText, TrendingUp, CheckCircle, RefreshCw, BarChart2, Upload, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AccountingModule({
  db,
  tallyLogs,
  isTallySyncing,
  runTallySync,
  activeBusinessId,
  triggerImportExport
}) {
  // Dynamic financial calculations from active bills
  const activeBills = db.bills.filter((b) => b.business_id === activeBusinessId);
  const totalSales = activeBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const estimatedGST = Math.round(totalSales * 0.18); // 18% standard GST rate
  const estimatedCOGS = Math.round(totalSales * 0.55); // 55% Cost of Goods Sold
  const rentAndSalary = totalSales > 0 ? 23000 : 0; // Rent & salaries
  const netProfit = Math.max(0, totalSales - estimatedCOGS - estimatedGST - rentAndSalary);

  const activeJournal = db.journal.filter((j) => j.business_id === activeBusinessId);

  // Dynamically compute monthly trends
  const getMonthlySalesData = () => {
    const monthsList = [
      { key: "01", name: "Jan 2026", baseline: 45000 },
      { key: "02", name: "Feb 2026", baseline: 58000 },
      { key: "03", name: "Mar 2026", baseline: 72000 },
      { key: "04", name: "Apr 2026", baseline: 65000 },
      { key: "05", name: "May 2026", baseline: 89000 },
      { key: "06", name: "Jun 2026", baseline: 110000 },
      { key: "07", name: "Jul 2026", baseline: 95000 }
    ];

    const billsByMonth = {};
    activeBills.forEach((b) => {
      if (b.date) {
        const monthKey = b.date.split("-")[1];
        if (monthKey) {
          billsByMonth[monthKey] = (billsByMonth[monthKey] || 0) + b.totalAmount;
        }
      }
    });

    return monthsList.map(m => {
      const realBillsAmount = billsByMonth[m.key] || 0;
      return {
        month: m.name,
        "Sales Revenue": m.baseline + realBillsAmount,
        "Real Sales": realBillsAmount,
        "Historical Baseline": m.baseline
      };
    });
  };

  const chartData = getMonthlySalesData();

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      
      {/* Trial balance & core reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Trial Balance / Journal Entry Ledger */}
        <div className="md:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
                <FileText className="text-[#5C52FB] w-4 h-4" />
                Double Entry Journal & Financial Ledger Book
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">Automatic ledger mappings from POS checkout transactions, sales pipelines, and inventory cashflows</p>
            </div>
            {triggerImportExport && (
              <div className="flex gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => triggerImportExport("expenses")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap uppercase tracking-wider"
                  title="Bulk Import Expense Vouchers via spreadsheet"
                >
                  <Upload className="w-4 h-4 text-[#5C52FB]" />
                  <span>Import Expenses</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerImportExport("expenses")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap uppercase tracking-wider"
                  title="Bulk Export Expenses via spreadsheet"
                >
                  <Download className="w-4 h-4 text-[#5C52FB]" />
                  <span>Export Expenses</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl text-xs">
            <table className="w-full text-left text-slate-700">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Memo Description</th>
                  <th className="p-3">Debit Account (Dr)</th>
                  <th className="p-3">Credit Account (Cr)</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeJournal.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#94A3B8] font-medium">
                      No journal vouchers registered in current tenant workspace ledger.
                    </td>
                  </tr>
                ) : (
                  activeJournal.map((j) => (
                    <tr key={j.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-3 font-mono font-bold text-[#94A3B8]">{j.date}</td>
                      <td className="p-3 font-semibold text-[#0F172A]">{j.description}</td>
                      <td className="p-3 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm">{j.debitAccount}</td>
                      <td className="p-3 font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-sm">{j.creditAccount}</td>
                      <td className="p-3 text-right font-bold text-[#5C52FB] font-mono">₹{j.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Profit & Loss statement */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
              <TrendingUp className="text-[#5C52FB] w-4 h-4" />
              Profit & Loss (P&L) Statement
            </h3>
            
            <div className="space-y-4 text-xs font-semibold text-slate-600 mt-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Sales Revenue</p>
                  <p className="text-lg font-bold text-[#0F172A]">₹{totalSales.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Tax liability (GST)</p>
                  <p className="text-lg font-bold text-[#5C52FB]">₹{estimatedGST.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 bg-[#F8FAFC]">
                <div className="flex justify-between">
                  <span>Cost of Goods Sold (COGS):</span>
                  <span className="font-mono text-[#0F172A]">₹{estimatedCOGS.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rent & Employee Salary:</span>
                  <span className="font-mono text-[#0F172A]">₹{rentAndSalary.toLocaleString('en-IN')}</span>
                </div>
                <hr className="border-[#E2E8F0]" />
                <div className="flex justify-between text-sm font-black text-[#5C52FB]">
                  <span>Net Profit Margin:</span>
                  <span className="font-mono">₹{netProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-2 bg-[#F8FAFC]">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Tally Synced State</p>
                <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Soap Sync Match Success
                </div>
                <p className="text-[9px] text-[#94A3B8]">Last synced: {db.tallyState.lastSyncTime}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={runTallySync}
            disabled={isTallySyncing}
            className="w-full mt-4 bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] font-bold py-2.5 px-4 border border-[#E2E8F0] rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5C52FB] ${isTallySyncing ? "animate-spin" : ""}`} />
            {isTallySyncing ? "Syncing Soap Gateways..." : "Sync Tally Now"}
          </button>
        </div>

      </div>

      {/* Monthly Sales Revenue Trend Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-xs">
              <BarChart2 className="text-[#5C52FB] w-4 h-4" />
              Monthly Sales Revenue Trend
            </h3>
            <p className="text-[10px] text-[#94A3B8] mt-1">
              Visualizing combined historical baseline and real-time POS receipts for the active business
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5C52FB]" />
              <span className="text-slate-700">Total Revenue (₹)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#94A3B8" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000) + 'k' : value}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl shadow-lg space-y-1 text-[11px] text-[#0F172A]">
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{data.month}</p>
                        <p className="text-xs font-extrabold text-[#5C52FB]">
                          Total Revenue: ₹{data["Sales Revenue"].toLocaleString('en-IN')}
                        </p>
                        <div className="text-[10px] text-slate-600 space-y-0.5 pt-1 border-t border-[#E2E8F0] mt-1">
                          <p className="flex justify-between gap-4">
                            <span>Historical Baseline:</span>
                            <span className="font-bold text-[#0F172A]">₹{data["Historical Baseline"].toLocaleString('en-IN')}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Real-Time POS Sales:</span>
                            <span className="font-bold text-[#5C52FB]">₹{data["Real Sales"].toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="Sales Revenue" 
                fill="#5C52FB" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tally sync log visualizer */}
      <div className="bg-[#F8FAFC] text-slate-700 font-mono text-[10px] rounded-2xl p-5 space-y-3 border border-[#E2E8F0] shadow-xs">
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
          <p className="text-[10px] font-bold text-[#5C52FB] uppercase tracking-widest">TallyPrime SOAP Core Output Terminal Logs</p>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-200">READY STATE</span>
        </div>
        <div className="space-y-1.5 overflow-y-auto max-h-40 text-slate-500 font-mono leading-relaxed">
          {tallyLogs.map((log, i) => (
            <p key={i} className="text-[10px]">{log}</p>
          ))}
        </div>
      </div>

    </div>
  );
}
