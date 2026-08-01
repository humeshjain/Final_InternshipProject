import React from "react";
import { UserCheck, Upload, Download } from "lucide-react";

export default function HRModule({
  db,
  addNotification,
  activeBusinessId,
  triggerImportExport
}) {
  const activeUsers = db.users.filter((u) => u.businessId === activeBusinessId);

  return (
    <div className="space-y-6 text-[#0F172A]">
      
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
              <UserCheck className="text-[#5C52FB] w-4 h-4" />
              Employee Attendance & Sales Incentives Directory
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">Configure cashier permissions, track active commission percentages, and log presence sheets</p>
          </div>
          {triggerImportExport && (
            <div className="flex gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => triggerImportExport("employees")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Import Employee Directory spreadsheet"
              >
                <Upload className="w-4 h-4 text-[#5C52FB]" />
                <span>Import Staff</span>
              </button>
              <button
                type="button"
                onClick={() => triggerImportExport("employees")}
                className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Export Employee Directory spreadsheet"
              >
                <Download className="w-4 h-4 text-[#5C52FB]" />
                <span>Export Staff</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeUsers.map((u) => (
            <div key={u.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden group hover:border-[#5C52FB]/30 transition-all shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-white text-slate-600 text-[8px] font-black uppercase rounded-full border border-[#E2E8F0]">
                    {u.role}
                  </span>
                  <span className="text-[10px] font-bold text-[#94A3B8]">ID: {u.id}</span>
                </div>
                <h4 className="font-extrabold text-[#0F172A] text-sm mt-3.5">{u.name}</h4>
                <p className="text-xs text-slate-500">@{u.username} · {u.phone}</p>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Salary: ₹{u.salary.toLocaleString('en-IN')}</span>
                  <span className="text-[#5C52FB]">Incentive: ₹{u.incentiveEarned}</span>
                </div>
                
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-[#94A3B8]">Attendance:</span>
                  <span className="text-[#0F172A]">{u.attendanceRate}% Rate</span>
                </div>
              </div>

              {/* Log simulated attendance */}
              <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    addNotification(`Attendance marked present for ${u.name} today.`, "success");
                  }}
                  className="text-[9px] bg-[#5C52FB]/10 text-[#5C52FB] hover:bg-[#5C52FB] hover:text-white font-extrabold px-2 py-1 rounded border border-[#5C52FB]/20 transition-all cursor-pointer"
                >
                  ✓ Mark Present
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
