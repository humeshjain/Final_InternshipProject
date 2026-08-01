import React, { useState, useEffect } from "react";
import LoginPortal from "./components/LoginPortal.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

// Hooks
import { useNotifications } from "./hooks/useNotifications.js";
import { useAuth } from "./hooks/useAuth.js";
import { useDatabase } from "./hooks/useDatabase.js";
import { useInactivityTimer } from "./hooks/useInactivityTimer.js";
import { useVoiceCommand } from "./hooks/useVoiceCommand.js";

// Services
import { aiService } from "./services/aiService.js";
import { speakText } from "./utils/speech.js";
import { initialMockDatabase } from "./mockDb.js";

export default function App() {
  const { notifications, setNotifications, dismissingId, addNotification, handleDismissNotification } = useNotifications();

  const {
    sessionToken,
    currentUser,
    activeBusinessId,
    setActiveBusinessId,
    currentUserRole,
    handleRegisterSuccess: rawRegisterSuccess,
    handleLoginSuccess: rawLoginSuccess,
    handleLogout
  } = useAuth(addNotification);

  const { db, setDb, isSupabaseLoading, refreshCatalogCategories } = useDatabase(activeBusinessId);

  useInactivityTimer(sessionToken, handleLogout);

  const handleRegisterSuccess = (token, user, businessName) => {
    rawRegisterSuccess(token, user, businessName, setDb);
  };

  const handleLoginSuccess = (token, user) => {
    rawLoginSuccess(token, user, setDb);
  };

  // Active business details
  const activeBusiness = db.businesses.find(b => b.id === activeBusinessId) || db.businesses[0];

  // Hoisted bridge for Catalog to POS addition
  const [pendingCartProduct, setPendingCartProduct] = useState(null);

  // Offline / Online Mode States
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [importExportPreselect, setImportExportPreselect] = useState(null);

  const triggerImportExport = (entity) => {
    setImportExportPreselect(entity);
    setActiveTab("import-export");
  };

  // Quick helper lists filtered by tenant boundary
  const activeProducts = db.products.filter(p => p.business_id === activeBusinessId);
  const activeCustomers = db.customers.filter(c => c.business_id === activeBusinessId);
  const activeSuppliers = db.suppliers.filter(s => s.business_id === activeBusinessId);
  const activeBills = db.bills.filter(b => b.business_id === activeBusinessId);

  // Tally Sync simulation
  const [tallyLogs, setTallyLogs] = useState(db.tallyState.logs);
  const [isTallySyncing, setIsTallySyncing] = useState(false);

  // AI Chat states
  const initialWelcome = [
    { role: "assistant", content: "Welcome! I am your AI Business Assistant built into the billing software. I can help you manage invoices, stock levels, GST, customer balances, purchases, reports, or guide you step-by-step through any feature. How can I assist your business today?" }
  ];

  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("vyapaar_ai_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error("Error reading chat history from localStorage:", err);
    }
    return initialWelcome;
  });

  const [aiIsTyping, setAiIsTyping] = useState(false);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vyapaar_ai_chat_history", JSON.stringify(chatMessages));
    } catch (err) {
      console.error("Error saving chat history to localStorage:", err);
    }
  }, [chatMessages]);

  const clearChatHistory = () => {
    setChatMessages(initialWelcome);
    try {
      localStorage.setItem("vyapaar_ai_chat_history", JSON.stringify(initialWelcome));
    } catch (err) {}
    addNotification("Chat history cleared.", "success");
  };

  // Speech & Chat handler
  const handleSendMessage = async (userMsg) => {
    const trimmedMsg = typeof userMsg === 'string' ? userMsg.trim() : "";
    if (!trimmedMsg || aiIsTyping) return;

    const updatedConversation = [...chatMessages, { role: "user", content: trimmedMsg }];
    setChatMessages(updatedConversation);
    setAiIsTyping(true);

    try {
      const companyCtx = {
        business: activeBusiness,
        products: activeProducts,
        customers: activeCustomers,
        suppliers: activeSuppliers,
        bills: activeBills,
        khata: (db.khata || []).filter(k => k.business_id === activeBusinessId)
      };

      console.log("[App] Sending Chat Request:", { trimmedMsg, count: updatedConversation.length });
      const data = await aiService.sendChat(updatedConversation, companyCtx);
      console.log("[App] Received Chat Response:", data);

      const replyText = data?.content || "⚠️ **AI Error**: Received empty content from AI service.";
      setChatMessages(prev => [...prev, { role: "assistant", content: replyText }]);

      if (voiceActive) {
        speakText(replyText.replace(/[*#_`]/g, ''));
      }
    } catch (e) {
      console.error("AI Service Error:", e);
      const errMsg = `⚠️ **Connection Error**: ${e?.message || "Failed to connect to AI server. Please check your network or backend connection."}`;
      setChatMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
      if (voiceActive) speakText("Sorry, an error occurred while connecting to the AI service.");
    } finally {
      setAiIsTyping(false);
    }
  };

  const { voiceActive, setVoiceActive, voiceSpeechSupported, triggerVoiceCommand } = useVoiceCommand(
    handleSendMessage,
    addNotification
  );

  // Synchronize low stock & overdue notifications dynamically
  useEffect(() => {
    const newNotifications = [];
    activeProducts.filter(p => p.stock <= p.minStockLevel).forEach(p => {
      newNotifications.push({
        id: `low-stock-${p.id}`,
        text: `Low stock alert: "${p.name}" has only ${p.stock} units remaining.`,
        type: "low_stock",
        time: "Active alert"
      });
    });

    activeCustomers.filter(c => c.outstandingBalance > 0).forEach(c => {
      newNotifications.push({
        id: `due-${c.id}`,
        text: `Overdue balance warning: ${c.name} has a pending Khata balance of ₹${c.outstandingBalance.toLocaleString('en-IN')}.`,
        type: "due",
        time: "Active alert"
      });
    });

    setNotifications(newNotifications);
  }, [db, activeBusinessId]);

  // Keyboard shortcut Ctrl + B to open New Billing
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setActiveTab("new-billing");
        addNotification("Terminal focus activated: Opened New Billing screen.", "success");
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Toggle offline/online and process sync queues
  const toggleOffline = () => {
    if (isOffline) {
      setIsOffline(false);
      addNotification("Internet connection re-established. Synchronizing cloud backup...", "success");
      
      setTimeout(() => {
        setDb(prev => {
          let updatedProducts = [...prev.products];
          let updatedBills = [...prev.bills];
          let updatedCustomers = [...prev.customers];
          let updatedAudit = [...prev.auditLogs];

          offlineSyncQueue.forEach(item => {
            if (item.type === "product") {
              const idx = updatedProducts.findIndex(p => p.id === item.data.id);
              if (idx > -1) {
                updatedProducts[idx] = item.data;
              } else {
                updatedProducts.push(item.data);
              }
            } else if (item.type === "bill") {
              updatedBills.push(item.data);
              updatedAudit.push({
                id: "log-" + Date.now(),
                tenant_id: item.data.tenant_id,
                business_id: item.data.business_id,
                action: "Offline Sync - Invoice",
                userId: "offline_cashier",
                username: "offline_agent",
                details: `Synced offline invoice ${item.data.invoiceNumber} (₹${item.data.totalAmount})`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
              });
            } else if (item.type === "customer") {
              updatedCustomers.push(item.data);
            }
          });

          return {
            ...prev,
            products: updatedProducts,
            bills: updatedBills,
            customers: updatedCustomers,
            auditLogs: updatedAudit
          };
        });

        setOfflineSyncQueue([]);
        addNotification("All offline operations successfully synchronized with cloud database.", "success");
      }, 1500);
    } else {
      setIsOffline(true);
      addNotification("Offline billing mode activated. App will store database locally until online.", "error");
    }
  };

  // Auto Reorder stock suggestion trigger
  const runAutoReorder = () => {
    const lowStockItems = activeProducts.filter(p => p.stock <= p.minStockLevel);
    if (lowStockItems.length === 0) {
      addNotification("No items are currently below the minimum stock level.", "success");
      return;
    }

    setDb(prev => {
      const updatedProducts = prev.products.map(p => {
        if (p.business_id === activeBusinessId && p.stock <= p.minStockLevel) {
          const reorderQty = p.minStockLevel * 3 + 20;
          return {
            ...p,
            stock: p.stock + reorderQty,
            updated_by: "ai_reorder_agent"
          };
        }
        return p;
      });

      const audit = {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "AI Inventory Optimization",
        userId: "ai_bot",
        username: "Vyapaar AI",
        details: `Auto-reordered inventory for ${lowStockItems.length} critical low-stock items.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      return {
        ...prev,
        products: updatedProducts,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });

    addNotification(`AI Agent processed auto-reorder for ${lowStockItems.length} low stock products. Stocks replenished.`, "success");
  };

  // WhatsApp reminder sender
  const sendWhatsAppReminder = (customerId, amount) => {
    const customer = activeCustomers.find(c => c.id === customerId);
    if (!customer) return;

    addNotification(`WhatsApp Reminder sent to ${customer.name} (${customer.phone}) for ₹${amount.toLocaleString('en-IN')}`, "success");
    
    setDb(prev => {
      const updatedAudit = [...prev.auditLogs, {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "WhatsApp Reminder Sent",
        userId: "user-2",
        username: "rahul_manager",
        details: `Dispatched payment link & invoice reminder to ${customer.name} via official WhatsApp gateway`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }];
      return {
        ...prev,
        auditLogs: updatedAudit
      };
    });
  };

  // Tally sync action simulator
  const runTallySync = () => {
    setIsTallySyncing(true);
    addNotification("Starting TallyPrime & ERP 9 complete two-way synchronization...", "success");
    
    setTimeout(() => {
      const logs = [
        `[${new Date().toLocaleTimeString()}] Connected to Tally ERP 9 SOAP port on local loopback.`,
        `[${new Date().toLocaleTimeString()}] Sent ${activeBills.length} sales invoice vouchers with active HSN/SAC GST codes.`,
        `[${new Date().toLocaleTimeString()}] Received updated ledger account balances from Tally Ledger Book.`,
        `[${new Date().toLocaleTimeString()}] Completed full synchronization successfully.`
      ];

      setTallyLogs(logs);
      setIsTallySyncing(false);
      addNotification("Tally synchronization completed. GSTR-1, ledger states up-to-date.", "success");
      
      setDb(prev => ({
        ...prev,
        tallyState: {
          lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: "Success",
          syncedRecords: prev.tallyState.syncedRecords + activeBills.length,
          logs: logs
        }
      }));
    }, 1500);
  };

  // Clear data reset helper
  const handleResetData = () => {
    if(window.confirm("Are you sure you want to restore Vyapaar AI to initial sample seed data?")) {
      localStorage.removeItem("vyapaar_db_v2_clean");
      setDb(initialMockDatabase);
      addNotification("Application database cleared successfully.", "success");
    }
  };

  // Mount LoginPortal if not logged in
  if (!sessionToken || !currentUser) {
    return (
      <LoginPortal 
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        addNotification={addNotification}
      />
    );
  }

  return (
    <MainLayout
      currentUser={currentUser}
      currentUserRole={currentUserRole}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isOffline={isOffline}
      toggleOffline={toggleOffline}
      isSupabaseLoading={isSupabaseLoading}
      activeBusiness={activeBusiness}
      activeBusinessId={activeBusinessId}
      setActiveBusinessId={setActiveBusinessId}
      db={db}
      isTallySyncing={isTallySyncing}
      runTallySync={runTallySync}
      handleLogout={handleLogout}
      offlineSyncQueue={offlineSyncQueue}
      notifications={notifications}
      dismissingId={dismissingId}
      handleDismissNotification={handleDismissNotification}
    >
      <AppRoutes
        refreshCatalogCategories={refreshCatalogCategories}
        activeTab={activeTab}
        currentUserRole={currentUserRole}
        db={db}
        setDb={setDb}
        activeProducts={activeProducts}
        activeCustomers={activeCustomers}
        activeSuppliers={activeSuppliers}
        activeBills={activeBills}
        activeBusiness={activeBusiness}
        activeBusinessId={activeBusinessId}
        addNotification={addNotification}
        setActiveTab={setActiveTab}
        isOffline={isOffline}
        pendingCartProduct={pendingCartProduct}
        clearPendingCartProduct={(p) => setPendingCartProduct(p)}
        triggerImportExport={triggerImportExport}
        runAutoReorder={runAutoReorder}
        sendWhatsAppReminder={sendWhatsAppReminder}
        tallyLogs={tallyLogs}
        isTallySyncing={isTallySyncing}
        runTallySync={runTallySync}
        importExportPreselect={importExportPreselect}
        clearPreselect={() => setImportExportPreselect(null)}
        currentUser={currentUser}
        chatMessages={chatMessages}
        handleSendMessage={handleSendMessage}
        clearChatHistory={clearChatHistory}
        aiIsTyping={aiIsTyping}
        voiceSpeechSupported={voiceSpeechSupported}
        triggerVoiceCommand={triggerVoiceCommand}
        voiceActive={voiceActive}
        setVoiceActive={setVoiceActive}
        handleResetData={handleResetData}
        sessionToken={sessionToken}
      />
    </MainLayout>
  );
}
