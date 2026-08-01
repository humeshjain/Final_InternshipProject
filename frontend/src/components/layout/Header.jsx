import React from "react";
import { RefreshCw, Building2 } from "lucide-react";
import { EmployeeRole } from "../../constants/roles.js";

export default function Header({
  activeBusiness,
  activeBusinessId,
  setActiveBusinessId,
  currentUser,
  currentUserRole,
  db,
  isTallySyncing,
  runTallySync
}) {
  return (
    <header className="h-20 border-b border-[#E2E8F0] px-6 flex flex-col md:flex-row items-center justify-between gap-4 py-3 flex-shrink-0 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#5C52FB]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Workspace Scope:</span>
          <span className="text-sm font-bold text-[#0F172A]">{activeBusiness?.name || `${activeBusinessId} Enterprise`}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        <select 
          id="select-active-business"
          value={activeBusinessId} 
          disabled={currentUserRole !== EmployeeRole.OWNER && currentUserRole !== EmployeeRole.CO_OWNER}
          onChange={(e) => setActiveBusinessId(e.target.value)}
          className="text-xs font-bold bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5C52FB] text-[#0F172A] disabled:opacity-40 cursor-pointer shadow-xs"
        >
          {db.businesses.filter(b => b.ownerId === currentUser?.id || b.id === "biz-1" || b.id === "biz-2").map(b => (
            <option key={b.id} value={b.id} className="bg-white">{b.name || `${b.id} Workspace`}</option>
          ))}
        </select>

        <div id="role-display-badge" className="text-[10px] bg-[#5C52FB]/10 border border-[#5C52FB]/20 rounded-xl px-3 py-2 text-[#5C52FB] font-extrabold uppercase tracking-wider">
          ROLE: {currentUserRole}
        </div>

        <button 
          id="btn-tally-sync"
          onClick={runTallySync}
          disabled={isTallySyncing}
          className="bg-[#5C52FB] hover:bg-[#4F46E5] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#5C52FB]/20 cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white ${isTallySyncing ? "animate-spin" : ""}`} />
          <span>SYNC TALLY</span>
        </button>
      </div>
    </header>
  );
}
