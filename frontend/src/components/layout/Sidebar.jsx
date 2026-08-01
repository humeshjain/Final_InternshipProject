import React from "react";
import { Wifi, WifiOff, Database, RefreshCw, LogOut } from "lucide-react";
import { NAVIGATION_TABS } from "../../constants/navigation.js";
import { isSupabaseConfigured } from "../../lib/supabaseClient.js";

export default function Sidebar({
  currentUser,
  currentUserRole,
  activeTab,
  setActiveTab,
  isOffline,
  toggleOffline,
  isSupabaseLoading,
  activeBusinessId,
  handleLogout
}) {
  return (
    <aside className="w-full md:w-64 bg-[#FFFFFF] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E2E8F0] p-5 flex-shrink-0">
      <div className="space-y-6">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-5">
          <div className="w-9 h-9 bg-gradient-to-tr from-[#3B38FA] to-[#5C52FB] rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-[#5C52FB]/20">
            E
          </div>
          <div>
            <span className="text-xs font-bold tracking-tight text-[#0F172A] block font-sans">ELEVATE BUSINESS</span>
            <span className="text-[9px] uppercase tracking-wider text-[#5C52FB] font-bold">SME Gateway</span>
          </div>
        </div>

        {/* User profile capsule */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#5C52FB]/10 text-[#5C52FB] flex items-center justify-center font-bold text-xs uppercase border border-[#5C52FB]/20">
            {currentUserRole?.slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <span className="text-xs font-bold text-[#0F172A] block truncate">{currentUser?.name || "Employee"}</span>
            <span className="text-[9px] text-[#5C52FB] uppercase tracking-wider font-bold block">{currentUserRole}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block px-2">Dashboards</span>
          
          <nav className="space-y-1">
            {NAVIGATION_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  id={`nav-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold cursor-pointer ${
                    active 
                      ? "bg-[#5C52FB]/10 text-[#5C52FB] border border-[#5C52FB]/25 font-bold shadow-xs" 
                      : "text-[#0F172A]/70 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#5C52FB]" : "text-[#94A3B8]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom utility controls */}
      <div className="space-y-4 pt-5 border-t border-[#E2E8F0]">
        <button 
          id="btn-toggle-offline"
          onClick={toggleOffline}
          className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between text-[11px] font-bold transition-all cursor-pointer ${
            isOffline 
              ? "bg-rose-50 text-rose-600 border-rose-200" 
              : "bg-[#F8FAFC] text-emerald-600 border-[#E2E8F0]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOffline ? "Offline Mode" : "Cloud Connected"}
          </span>
          <div className={`w-2 h-2 rounded-full ${isOffline ? "bg-rose-500" : "bg-emerald-500"}`}></div>
        </button>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 flex items-center justify-between text-[10px] font-medium text-[#0F172A]">
          <div className="flex items-center gap-1.5 font-bold">
            <Database className="w-3.5 h-3.5 text-[#5C52FB]" />
            <span>Supabase DB</span>
          </div>
          {isSupabaseLoading ? (
            <span className="flex items-center gap-1 text-[#5C52FB] font-bold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing
            </span>
          ) : (
            <span className="text-[#5C52FB] font-extrabold bg-[#5C52FB]/10 px-1.5 py-0.5 rounded text-[9px] border border-[#5C52FB]/20">
              {isSupabaseConfigured ? "PostgreSQL" : "Mock Adapter"}
            </span>
          )}
        </div>

        <div className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider text-center flex flex-col gap-2">
          <span>Tenant ID: {activeBusinessId}</span>
          <button
            id="btn-signout"
            onClick={() => handleLogout(false)}
            className="mt-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
