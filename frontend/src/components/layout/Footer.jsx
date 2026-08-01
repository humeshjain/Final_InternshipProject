import React from "react";

export default function Footer({ activeBusinessId }) {
  return (
    <footer className="h-12 border-t border-[#E2E8F0] px-6 flex items-center justify-between text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider flex-shrink-0 bg-white">
      <div className="flex gap-6 items-center">
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Cloud Core
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#5C52FB]"></div> Database Synchronized
        </span>
      </div>
      <div className="hidden sm:flex gap-4">
        <span>Elevate ERP v4.3</span>
        <span>Tenant: {activeBusinessId === "biz-1" ? "Vishwa" : "Bharat"} Workspace</span>
      </div>
    </footer>
  );
}
