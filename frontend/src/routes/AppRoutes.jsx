import React from "react";
import AccessDeniedView from "../components/common/AccessDeniedView.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import BillingPage from "../pages/BillingPage.jsx";
import CatalogPage from "../pages/CatalogPage.jsx";
import InventoryPage from "../pages/InventoryPage.jsx";
import CRMPage from "../pages/CRMPage.jsx";
import CustomerOnboardingPage from "../pages/CustomerOnboardingPage.jsx";
import AccountingPage from "../pages/AccountingPage.jsx";
import HRPage from "../pages/HRPage.jsx";
import ImportExportPage from "../pages/ImportExportPage.jsx";
import TicketsPage from "../pages/TicketsPage.jsx";
import AIPage from "../pages/AIPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";

export const isTabAllowedForRole = (tab, role) => {
  if (!role) return false;
  const norm = role.toLowerCase();
  if (norm === "owner" || norm === "co_owner" || norm === "co-owner") return true;
  if (norm === "admin" || norm === "manager") {
    return ["dashboard", "settings", "import-export"].includes(tab);
  }
  if (norm === "staff" || norm === "cashier" || norm === "sales executive" || norm === "inventory manager") {
    return ["billing", "catalog", "crm", "onboard-customer", "tickets", "ai"].includes(tab);
  }
  if (norm === "accountant") {
    return ["dashboard", "accounting", "crm", "tickets", "ai", "import-export"].includes(tab);
  }
  return false;
};

export default function AppRoutes({
  refreshCatalogCategories,
  activeTab,
  currentUserRole,
  db,
  setDb,
  activeProducts,
  activeCustomers,
  activeSuppliers,
  activeBills,
  activeBusiness,
  activeBusinessId,
  addNotification,
  setActiveTab,
  isOffline,
  pendingCartProduct,
  clearPendingCartProduct,
  triggerImportExport,
  runAutoReorder,
  sendWhatsAppReminder,
  tallyLogs,
  isTallySyncing,
  runTallySync,
  importExportPreselect,
  clearPreselect,
  currentUser,
  chatMessages,
  handleSendMessage,
  clearChatHistory,
  aiIsTyping,
  voiceSpeechSupported,
  triggerVoiceCommand,
  voiceActive,
  setVoiceActive,
  handleResetData,
  sessionToken
}) {
  if (!isTabAllowedForRole(activeTab, currentUserRole)) {
    return <AccessDeniedView tab={activeTab} role={currentUserRole} />;
  }

  switch (activeTab) {
    case "dashboard":
      return (
        <DashboardPage
          db={db}
          activeProducts={activeProducts}
          activeCustomers={activeCustomers}
          activeBills={activeBills}
          addNotification={addNotification}
          setActiveTab={setActiveTab}
          activeBusiness={activeBusiness}
        />
      );
    case "billing":
      return (
        <BillingPage
          db={db}
          setDb={setDb}
          activeProducts={activeProducts}
          activeCustomers={activeCustomers}
          isOffline={isOffline}
          addNotification={addNotification}
          activeBusinessId={activeBusinessId}
          activeBusiness={activeBusiness}
          pendingCartProduct={pendingCartProduct}
          clearPendingCartProduct={clearPendingCartProduct}
          currentUserRole={currentUserRole}
          triggerImportExport={triggerImportExport}
        />
      );
    case "catalog":
      return (
        <CatalogPage
          db={db}
          setDb={setDb}
          refreshCatalogCategories={refreshCatalogCategories}
          activeBusinessId={activeBusinessId}
          addNotification={addNotification}
          activeProducts={activeProducts}
          setActiveTab={setActiveTab}
          addToCart={(product) => {
            clearPendingCartProduct(product);
            setActiveTab("billing");
          }}
        />
      );
    case "inventory":
      return (
        <InventoryPage
          db={db}
          setDb={setDb}
          refreshCatalogCategories={refreshCatalogCategories}
          activeProducts={activeProducts}
          isOffline={isOffline}
          addNotification={addNotification}
          activeBusinessId={activeBusinessId}
          runAutoReorder={runAutoReorder}
          triggerImportExport={triggerImportExport}
        />
      );
    case "crm":
      return (
        <CRMPage
          db={db}
          setDb={setDb}
          activeCustomers={activeCustomers}
          activeSuppliers={activeSuppliers}
          activeBusinessId={activeBusinessId}
          addNotification={addNotification}
          sendWhatsAppReminder={sendWhatsAppReminder}
          setActiveTab={setActiveTab}
          triggerImportExport={triggerImportExport}
        />
      );
    case "onboard-customer":
      return (
        <CustomerOnboardingPage
          db={db}
          setDb={setDb}
          addNotification={addNotification}
          activeBusinessId={activeBusinessId}
          setActiveTab={setActiveTab}
        />
      );
    case "accounting":
      return (
        <AccountingPage
          db={db}
          tallyLogs={tallyLogs}
          isTallySyncing={isTallySyncing}
          runTallySync={runTallySync}
          activeBusinessId={activeBusinessId}
          triggerImportExport={triggerImportExport}
        />
      );
    case "hr":
      return (
        <HRPage
          db={db}
          addNotification={addNotification}
          activeBusinessId={activeBusinessId}
          triggerImportExport={triggerImportExport}
        />
      );
    case "tickets":
      return (
        <TicketsPage
          db={db}
          setDb={setDb}
          addNotification={addNotification}
          activeBusinessId={activeBusinessId}
        />
      );
    case "ai":
      return (
        <AIPage
          chatMessages={chatMessages}
          handleSendMessage={handleSendMessage}
          clearChatHistory={clearChatHistory}
          aiIsTyping={aiIsTyping}
          voiceSpeechSupported={voiceSpeechSupported}
          triggerVoiceCommand={triggerVoiceCommand}
          voiceActive={voiceActive}
          setVoiceActive={setVoiceActive}
          addNotification={addNotification}
          db={db}
          setDb={setDb}
          activeProducts={activeProducts}
          activeCustomers={activeCustomers}
          activeBills={activeBills}
          activeBusinessId={activeBusinessId}
        />
      );
    case "import-export":
      return (
        <ImportExportPage
          db={db}
          setDb={setDb}
          activeBusinessId={activeBusinessId}
          activeBusiness={activeBusiness}
          preselectedEntity={importExportPreselect}
          clearPreselect={clearPreselect}
          addNotification={addNotification}
          currentUserRole={currentUserRole}
          currentUser={currentUser}
        />
      );
    case "settings":
      return (
        <SettingsPage
          db={db}
          setDb={setDb}
          handleResetData={handleResetData}
          activeBusinessId={activeBusinessId}
          addNotification={addNotification}
          currentUserRole={currentUserRole}
          sessionToken={sessionToken}
        />
      );
    default:
      return null;
  }
}
