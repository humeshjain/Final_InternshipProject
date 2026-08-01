import React from "react";
import Sidebar from "../components/layout/Sidebar.jsx";
import Header from "../components/layout/Header.jsx";
import Footer from "../components/layout/Footer.jsx";
import NotificationBanner from "../components/common/NotificationBanner.jsx";
import { ShieldAlert } from "lucide-react";

export default function MainLayout({
  currentUser,
  currentUserRole,
  activeTab,
  setActiveTab,
  isOffline,
  toggleOffline,
  isSupabaseLoading,
  activeBusiness,
  activeBusinessId,
  setActiveBusinessId,
  db,
  isTallySyncing,
  runTallySync,
  handleLogout,
  offlineSyncQueue,
  notifications,
  dismissingId,
  handleDismissNotification,
  children
}) {
  const currentNotif = notifications.length > 0 ? notifications[0] : null;

  return (
    <div id="vyapaar-dashboard-app" className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased text-[#0F172A] font-sans">
      <Sidebar
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOffline={isOffline}
        toggleOffline={toggleOffline}
        isSupabaseLoading={isSupabaseLoading}
        activeBusinessId={activeBusinessId}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC] max-w-full">
        <Header
          activeBusiness={activeBusiness}
          activeBusinessId={activeBusinessId}
          setActiveBusinessId={setActiveBusinessId}
          currentUser={currentUser}
          currentUserRole={currentUserRole}
          db={db}
          isTallySyncing={isTallySyncing}
          runTallySync={runTallySync}
        />

        {offlineSyncQueue.length > 0 && (
          <div className="bg-amber-50 border-y border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800">
            <span className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 animate-bounce" />
              <strong>{offlineSyncQueue.length} Pending Offline Vouchers:</strong> Will auto-sync once Cloud sync is activated.
            </span>
            <button id="btn-sync-offline-now" onClick={toggleOffline} className="bg-[#5C52FB] text-white font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider">
              Synchronize Now
            </button>
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto max-w-full bg-[#F8FAFC]">
          <NotificationBanner
            currentNotif={currentNotif}
            dismissingId={dismissingId}
            handleDismissNotification={handleDismissNotification}
          />
          {children}
        </main>

        <Footer activeBusinessId={activeBusinessId} />
      </div>
    </div>
  );
}
