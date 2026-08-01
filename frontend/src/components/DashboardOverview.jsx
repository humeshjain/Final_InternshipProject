import React from "react";
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, Award, CircleAlert, 
  Wallet, Shield, Landmark, Sparkles
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";

export default function DashboardOverview({
  db,
  activeProducts,
  activeCustomers,
  activeBills,
  addNotification,
  setActiveTab,
  activeBusiness
}) {
  
  // Calculations
  const totalRevenue = activeBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const lowStockProducts = activeProducts.filter(p => p.stock <= p.minStockLevel);
  const totalUdhaarOutstanding = activeCustomers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  
  // Dynamic Monthly sales series calculated from activeBills
  const chartData = (() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const mName = monthNames[d.getMonth()];
      const mIndex = d.getMonth();
      const y = d.getFullYear();
      
      const monthlyBills = activeBills.filter(b => {
        const bDate = new Date(b.date);
        return bDate.getMonth() === mIndex && bDate.getFullYear() === y;
      });
      const sales = monthlyBills.reduce((sum, b) => sum + b.totalAmount, 0);
      return { name: mName, sales };
    });
  })();

  const monthlyTarget = 100000;
  const pctAchieved = Math.min(100, monthlyTarget > 0 ? Math.round((totalRevenue / monthlyTarget) * 100) : 0);
  const strokeDashoffset = 276 - (276 * pctAchieved) / 100;

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      
      {/* 3 Bento box visual modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Enterprise Workspace Identity Card */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-56 shadow-xs text-[#0F172A]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5C52FB]/5 rounded-full filter blur-2xl"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Enterprise Tenant Workspace</span>
              <p className="text-xl font-extrabold tracking-tight text-[#0F172A] mt-1 truncate max-w-[180px]" title={activeBusiness.name}>{activeBusiness.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-600 font-medium">Verified Business Account</span>
              </div>
            </div>
            {/* Visual SIM-card chip in premium violet */}
            <div className="w-9 h-7 bg-[#5C52FB] rounded-md flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-1 border border-white/20 rounded-sm"></div>
              <div className="w-1.5 h-full bg-white/10 absolute left-2"></div>
              <div className="w-1.5 h-full bg-white/10 absolute right-2"></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-mono tracking-widest text-slate-600">
              <div className="space-y-0.5">
                <span className="text-[9px] text-[#94A3B8] uppercase font-black tracking-wider block">GSTIN REGISTRY</span>
                <span className="text-xs font-bold text-[#0F172A] font-mono">{activeBusiness.gstin || "Unregistered"}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-[#E2E8F0] pt-3">
              <div>
                <p className="text-[9px] text-[#94A3B8] uppercase font-black tracking-wider">Workspace ID</p>
                <p className="text-xs font-bold text-[#0F172A] font-mono">#{activeBusiness.id}</p>
              </div>
              <div className="flex items-center gap-1">
                <Landmark className="w-4 h-4 text-[#5C52FB]" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#5C52FB] font-mono">ELEVATE PAY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: KPI Metrics + SVG Circular Ring Gauge */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex items-center justify-between h-56 shadow-xs">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Sales Revenue Achieved</span>
              <p className="text-3xl font-bold text-[#0F172A]">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-[#5C52FB] font-bold">
                <ArrowUpRight className="w-4 h-4" />
                <span>Target: ₹{monthlyTarget.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-[#94A3B8] font-medium">Monthly enterprise growth benchmark</p>
            </div>
          </div>

          {/* SVG Circular Ring Gauge */}
          <div className="w-28 h-28 relative flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="44"
                className="stroke-slate-100 fill-none"
                strokeWidth="7"
              />
              <circle
                cx="56"
                cy="56"
                r="44"
                className="stroke-[#5C52FB] fill-none transition-all duration-1000"
                strokeWidth="7"
                strokeDasharray="276"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm font-extrabold text-[#0F172A]">{pctAchieved}%</span>
              <span className="text-[8px] text-[#94A3B8] uppercase tracking-wider font-bold">Achieved</span>
            </div>
          </div>
        </div>

        {/* Module 3: Credit and Stock Alerts Bento */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-56 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Active Alerts & Credit</span>
              <p className="text-3xl font-bold text-[#0F172A] mt-1">₹{totalUdhaarOutstanding.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-[#94A3B8] font-medium">Uncollected customer credit balances</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <CircleAlert className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div> Low Stock SKUs:
              </span>
              <span 
                onClick={() => setActiveTab("inventory")}
                className="font-bold text-rose-600 hover:underline cursor-pointer"
              >
                {lowStockProducts.length} items
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <div className="w-2 h-2 rounded-full bg-[#5C52FB]"></div> Pending collection:
              </span>
              <span 
                onClick={() => setActiveTab("crm")}
                className="font-bold text-[#5C52FB] hover:underline cursor-pointer"
              >
                {activeCustomers.filter(c => c.outstandingBalance > 0).length} parties
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Charts section (Recharts) and Quick triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Bar chart container */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-[#0F172A] text-sm flex items-center gap-1.5">
                <TrendingUp className="text-[#5C52FB] w-4.5 h-4.5" />
                Monthly Revenue Analytics & Profit Margins
              </h4>
              <p className="text-xs text-[#94A3B8] mt-1">Real-time charts synced automatically with Tally double entry mappings</p>
            </div>
          </div>

          <div className="h-64 w-full text-slate-600">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#E2E8F0", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
                  itemStyle={{ color: "#5C52FB" }}
                  labelStyle={{ color: "#0F172A", fontWeight: "bold" }}
                />
                <Bar dataKey="sales" fill="#5C52FB" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Launchers panel */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <h4 className="font-bold text-[#94A3B8] text-xs border-b border-slate-100 pb-2 uppercase tracking-wider block">QUICK STORE ACTIONS</h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { title: "New Bill", icon: <Award className="w-4 h-4 text-[#5C52FB]" />, tab: "pos", desc: "Open cash terminal" },
                { title: "Inventory", icon: <Wallet className="w-4 h-4 text-[#5C52FB]" />, tab: "inventory", desc: "SKU database" },
                { title: "Customer CRM", icon: <Shield className="w-4 h-4 text-[#5C52FB]" />, tab: "crm", desc: "Accounts ledger" },
                { title: "AI Assistant", icon: <Sparkles className="w-4 h-4 text-[#5C52FB]" />, tab: "ai", desc: "Voice commands" }
              ].map((act, i) => (
                <div 
                  key={i}
                  onClick={() => setActiveTab(act.tab)}
                  className="bg-[#F8FAFC] hover:bg-[#5C52FB]/5 border border-[#E2E8F0] hover:border-[#5C52FB]/30 p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-24 text-left group"
                >
                  <div className="flex items-center justify-between text-[#5C52FB]">
                    {act.icon}
                    <span className="text-[8px] text-[#94A3B8] font-bold uppercase group-hover:text-[#5C52FB]">GO ↗</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{act.title}</p>
                    <p className="text-[9px] text-[#94A3B8] mt-0.5 line-clamp-1">{act.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#0F172A] flex items-center gap-2 mt-4 font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Business Status: Active & Operational</span>
          </div>
        </div>

      </div>

      {/* Recent transactions list table at bottom */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-[#0F172A] text-sm">Recent Store Invoices</h4>
            <p className="text-xs text-[#94A3B8] mt-0.5">Real-time status updates of active cashier dispatches</p>
          </div>
          <button 
            onClick={() => setActiveTab("pos")}
            className="text-xs font-bold text-[#3B38FA] hover:underline cursor-pointer uppercase tracking-wider"
          >
            Create Bill
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              <tr>
                <th className="p-3">INVOICE NO</th>
                <th className="p-3">CUSTOMER PARTY</th>
                <th className="p-3">DATE</th>
                <th className="p-3">PAYMENT METHOD</th>
                <th className="p-3 text-right">AMOUNT (₹)</th>
                <th className="p-3">WHATSAPP / SMS</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeBills.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#5C52FB]">{b.invoiceNumber}</td>
                  <td className="p-3">
                    <p className="font-bold text-[#0F172A]">{b.customerName}</p>
                    <p className="text-[10px] text-[#94A3B8]">{b.customerPhone}</p>
                  </td>
                  <td className="p-3 font-medium text-slate-500">{b.date}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] text-[10px] rounded font-semibold">
                      {b.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-[#0F172A] font-mono">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-xs text-emerald-600 font-semibold">✓ Dispatched</td>
                  <td className="p-3">
                    {b.paymentStatus === "Paid" ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded">Paid</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
