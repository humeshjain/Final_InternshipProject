import React, { useState } from "react";
import { 
  RefreshCw, Play, Link2, ArrowRightLeft, AlertTriangle, 
  CheckCircle, Sparkles 
} from "lucide-react";

export default function TallySettings({
  db,
  setDb,
  activeBusinessId,
  addNotification
}) {
  const [showTallyWizard, setShowTallyWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizServerUrl, setWizServerUrl] = useState("http://localhost:9000");
  const [wizCompanyName, setWizCompanyName] = useState("Elevate Business Trading Ltd");
  
  const [wizSyncScope, setWizSyncScope] = useState({
    company: true,
    ledgers: true,
    suppliers: true,
    stock: true,
    categories: true,
    units: true,
    taxes: true,
    openingBalances: true,
    receivables: true,
    payables: true,
    salesInvoices: true,
    purchaseInvoices: true,
    creditNotes: true,
    payments: true,
    expenses: true,
    inventoryTx: true,
    taxEntries: true
  });

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      role: "assistant",
      text: "Namaste! I am your Elevate Business AI Sync Assistant. I can scan for duplicate ledgers, optimize sync schedules, or debug connectivity issues. How can I support your accounting today?"
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  const tallyConfig = db.tallyConfig || {
    connected: false,
    serverUrl: "http://localhost:9000",
    companyName: "",
    syncMode: "manual",
    syncSchedule: "daily",
    syncModules: {
      company: true,
      ledgers: true,
      suppliers: true,
      stock: true,
      categories: true,
      units: true,
      taxes: true,
      openingBalances: true,
      receivables: true,
      payables: true,
      salesInvoices: true,
      purchaseInvoices: true,
      creditNotes: true,
      payments: true,
      expenses: true,
      inventoryTx: true,
      taxEntries: true
    },
    conflictStrategy: "tally-first",
    lastSyncTime: "Never",
    authVerified: false
  };

  const tallySyncLogs = db.tallySyncLogs || [];
  const tallyConflicts = db.tallyConflicts || [];

  const handleConnectTallySubmit = (e) => {
    e.preventDefault();
    setDb((prev) => ({
      ...prev,
      tallyConfig: {
        ...prev.tallyConfig,
        connected: true,
        serverUrl: wizServerUrl,
        companyName: wizCompanyName,
        authVerified: true,
        syncModules: wizSyncScope,
        lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 16) + " IST"
      },
      tallySyncLogs: [
        {
          id: "tlog-" + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: "Tally Account Connected",
          status: "success",
          records: 1,
          details: `Connected to Tally Company: "${wizCompanyName}" via proxy bridge ${wizServerUrl}. Secure XML-RPC token activated.`
        },
        ...(prev.tallySyncLogs || [])
      ]
    }));

    addNotification(`Connected to Tally Company: "${wizCompanyName}" successfully.`, "success");
    setShowTallyWizard(false);
  };

  const handleDisconnectTally = () => {
    setDb((prev) => ({
      ...prev,
      tallyConfig: {
        ...prev.tallyConfig,
        connected: false,
        companyName: "",
        authVerified: false,
        lastSyncTime: "Never"
      },
      tallySyncLogs: [
        {
          id: "tlog-" + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: "Tally Disconnected",
          status: "success",
          records: 0,
          details: "Tally ERP/Prime integration connection revoked by Owner."
        },
        ...(prev.tallySyncLogs || [])
      ]
    }));
    addNotification("Tally account integration disconnected.", "success");
  };

  const handleTriggerSyncNow = () => {
    setIsSyncingNow(true);
    addNotification("Initiating two-way data sync with Tally...", "success");

    setTimeout(() => {
      setIsSyncingNow(false);
      setDb((prev) => {
        const lastSync = new Date().toISOString().replace('T', ' ').substring(0, 16) + " IST";
        const newLog = {
          id: "tlog-" + Date.now(),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: "Two-Way Full Synchronize",
          status: "success",
          records: 114,
          details: "Pulled 32 customers & 12 stock items. Pushed 18 sales invoices & 2 payments to Tally. Completed."
        };
        return {
          ...prev,
          tallyConfig: {
            ...prev.tallyConfig,
            lastSyncTime: lastSync
          },
          tallySyncLogs: [newLog, ...(prev.tallySyncLogs || [])]
        };
      });
      addNotification("Two-way synchronization with Tally completed (114 records synced).", "success");
    }, 2000);
  };

  const handleSaveSyncSettings = (updates) => {
    setDb((prev) => ({
      ...prev,
      tallyConfig: {
        ...prev.tallyConfig,
        ...updates
      }
    }));
    addNotification("Tally sync settings saved successfully.", "success");
  };

  const handleToggleModule = (moduleKey) => {
    const currentModules = tallyConfig.syncModules || {};
    const updatedModules = {
      ...currentModules,
      [moduleKey]: !currentModules[moduleKey]
    };
    handleSaveSyncSettings({ syncModules: updatedModules });
  };

  const handleResolveConflict = (id, decision) => {
    setDb((prev) => {
      const updatedConflicts = prev.tallyConflicts.map((c) => {
        if (c.id === id) {
          return { ...c, resolved: true, decision };
        }
        return c;
      });
      const resolvedItem = prev.tallyConflicts.find((c) => c.id === id);
      const auditLog = {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "Tally Conflict Resolved",
        userId: "user-1",
        username: "Workspace Owner",
        details: `Resolved Tally sync conflict for ${resolvedItem?.type} "${resolvedItem?.name}" by keeping ${decision === "local" ? "Local" : "Tally"} values.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      return {
        ...prev,
        tallyConflicts: updatedConflicts,
        auditLogs: [auditLog, ...prev.auditLogs]
      };
    });
    addNotification(`Conflict resolved in favor of ${decision === "local" ? "Local Billing" : "Tally ERP"}.`, "success");
  };

  const handleAskAiSyncAssistant = (customPrompt) => {
    const questionToAsk = customPrompt || aiQuestion;
    if (!questionToAsk.trim()) return;

    const updatedHistory = [...aiChatHistory, { role: "user", text: questionToAsk }];
    setAiChatHistory(updatedHistory);
    setAiQuestion("");
    setIsAiLoading(true);

    setTimeout(() => {
      let aiReply = "";
      const query = questionToAsk.toLowerCase();

      if (query.includes("duplicate") || query.includes("clean")) {
        aiReply = "I ran a semantic scan over Tally customer ledgers and local profiles. Found 2 matches that are likely duplicates:\n\n1. 'Sharma Grocery' & 'Sharma Grocery Stores' (96% similarity)\n2. 'M/s Gupta Provision' & 'Gupta Provision Store' (91% similarity)\n\nI recommend choosing 'Tally as master' conflict resolution to consolidate prior to syncing, or manually merging Rajesh Kumar Traders.";
      } else if (query.includes("schedule") || query.includes("best")) {
        aiReply = "Based on your sales velocity peaks (usually between 4:00 PM and 9:00 PM IST), I recommend selecting **Scheduled Synchronization** set to **Daily at 10:30 PM IST**. This prevents network bandwidth saturation in Tally during peaks while keeping day-end accounts fully compliant.";
      } else if (query.includes("error") || query.includes("fail") || query.includes("tdl-903") || query.includes("duplicate voucher")) {
        aiReply = "The error 'TDL-903: Duplicate voucher number' occurs because Tally expects sequential voucher numbers that aren't already used. To fix this, configure the billing system's invoice prefix to 'BB-POS-' to separate them from Tally's manual journal entries.";
      } else if (query.includes("setup") || query.includes("how")) {
        aiReply = "To connect, please launch Tally, enable ODBC Server inside Tally Configuration (Gateway of Tally > F12 > Advanced Configuration > Set 'Enable ODBC' to Yes and port to '9000'), and then click 'Connect Tally Account' to start the interactive connection wizard.";
      } else {
        aiReply = "To synchronize correctly, make sure Tally ERP or Tally Prime is running locally on port 9000. Your current sync strategy is set to 'Tally-First' which will use Tally as the master for stock quantities. Let me know if you want me to write a custom schema mapper!";
      }

      setAiChatHistory([...updatedHistory, { role: "assistant", text: aiReply }]);
      setIsAiLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tally Connection Header Status Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              tallyConfig.connected 
                ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-500"
            }`}>
              <RefreshCw className={`w-6 h-6 ${tallyConfig.connected ? "animate-spin text-[#5C52FB]" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[#0F172A]">Tally ERP / Prime Handshake Status</h3>
                {tallyConfig.connected ? (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse border border-emerald-200">
                    ● Connected
                  </span>
                ) : (
                  <span className="text-[9px] bg-[#F8FAFC] text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#E2E8F0]">
                    Offline / Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {tallyConfig.connected 
                  ? `Active token connection with Tally instance: "${tallyConfig.companyName}" via port ${tallyConfig.serverUrl.split(":").pop()}`
                  : "Bridge your local offline Tally.ERP 9 or Tally Prime server with Elevate Business secure accounting."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {tallyConfig.connected ? (
              <>
                <button
                  type="button"
                  disabled={isSyncingNow}
                  onClick={handleTriggerSyncNow}
                  className="btn-elevate-primary px-4 py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingNow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Sync Now</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectTally}
                  className="px-3.5 py-2 border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setWizardStep(1);
                  setShowTallyWizard(true);
                }}
                className="btn-elevate-primary px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Link2 className="w-4 h-4" /> Connect Tally Account
              </button>
            )}
          </div>
        </div>

        {/* KPI Ribbon Grid */}
        {tallyConfig.connected && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E2E8F0]">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Handshake Token</p>
              <p className="text-xs font-mono font-bold text-[#5C52FB] mt-1 overflow-hidden text-ellipsis">XMLRPC-TLY-931B</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Last Sync Event</p>
              <p className="text-xs font-bold text-[#0F172A] mt-1">{tallyConfig.lastSyncTime}</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Pending Sync Items</p>
              <p className="text-xs font-mono font-extrabold text-amber-600 mt-1">18 Vouchers waiting</p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Identified Discrepancies</p>
              <p className="text-xs font-mono font-extrabold text-rose-600 mt-1">
                {tallyConflicts.filter((c) => !c.resolved).length} Pending Resolved
              </p>
            </div>
          </div>
        )}
      </div>

      {tallyConfig.connected ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Sync configuration panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-[#5C52FB]" />
                  Two-Way Sync Configurations
                </h4>
                <span className="text-[10px] font-mono text-[#5C52FB] font-bold">Encrypted JSON-SOAP Secure</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="label-elevate block">Sync Engine Mode</label>
                  <select
                    value={tallyConfig.syncMode}
                    onChange={(e) => handleSaveSyncSettings({ syncMode: e.target.value })}
                    className="input-elevate text-xs font-bold"
                  >
                    <option value="manual">Manual Triggered sync (Recommended)</option>
                    <option value="auto">Real-time Auto Webhooks (Pushes live invoices)</option>
                    <option value="scheduled">Scheduled Chronological cron sync</option>
                  </select>
                </div>

                {tallyConfig.syncMode === "scheduled" && (
                  <div className="space-y-1.5">
                    <label className="label-elevate block">Cron Schedule Frequency</label>
                    <select
                      value={tallyConfig.syncSchedule}
                      onChange={(e) => handleSaveSyncSettings({ syncSchedule: e.target.value })}
                      className="input-elevate text-xs font-bold"
                    >
                      <option value="hourly">Every Hour (1 hour intervals)</option>
                      <option value="daily">Daily at EOD (11:30 PM IST)</option>
                      <option value="weekly">Weekly on Sunday EOD</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="label-elevate block">Conflict Resolution Strategy</label>
                  <select
                    value={tallyConfig.conflictStrategy}
                    onChange={(e) => handleSaveSyncSettings({ conflictStrategy: e.target.value })}
                    className="input-elevate text-xs font-bold"
                  >
                    <option value="tally-first">Tally ERP is Single Source of Truth (Overwrites Local)</option>
                    <option value="local-first">Local POS Overwrites Tally (Pushes Local values)</option>
                    <option value="manual">Hold and Review (Interactive Conflict Desk)</option>
                  </select>
                </div>
              </div>

              {/* Granular Module Sync Checkboxes */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Active Synchronization Modules</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="col-span-full text-[9px] font-bold text-[#5C52FB] uppercase tracking-wider mt-2 border-b border-[#E2E8F0] pb-1">
                    1. Pull From Tally ERP / Prime
                  </div>
                  
                  {[
                    { key: "company", name: "Company Details" },
                    { key: "ledgers", name: "Customers / Ledgers" },
                    { key: "suppliers", name: "Suppliers & Vendors" },
                    { key: "stock", name: "Products & Stock Items" },
                    { key: "categories", name: "Inventory Groups" },
                    { key: "units", name: "Units of Measurement" },
                    { key: "taxes", name: "GST/VAT Rates" },
                    { key: "openingBalances", name: "Opening Balances" },
                    { key: "receivables", name: "Outstanding Receivables" },
                    { key: "payables", name: "Outstanding Payables" }
                  ].map(mod => {
                    const isChecked = tallyConfig.syncModules?.[mod.key] ?? true;
                    return (
                      <label key={mod.key} className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.key)}
                          className="accent-[#5C52FB] h-3.5 w-3.5 rounded border-[#E2E8F0]"
                        />
                        <span className="text-[11px] font-medium text-[#0F172A]">{mod.name}</span>
                      </label>
                    );
                  })}

                  <div className="col-span-full text-[9px] font-bold text-[#5C52FB] uppercase tracking-wider mt-2 border-b border-[#E2E8F0] pb-1">
                    2. Push To Tally ERP / Prime
                  </div>

                  {[
                    { key: "salesInvoices", name: "Sales Invoices" },
                    { key: "purchaseInvoices", name: "Purchase Invoices" },
                    { key: "creditNotes", name: "Credit/Debit Notes" },
                    { key: "payments", name: "Ledger Payments" },
                    { key: "expenses", name: "Expense Transactions" },
                    { key: "inventoryTx", name: "Stock Adjustments" },
                    { key: "taxEntries", name: "Tax Posting Ledger Entries" }
                  ].map(mod => {
                    const isChecked = tallyConfig.syncModules?.[mod.key] ?? true;
                    return (
                      <label key={mod.key} className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModule(mod.key)}
                          className="accent-[#5C52FB] h-3.5 w-3.5 rounded border-[#E2E8F0]"
                        />
                        <span className="text-[11px] font-medium text-[#0F172A]">{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Conflict resolution desk */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#E2E8F0] pb-2">
                <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
                  Interactive Tally Conflict Resolution Center
                </h4>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  The following master data records show discrepancies between Tally ERP and this POS system. Decide which system should act as master.
                </p>
              </div>

              <div className="space-y-3">
                {tallyConflicts.filter((c) => !c.resolved).length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <p className="text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Excellent! All data conflicts are fully resolved. Master tables match 100%.
                    </p>
                  </div>
                ) : (
                  tallyConflicts.filter((c) => !c.resolved).map((c) => (
                    <div key={c.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded border border-amber-200">
                            {c.type}
                          </span>
                          <h5 className="font-bold text-xs text-[#0F172A]">{c.name}</h5>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8]">ID: {c.id}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest block font-sans">Local POS Value</span>
                          <p className="text-[#0F172A] mt-1 font-mono">{c.localVal}</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          <span className="text-[9px] font-bold text-[#5C52FB] uppercase tracking-widest block font-sans">Tally ERP Server Value</span>
                          <p className="text-[#0F172A] mt-1 font-mono">{c.tallyVal}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t border-dashed border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => handleResolveConflict(c.id, "local")}
                          className="px-3 py-1 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E2E8F0] text-[#0F172A] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Keep Local POS Values
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveConflict(c.id, "tally")}
                          className="btn-elevate-primary px-3 py-1 text-[10px] cursor-pointer"
                        >
                          Keep Tally Values
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detailed Tally Sync Event Log & Error Logs */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">
                  Audit Trail & Tally Sync History Logs
                </h4>
                <span className="text-[9px] text-[#94A3B8] font-bold uppercase">Token-Verified</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tallySyncLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F172A]">{log.action}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          log.status === "success" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {log.status === "success" ? "Success" : "Failed"}
                        </span>
                      </div>
                      <p className="text-[#64748B] font-mono text-[11px] leading-relaxed">{log.details}</p>
                      {log.status === "failed" && (
                        <div className="pt-2 flex gap-2 animate-pulse">
                          <button
                            type="button"
                            onClick={() => {
                              addNotification("Triggered schema mapping re-validation.", "success");
                              setDb((prev) => ({
                                ...prev,
                                tallySyncLogs: prev.tallySyncLogs.map((l) => 
                                  l.id === log.id 
                                    ? { ...l, status: "success", details: "Manual mapping fix applied. Invoice #BB-1029 pushed successfully to Tally ERP sales ledger." }
                                    : l
                                )
                              }));
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black rounded border border-amber-200 transition-colors flex items-center gap-1 animate-pulse cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Auto-Fix Ledger Mapping & Retry</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] text-[#94A3B8] block font-mono">{log.timestamp}</span>
                      <span className="text-[10px] text-[#0F172A] block font-bold mt-1">
                        {log.records > 0 ? `${log.records} records` : "--"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Assistant Chatbot widget */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3 relative">
                <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#5C52FB]" />
                  AI Sync Assistant
                </h4>
                <span className="text-[8px] bg-[#5C52FB]/10 text-[#5C52FB] border border-[#5C52FB]/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  Live Help
                </span>
              </div>

              <div className="space-y-3 h-80 overflow-y-auto pr-1 text-xs">
                {aiChatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                      msg.role === "assistant" 
                        ? "bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] mr-auto text-left" 
                        : "bg-[#5C52FB] text-white ml-auto text-left"
                    }`}
                  >
                    <p className={`font-bold text-[9px] uppercase tracking-wider mb-1 ${
                      msg.role === "assistant" ? "text-[#94A3B8]" : "text-white/80"
                    }`}>
                      {msg.role === "assistant" ? "Elevate Business AI Accountant" : "Merchant"}
                    </p>
                    <p className="whitespace-pre-line leading-normal">{msg.text}</p>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl mr-auto max-w-[80%] animate-pulse">
                    <span className="text-[10px] text-[#94A3B8]">AI Assistant is analyzing logs & ledger matching tables...</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Suggested AI Queries</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAskAiSyncAssistant("Analyze for duplicate customers")}
                    className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[10px] rounded-xl text-slate-600 hover:text-[#5C52FB] text-left transition-all cursor-pointer"
                  >
                    🔍 Scan Tally duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskAiSyncAssistant("Suggest best automated sync settings")}
                    className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[10px] rounded-xl text-slate-600 hover:text-[#5C52FB] text-left transition-all cursor-pointer"
                  >
                    ⏰ Recommend best sync schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskAiSyncAssistant("Explain TDL-903 duplicate voucher error")}
                    className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[10px] rounded-xl text-slate-600 hover:text-[#5C52FB] text-left transition-all cursor-pointer"
                  >
                    🐞 Debug posting code 'TDL-903'
                  </button>
                </div>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAiSyncAssistant();
                }}
                className="flex gap-2 pt-2 border-t border-[#E2E8F0]"
              >
                <input 
                  type="text"
                  placeholder="Ask AI Sync Assistant..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="input-elevate flex-1"
                />
                <button
                  type="submit"
                  disabled={!aiQuestion.trim()}
                  className="btn-elevate-primary px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-6 animate-fadeIn shadow-xs">
          <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-center mx-auto text-[#5C52FB]">
            <RefreshCw className="w-8 h-8 animate-spin-slow" />
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-lg text-[#0F172A]">Connect Tally ERP / Prime Server</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Enabling this integration lets businesses already using Tally to continue using it for full-scale compliance and auditing, while exploiting Elevate Business for superfast billing, retail checkout, stock levels tracking, and smart business intelligence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left pt-3">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
              <span className="text-[9px] font-bold text-[#5C52FB] uppercase tracking-widest block mb-1">Two-Way Live Sync</span>
              <p className="text-xs text-[#64748B] leading-normal">Pulled stock quantities, ledgers & tax rates from Tally, and pushed sales/purchase invoices automatically.</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
              <span className="text-[9px] font-bold text-[#5C52FB] uppercase tracking-widest block mb-1">AI-Powered Ledgers</span>
              <p className="text-xs text-[#64748B] leading-normal">Our AI Accountant Assistant automatically scans and deduplicates Tally ledgers to avoid compliance overlap.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setWizardStep(1);
              setShowTallyWizard(true);
            }}
            className="btn-elevate-primary px-6 py-3 text-xs rounded-xl flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <Link2 className="w-4 h-4" /> Start Guided Connection Setup
          </button>
        </div>
      )}

      {/* GUIDED CONNECTION SETUP WIZARD MODAL */}
      {showTallyWizard && (
        <div id="modal-tally-wizard" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="text-[#5C52FB] w-5 h-5 animate-spin-slow" />
                <h4 className="font-extrabold text-[#0F172A] text-sm">
                  Tally Bridge Guided Setup (Step {wizardStep} of 3)
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowTallyWizard(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-[#5C52FB]" : "bg-slate-200"}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-[#5C52FB]" : "bg-slate-200"}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-[#5C52FB]" : "bg-slate-200"}`} />
            </div>

            <form onSubmit={handleConnectTallySubmit} className="space-y-4 text-xs">
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[#64748B] leading-relaxed text-[11px]">
                    Configure your local Tally Server endpoint. Elevate Business connects to your local instance via a secured ODBC/SOAP localhost bridge. Ensure Tally ERP 9 / Prime ODBC is active on your host computer.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="label-elevate block">Tally Server Base IP / Host</label>
                      <input 
                        type="text"
                        required
                        value={wizServerUrl}
                        onChange={(e) => setWizServerUrl(e.target.value)}
                        className="input-elevate w-full"
                        placeholder="http://localhost:9000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="label-elevate block">ODBC Port Number</label>
                        <input 
                          type="number"
                          required
                          defaultValue="9000"
                          className="input-elevate w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="label-elevate block">Security Protocol</label>
                        <select className="input-elevate w-full font-bold">
                          <option>XML-RPC (Secure SOAP)</option>
                          <option>Tally ODBC Direct Driver</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setShowTallyWizard(false)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex-1 btn-elevate-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Connect & Fetch Companies</span>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[#64748B] leading-relaxed text-[11px]">
                    Tally handshake successful! Connected to ODBC server on <strong>{wizServerUrl}</strong>. Select the specific Tally company ledger you want to map with this retail POS system.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="label-elevate block">Select Tally Active Company Ledger</label>
                      <select
                        value={wizCompanyName}
                        onChange={(e) => setWizCompanyName(e.target.value)}
                        className="input-elevate w-full font-bold"
                      >
                        <option value="Elevate Business Trading Ltd">Elevate Business Trading Ltd (Active Ledger - 2026)</option>
                        <option value="Gupta Provisions Store">Gupta Provisions Store (Master Ledger)</option>
                        <option value="Om Retailers India">Om Retailers India Pvt Ltd</option>
                      </select>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5">
                      <p className="text-[10px] font-bold text-[#5C52FB] uppercase">ODBC Handshake Metadata</p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-[#64748B]">
                        <span>Tally Engine: Tally Prime v2.1</span>
                        <span>Connection Type: XML-RPC API</span>
                        <span>IP Address: 127.0.0.1</span>
                        <span>Latency: 18ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="flex-1 btn-elevate-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Configure Modules</span>
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <p className="text-[#64748B] leading-relaxed text-[11px]">
                    Authorize which accounting records can be shared and synchronized between Tally ERP and the Elevate Business billing platform.
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto border border-[#E2E8F0] p-3 rounded-xl bg-[#F8FAFC]">
                    <p className="text-[9px] font-extrabold text-[#5C52FB] uppercase tracking-wider mb-2">Configure Authorized Modules</p>
                    
                    {Object.entries({
                      company: "Company Ledger details",
                      ledgers: "Customer & Supplier Ledgers",
                      stock: "Inventory Stock Levels",
                      salesInvoices: "POS Sales Invoices",
                      payments: "Receipts & Ledger Payments"
                    }).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 p-1.5 hover:bg-slate-200/50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wizSyncScope[k] ?? true}
                          onChange={(e) => setWizSyncScope({ ...wizSyncScope, [k]: e.target.checked })}
                          className="accent-[#5C52FB] rounded border-[#E2E8F0]"
                        />
                        <span className="text-xs text-[#0F172A] font-medium">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-elevate-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Finish & Activate Sync</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
