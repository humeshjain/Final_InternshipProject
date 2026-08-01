import React from "react";
import { ShieldAlert } from "lucide-react";

export default function AccessDeniedView({ tab, role }) {
  return (
    <div id="access-denied-box" className="bg-white border border-rose-200 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 my-12 shadow-sm animate-fadeIn">
      <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
        <ShieldAlert className="w-8 h-8 animate-bounce" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tight">Access Restricted • अनुमति अस्वीकृत</h3>
        <p className="text-xs text-rose-700 font-medium">
          The requested module <span className="font-mono text-[#0F172A] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">"{tab}"</span> requires elevated privileges.
        </p>
      </div>
      <p className="text-xs text-[#64748B] leading-relaxed max-w-md mx-auto">
        Your active employee role is mapped as <strong className="text-[#5C52FB] uppercase tracking-wide">{role}</strong>. Under the SaaS Multi-Tenant RBAC Security policy, this role is restricted from viewing or altering this operational interface.
      </p>
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-3">
        <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Need Access?</span>
        <p className="text-[10px] text-[#64748B]">Please request the Owner (<span className="text-[#0F172A] font-semibold">Priya Agarwal</span>) or Administrator (<span className="text-[#0F172A] font-semibold">Vikram Sharma</span>) to upgrade your roster authorization.</p>
      </div>
    </div>
  );
}
