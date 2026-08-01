import React, { useState, useEffect } from "react";
import { 
  Users, BookOpen, Share2, Plus, UserPlus, Shield, 
  Trash2, ArrowRight, ArrowLeft, Check, RotateCcw, 
  MessageSquare, Mail, MessageCircle, FileText, Sparkles, Building, AlertCircle, Edit,
  Download, Upload
} from "lucide-react";
import jsPDF from "jspdf";
import { saveCustomer, deleteCustomer } from "../lib/supabaseService";

export default function CRMModule({
  db,
  setDb,
  activeCustomers,
  activeSuppliers,
  activeBusinessId,
  addNotification,
  sendWhatsAppReminder,
  setActiveTab,
  triggerImportExport
}) {
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    membershipTier: "Regular",
    contactPreference: "WhatsApp",
    creditLimit: 0
  });
  
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    creditLimit: 0,
    membershipTier: "Regular",
    contactPreference: "WhatsApp",
    enableWelcomeMessage: true,
    welcomeMessageTemplate: "Hello {name}, welcome to our store! Your account is active with a credit limit of ₹{creditLimit}. Thank you for choosing us."
  });

  // Dynamic preview generator
  const getSubstitutedMessage = () => {
    let msg = newCustomerForm.welcomeMessageTemplate;
    const namePlaceholder = newCustomerForm.name.trim() || "Vijay Kumar";
    const limitPlaceholder = newCustomerForm.creditLimit.toLocaleString("en-IN");
    return msg
      .replace(/{name}/g, namePlaceholder)
      .replace(/{creditLimit}/g, limitPlaceholder);
  };

  const handleResetForm = () => {
    setNewCustomerForm({
      name: "",
      phone: "",
      email: "",
      gstin: "",
      creditLimit: 0,
      membershipTier: "Regular",
      contactPreference: "WhatsApp",
      enableWelcomeMessage: true,
      welcomeMessageTemplate: "Hello {name}, welcome to our store! Your account is active with a credit limit of ₹{creditLimit}. Thank you for choosing us."
    });
    setWizardStep(1);
    addNotification("Onboarding form data has been cleared.", "success");
  };

  const handleOnboardCustomerSubmit = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      addNotification("Please enter both Name and Phone number to onboard a customer.", "error");
      setWizardStep(1);
      return;
    }

    const newCust = {
      id: "cust-" + Date.now(),
      tenant_id: activeBusinessId === "biz-1" ? "tenant-vishwa" : "tenant-bharat",
      business_id: activeBusinessId,
      created_by: "user-1",
      updated_by: "user-1",
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email || `${newCustomerForm.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      membershipTier: newCustomerForm.membershipTier,
      outstandingBalance: 0,
      creditLimit: Number(newCustomerForm.creditLimit),
      referralsCount: 0,
      gstin: newCustomerForm.gstin.trim() || undefined,
      contactPreference: newCustomerForm.contactPreference,
      welcomeMessageSent: newCustomerForm.enableWelcomeMessage
    };

    try {
      await saveCustomer(newCust);
    } catch (err) {
      console.warn("Supabase customer onboard notice:", err);
    }

    setDb((prev) => ({
      ...prev,
      customers: [newCust, ...prev.customers]
    }));

    if (newCustomerForm.enableWelcomeMessage) {
      const messageContent = getSubstitutedMessage();
      addNotification(`Onboarded & sent welcome broadcast to ${newCust.name} via ${newCustomerForm.contactPreference}!`, "success");
    } else {
      addNotification(`Onboarded customer "${newCust.name}" successfully!`, "success");
    }

    setIsAddingCustomer(false);
    // Reset wizard
    setNewCustomerForm({
      name: "",
      phone: "",
      email: "",
      gstin: "",
      creditLimit: 15000,
      membershipTier: "Regular",
      contactPreference: "WhatsApp",
      enableWelcomeMessage: true,
      welcomeMessageTemplate: "Hello {name}, welcome to our store! Your account is active with a credit limit of ₹{creditLimit}. Thank you for choosing us."
    });
    setWizardStep(1);
  };

  const handleStartEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      gstin: customer.gstin || "",
      membershipTier: customer.membershipTier || "Regular",
      contactPreference: customer.contactPreference || "WhatsApp",
      creditLimit: customer.creditLimit || 0
    });
  };

  const handleSaveCustomerEdit = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      addNotification("Customer Name and Phone Number are required.", "error");
      return;
    }

    const updatedCustomerObj = {
      ...editingCustomer,
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      gstin: editForm.gstin,
      membershipTier: editForm.membershipTier,
      contactPreference: editForm.contactPreference,
      creditLimit: editForm.creditLimit,
      updated_by: "user-3"
    };

    try {
      await saveCustomer(updatedCustomerObj);
    } catch (err) {
      console.warn("Supabase customer edit notice:", err);
    }

    setDb((prev) => {
      const updated = prev.customers.map((c) => {
        if (c.id === editingCustomer?.id) {
          return updatedCustomerObj;
        }
        return c;
      });
      return { ...prev, customers: updated };
    });

    if (selectedCustomerForLedger && selectedCustomerForLedger.id === editingCustomer?.id) {
      setSelectedCustomerForLedger((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          gstin: editForm.gstin,
          membershipTier: editForm.membershipTier,
          contactPreference: editForm.contactPreference,
          creditLimit: editForm.creditLimit
        };
      });
    }

    addNotification(`Customer "${editForm.name}" updated successfully.`, "success");
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to remove customer ${customerName}? This will clear their record.`)) {
      try {
        await deleteCustomer(customerId);
      } catch (err) {
        console.warn("Supabase customer delete notice:", err);
      }

      setDb((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== customerId)
      }));
      addNotification(`Removed customer "${customerName}" from your ledger.`, "success");
    }
  };

  const exportCustomersToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const activeBusiness = db.businesses?.find((b) => b.id === activeBusinessId) || {
        name: "Retail Business",
        gstin: "27AAAAA1111A1Z1"
      };

      // Header background block (Modern Swiss style)
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 42, "F");

      // Title & Branding
      doc.setTextColor(92, 82, 251); // #5C52FB
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(activeBusiness.name.toUpperCase(), 14, 15);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("CUSTOMER CREDIT BOOK & OUTSTANDING STATEMENT", 14, 23);
      doc.text(`GSTIN: ${activeBusiness.gstin || "N/A"}`, 14, 29);

      doc.setTextColor(100, 116, 139);
      doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 130, 29);

      // Accent border line
      doc.setDrawColor(92, 82, 251);
      doc.setLineWidth(0.6);
      doc.line(14, 36, 196, 36);

      // Financial Overview Block
      const totalOutstanding = activeCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0);
      const totalCreditLimit = activeCustomers.reduce((sum, c) => sum + c.creditLimit, 0);
      
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CREDIT REPORT SUMMARY", 14, 52);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Accounts Monitored: ${activeCustomers.length}`, 14, 60);
      doc.text(`Total Credit Extended: INR ${totalCreditLimit.toLocaleString('en-IN')}`, 14, 66);
      
      doc.setFillColor(242, 243, 245);
      doc.rect(125, 46, 71, 25, "F");
      doc.setDrawColor(210, 212, 215);
      doc.rect(125, 46, 71, 25, "S");
      
      doc.setTextColor(50, 50, 50);
      doc.text("TOTAL OUTSTANDING RECEIVABLES", 129, 53);
      doc.setTextColor(190, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`INR ${totalOutstanding.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 129, 63);

      // Table Header Row
      doc.setFillColor(28, 29, 32);
      doc.rect(14, 78, 182, 8, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Customer Account / Name", 16, 83);
      doc.text("Phone", 70, 83);
      doc.text("Membership Tier", 110, 83);
      doc.text("Credit Limit", 142, 83);
      doc.text("Outstanding Bal.", 170, 83);

      let y = 92;
      activeCustomers.forEach((c) => {
        if (y > 275) {
          doc.addPage();
          y = 25;
          // Subpage header
          doc.setFillColor(28, 29, 32);
          doc.rect(14, 15, 182, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("Customer Account / Name", 16, 20);
          doc.text("Phone", 70, 20);
          doc.text("Membership Tier", 110, 20);
          doc.text("Credit Limit", 142, 20);
          doc.text("Outstanding Bal.", 170, 20);
          y = 28;
        }

        // Alternating row background
        if (y % 2 === 0) {
          doc.setFillColor(248, 249, 251);
          doc.rect(14, y - 5, 182, 7, "F");
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(c.name, 16, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(c.phone, 70, y);
        doc.text(c.membershipTier, 110, y);
        doc.text(`INR ${c.creditLimit.toLocaleString('en-IN')}`, 142, y);

        if (c.outstandingBalance > 0) {
          doc.setTextColor(190, 30, 30);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(40, 140, 40);
        }
        doc.text(`INR ${c.outstandingBalance.toLocaleString('en-IN')}`, 170, y);

        y += 8;
      });

      doc.save(`customers_credit_report_${activeBusinessId}.pdf`);
      addNotification("Exported customer balance statement list PDF!", "success");
    } catch (err) {
      console.error(err);
      addNotification("Error compiling credit report PDF.", "error");
    }
  };

  const getCustomerTransactions = (customer) => {
    const customerBills = (db.bills || []).filter(
      (b) => b.customerId === customer.id && b.business_id === activeBusinessId
    );

    const customerKhata = (db.khata || []).filter(
      (k) => k.partyId === customer.id && k.business_id === activeBusinessId
    );

    const transactions = [];

    customerBills.forEach((b) => {
      transactions.push({
        id: b.id,
        date: b.date || b.createdAt || new Date().toISOString().split("T")[0],
        type: "invoice",
        title: `Invoice #${b.invoiceNumber || b.id.slice(-6).toUpperCase()}`,
        description: `${b.items?.length || 0} items purchased`,
        amount: b.totalAmount,
        change: b.totalAmount - b.paidAmount,
        paidAmount: b.paidAmount,
        status: b.paymentStatus,
        paymentMethod: b.paymentMethod
      });
    });

    customerKhata.forEach((k) => {
      transactions.push({
        id: k.id,
        date: k.date,
        type: k.type,
        title: k.type === "credit" ? "Credit Extended (Udhaar)" : "Credit Payment (Settlement)",
        description: k.description,
        amount: k.amount,
        change: k.type === "credit" ? k.amount : -k.amount,
        paidAmount: k.type === "payment" ? k.amount : 0,
        status: "Cleared",
        paymentMethod: "Direct Ledger Entry"
      });
    });

    // Sort chronologically ascending to compute correct running balance
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    const itemsWithBalance = transactions.map((t) => {
      balance += t.change;
      return { ...t, runningBalance: balance };
    });

    // Return newest first
    return itemsWithBalance.reverse();
  };

  const exportCustomerLedgerToPDF = (customer) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const activeBusiness = db.businesses?.find((b) => b.id === activeBusinessId) || {
        name: "Retail Business",
        gstin: "27AAAAA1111A1Z1"
      };

      // Header block
      doc.setFillColor(18, 19, 22);
      doc.rect(0, 0, 210, 44, "F");

      // Title
      doc.setTextColor(191, 241, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(activeBusiness.name.toUpperCase(), 14, 15);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(`STATEMENT OF LEDGER ACCOUNTS - ${customer.name.toUpperCase()}`, 14, 23);
      doc.text(`Customer Contact: ${customer.phone} | Membership: ${customer.membershipTier}`, 14, 29);
      doc.text(`GSTIN Registered: ${customer.gstin || "N/A"}`, 14, 35);

      doc.setTextColor(160, 160, 160);
      doc.setFontSize(9);
      doc.text(`Statement Date: ${new Date().toLocaleDateString('en-IN')}`, 135, 23);

      doc.setDrawColor(191, 241, 60);
      doc.setLineWidth(0.6);
      doc.line(14, 39, 196, 39);

      // Financial Stats Overview
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("ACCOUNT OVERVIEW", 14, 53);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Tier Type: ${customer.membershipTier} Member`, 14, 60);
      doc.text(`Credit Limit Granted: INR ${customer.creditLimit.toLocaleString('en-IN')}`, 14, 66);

      // Balance box on the right
      doc.setFillColor(242, 243, 245);
      doc.rect(125, 47, 71, 24, "F");
      doc.setDrawColor(210, 212, 215);
      doc.rect(125, 47, 71, 24, "S");

      doc.setTextColor(60, 60, 60);
      doc.text("CUMULATIVE OUTSTANDING DUE", 128, 54);
      doc.setTextColor(190, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`INR ${customer.outstandingBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 128, 64);

      // Transaction list table header
      doc.setFillColor(28, 29, 32);
      doc.rect(14, 78, 182, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Date", 16, 83);
      doc.text("Transaction / Details", 42, 83);
      doc.text("Action Type", 112, 83);
      doc.text("Amount", 142, 83);
      doc.text("Running Bal.", 170, 83);

      const txs = getCustomerTransactions(customer);
      let y = 92;

      txs.forEach((t) => {
        if (y > 275) {
          doc.addPage();
          y = 25;
          doc.setFillColor(28, 29, 32);
          doc.rect(14, 15, 182, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("Date", 16, 20);
          doc.text("Transaction / Details", 42, 20);
          doc.text("Action Type", 112, 20);
          doc.text("Amount", 142, 20);
          doc.text("Running Bal.", 170, 20);
          y = 28;
        }

        if (y % 2 === 0) {
          doc.setFillColor(248, 249, 251);
          doc.rect(14, y - 5, 182, 7, "F");
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        doc.text(new Date(t.date).toLocaleDateString('en-IN'), 16, y);
        
        doc.setFont("helvetica", "bold");
        doc.text(t.title, 42, y);

        const isPayment = t.type === "payment";
        doc.setFont("helvetica", "normal");
        if (isPayment) {
          doc.setTextColor(40, 140, 40);
        } else {
          doc.setTextColor(190, 30, 30);
        }
        doc.text(t.type.toUpperCase(), 112, y);

        doc.text(`INR ${t.amount.toLocaleString('en-IN')}`, 142, y);
        
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(`INR ${t.runningBalance.toLocaleString('en-IN')}`, 170, y);

        y += 8;
      });

      doc.save(`ledger_statement_${customer.name.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      addNotification(`Downloaded detailed account ledger for ${customer.name}`, "success");
    } catch (e) {
      console.error(e);
      addNotification("Error exporting customer detailed ledger PDF", "error");
    }
  };

  return (
    <div className="space-y-6 text-[#0F172A] animate-fadeIn">
      
      {/* Customer Tiers list and Onboarding Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Customer Khata Book (Debtors) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
                <Users className="w-4.5 h-4.5 text-[#5C52FB]" />
                {selectedCustomerForLedger ? `Ledger: ${selectedCustomerForLedger.name}` : "Customer Accounts & Credit Book"}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1">
                {selectedCustomerForLedger 
                  ? "Examine real-time transaction history, invoices, payments, and export individual PDF ledger statements"
                  : "Track outstanding balances, set credit limits, and dispatch automated payment reminders"}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              {!selectedCustomerForLedger ? (
                <>
                  {triggerImportExport && (
                    <>
                      <button
                        type="button"
                        onClick={() => triggerImportExport("customers")}
                        className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                        title="Import Customers via Excel/CSV spreadsheet"
                      >
                        <Upload className="w-4 h-4 text-[#5C52FB]" />
                        <span>Import Customers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerImportExport("customers")}
                        className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                        title="Export Customers to Excel/CSV spreadsheet"
                      >
                        <Download className="w-4 h-4 text-[#5C52FB]" />
                        <span>Export Customers</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={exportCustomersToPDF}
                    className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Export all customers & outstanding balances to PDF"
                  >
                    <FileText className="w-4 h-4 text-[#5C52FB]" />
                    <span>Export PDF</span>
                  </button>

                  {setActiveTab && (
                    <button
                      onClick={() => {
                        setActiveTab("onboard-customer");
                      }}
                      className="btn-elevate-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register Customer</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => exportCustomerLedgerToPDF(selectedCustomerForLedger)}
                    className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForLedger(null)}
                    className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 border border-[#E2E8F0] transition-all shadow-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to List</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedCustomerForLedger ? (
            /* DETAILED LEDGER VIEW */
            <div className="space-y-6">
              {/* Profile Card & Credit Meter */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#94A3B8] block">Customer Information</span>
                  <p className="text-sm font-black text-[#0F172A]">{selectedCustomerForLedger.name}</p>
                  <p className="text-xs text-slate-600">Phone: {selectedCustomerForLedger.phone}</p>
                  <p className="text-xs text-slate-600">Email: {selectedCustomerForLedger.email || "N/A"}</p>
                  {selectedCustomerForLedger.gstin && (
                    <p className="text-[10px] text-[#94A3B8] font-mono">GSTIN: {selectedCustomerForLedger.gstin}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleStartEditCustomer(selectedCustomerForLedger)}
                    className="mt-2 text-[10px] text-[#5C52FB] hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="space-y-2 col-span-2 flex flex-col justify-center">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Credit Extended Usage limit:</span>
                    {selectedCustomerForLedger.creditLimit > 0 ? (
                      <span className={selectedCustomerForLedger.outstandingBalance > selectedCustomerForLedger.creditLimit * 0.8 ? "text-rose-600" : "text-[#5C52FB]"}>
                        ₹{selectedCustomerForLedger.outstandingBalance.toLocaleString('en-IN')} / ₹{selectedCustomerForLedger.creditLimit.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-[#5C52FB]">
                        ₹{selectedCustomerForLedger.outstandingBalance.toLocaleString('en-IN')} / No Limit (Unlimited)
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        selectedCustomerForLedger.creditLimit > 0 && selectedCustomerForLedger.outstandingBalance > selectedCustomerForLedger.creditLimit * 0.8 
                          ? "bg-rose-500" 
                          : "bg-[#5C52FB]"
                      }`} 
                      style={{ 
                        width: `${selectedCustomerForLedger.creditLimit > 0 
                          ? Math.min(100, (selectedCustomerForLedger.outstandingBalance / selectedCustomerForLedger.creditLimit) * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
                    <span>
                      Available credit: {selectedCustomerForLedger.creditLimit > 0 
                        ? `₹${Math.max(0, selectedCustomerForLedger.creditLimit - selectedCustomerForLedger.outstandingBalance).toLocaleString('en-IN')}` 
                        : "Unlimited (No Limit)"}
                    </span>
                    <span>Tier: {selectedCustomerForLedger.membershipTier}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable account ledger stream */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider block">Unified Statement Ledger Stream</span>
                  <span className="text-[9px] text-[#5C52FB] bg-[#5C52FB]/10 border border-[#5C52FB]/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    Running Balance: ₹{selectedCustomerForLedger.outstandingBalance.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="max-h-[340px] overflow-y-auto pr-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl divide-y divide-slate-100">
                  {getCustomerTransactions(selectedCustomerForLedger).length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-[#94A3B8] mx-auto" />
                      <p className="text-slate-700 text-xs font-bold">No entries in account ledger</p>
                      <p className="text-[10px] text-[#94A3B8]">Invoices and direct settlements will register here automatically.</p>
                    </div>
                  ) : (
                    getCustomerTransactions(selectedCustomerForLedger).map((t, idx) => {
                      const isPayment = t.type === "payment";
                      return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-white transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-[#0F172A] text-xs">{t.title}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                                isPayment 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {isPayment ? "Payment Received" : "Udhaar Incurred"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal">{t.description}</p>
                            <p className="text-[9px] text-[#94A3B8] font-mono flex items-center gap-2">
                              <span>Date: {t.date}</span>
                              <span>·</span>
                              <span>Method: {t.paymentMethod}</span>
                              {t.status && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-600">{t.status}</span>
                                </>
                              )}
                            </p>
                          </div>

                          <div className="text-left sm:text-right flex flex-col gap-1 justify-center sm:items-end font-mono">
                            <span className={`text-xs font-black ${isPayment ? "text-emerald-700" : "text-rose-600"}`}>
                              {isPayment ? "-" : "+"} ₹{Number(t.amount).toFixed(2)}
                            </span>
                            <span className="text-[9px] text-[#94A3B8]">
                              Running Bal: ₹{Number(t.runningBalance).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Settlement Button inside ledger for speed */}
              {selectedCustomerForLedger.outstandingBalance > 0 && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs space-y-1 self-start sm:self-center">
                    <p className="font-extrabold text-[#0F172A]">Fast Settlement Desk</p>
                    <p className="text-[#94A3B8]">Settle outstanding due of ₹{selectedCustomerForLedger.outstandingBalance.toLocaleString('en-IN')} instantly using current drawer cash.</p>
                  </div>
                  <button
                    onClick={() => {
                      const tempCust = selectedCustomerForLedger;
                      setDb((prev) => {
                        const updated = prev.customers.map((cust) => {
                          if (cust.id === tempCust.id) return { ...cust, outstandingBalance: 0 };
                          return cust;
                        });
                        
                        const khataLog = {
                          id: "k-" + Date.now(),
                          tenant_id: "tenant-main",
                          business_id: activeBusinessId,
                          created_by: "user-3",
                          updated_by: "user-3",
                          partyType: "customer",
                          partyId: tempCust.id,
                          partyName: tempCust.name,
                          type: "payment",
                          amount: tempCust.outstandingBalance,
                          description: "Udhaar payment cleared via cashier direct settlement inside ledger view",
                          date: new Date().toISOString().split("T")[0]
                        };

                        return {
                          ...prev,
                          customers: updated,
                          khata: [...prev.khata, khataLog]
                        };
                      });
                      addNotification(`Udhaar settled for ${tempCust.name} successfully.`, "success");
                      setSelectedCustomerForLedger((prev) => prev ? { ...prev, outstandingBalance: 0 } : null);
                    }}
                    className="w-full sm:w-auto btn-elevate-primary font-extrabold text-xs px-5 py-2.5 cursor-pointer"
                  >
                    Direct Settle Cash
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ORIGINAL CUSTOMER LIST */
            <div className="divide-y divide-slate-100">
              {activeCustomers.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
                  <p className="text-slate-700 text-xs font-bold">No onboarded customers yet</p>
                  <p className="text-[10px] text-[#94A3B8]">Use the "Register New Customer" page to onboard accounts via our automated wizard.</p>
                </div>
              ) : (
                activeCustomers.map((c) => {
                  const limitUsagePct = c.creditLimit > 0 ? Math.min(100, (c.outstandingBalance / c.creditLimit) * 100) : 0;
                  return (
                    <div key={c.id} className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForLedger(c)}
                            className="font-extrabold text-[#0F172A] text-sm hover:text-[#5C52FB] transition-colors text-left cursor-pointer"
                            title="Click to view full ledger history"
                          >
                            {c.name}
                          </button>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            c.membershipTier === "VIP" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            c.membershipTier === "Gold" ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {c.membershipTier}
                          </span>
                          {c.gstin && (
                            <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-mono px-1.5 py-0.5 rounded text-[8px]" title="GSTIN Registered">
                              GST: {c.gstin}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94A3B8] flex items-center gap-2">
                          <span>Phone: {c.phone}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-slate-600">
                            Pref: <span className="font-semibold text-[#0F172A]">{c.contactPreference || "WhatsApp"}</span>
                          </span>
                        </p>
                      </div>

                      <div className="w-full sm:w-48 space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Credit Limit Usage:</span>
                          {c.creditLimit > 0 ? (
                            <span className={c.outstandingBalance > c.creditLimit * 0.8 ? "text-rose-600" : "text-[#5C52FB]"}>
                              ₹{c.outstandingBalance.toLocaleString('en-IN')} / ₹{c.creditLimit.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[#5C52FB]">
                              ₹{c.outstandingBalance.toLocaleString('en-IN')} / No Limit
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${c.creditLimit > 0 && c.outstandingBalance > c.creditLimit * 0.8 ? "bg-rose-500" : "bg-[#5C52FB]"}`} 
                            style={{ width: `${c.creditLimit > 0 ? limitUsagePct : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
                        <button
                          type="button"
                          onClick={() => handleStartEditCustomer(c)}
                          className="bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] transition-colors cursor-pointer"
                          title="Edit customer details"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#5C52FB]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForLedger(c)}
                          className="bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] transition-colors cursor-pointer"
                          title="View detailed ledger"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#5C52FB]" />
                          <span>Ledger</span>
                        </button>

                        {c.outstandingBalance > 0 && (
                          <button 
                            onClick={() => sendWhatsAppReminder(c.id, c.outstandingBalance)}
                            className="bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#E2E8F0] transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#5C52FB]" /> Statement
                          </button>
                        )}
                        
                        <button 
                          onClick={() => {
                            setDb((prev) => {
                              const updated = prev.customers.map((cust) => {
                                if (cust.id === c.id) return { ...cust, outstandingBalance: 0 };
                                return cust;
                              });
                              
                              const khataLog = {
                                id: "k-" + Date.now(),
                                tenant_id: "tenant-main",
                                business_id: activeBusinessId,
                                created_by: "user-3",
                                updated_by: "user-3",
                                partyType: "customer",
                                partyId: c.id,
                                partyName: c.name,
                                type: "payment",
                                amount: c.outstandingBalance,
                                description: "Udhaar payment cleared via cashier direct settlement",
                                date: new Date().toISOString().split("T")[0]
                              };

                              return {
                                ...prev,
                                customers: updated,
                                khata: [...prev.khata, khataLog]
                              };
                            });
                            addNotification(`Udhaar settled for ${c.name} successfully.`, "success");
                          }}
                          disabled={c.outstandingBalance === 0}
                          className="btn-elevate-primary disabled:opacity-40 font-bold text-xs px-3.5 py-1.5 cursor-pointer"
                        >
                          Settle Cash
                        </button>

                        {/* Delete Customer Button */}
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                          title="Remove customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 2. Supplier Credits Book (Creditors) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
              <BookOpen className="text-[#5C52FB] w-4 h-4" />
              Supplier Payables Book
            </h3>
            {triggerImportExport && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerImportExport("suppliers")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="Import Suppliers spreadsheet"
                >
                  <Upload className="w-3 h-3 text-[#5C52FB]" />
                  <span>Import</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerImportExport("suppliers")}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  title="Export Suppliers spreadsheet"
                >
                  <Download className="w-3 h-3 text-[#5C52FB]" />
                  <span>Export</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-[#94A3B8]">Track outstanding balances we owe to distributors or wholesalers</p>

          <div className="divide-y divide-slate-100 space-y-3.5">
            {activeSuppliers.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <BookOpen className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-slate-700 text-xs font-bold">No active suppliers registered</p>
              </div>
            ) : (
              activeSuppliers.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-[#0F172A]">{s.name}</p>
                    <p className="text-[10px] text-[#94A3B8] font-medium">Company: {s.companyName} · Phone: {s.phone}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono font-bold text-rose-600">₹{s.outstandingBalance.toLocaleString('en-IN')}</p>
                    <button
                      onClick={() => {
                        setDb((prev) => {
                          const updated = prev.suppliers.map((sup) => {
                            if (sup.id === s.id) return { ...sup, outstandingBalance: 0 };
                            return sup;
                          });
                          return { ...prev, suppliers: updated };
                        });
                        addNotification(`Outstanding payment cleared to Supplier ${s.name}`, "success");
                      }}
                      className="text-[10px] font-bold text-[#5C52FB] hover:underline block cursor-pointer"
                    >
                      Clear Payables
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Edit Customer Modal Overlay */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h4 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
                <Users className="text-[#5C52FB] w-4 h-4" />
                Edit Customer: {editingCustomer.name}
              </h4>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] font-bold transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="label-elevate">Customer Full Name *</label>
                <input 
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-elevate"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="label-elevate">WhatsApp Phone Number *</label>
                <input 
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-elevate"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="label-elevate">Email Address</label>
                <input 
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-elevate"
                />
              </div>

              {/* GSTIN */}
              <div className="space-y-1">
                <label className="label-elevate">GSTIN</label>
                <input 
                  type="text"
                  value={editForm.gstin}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gstin: e.target.value }))}
                  className="input-elevate font-mono"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>

              {/* Credit Limit & Loyalty Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="label-elevate">
                    Credit Limit (₹) <span className="text-[9px] text-[#94A3B8] lowercase">(0 = Unlimited)</span>
                  </label>
                  <input 
                    type="number"
                    value={editForm.creditLimit}
                    onChange={(e) => setEditForm(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                    className="input-elevate font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="label-elevate">Loyalty Tier</label>
                  <select
                    value={editForm.membershipTier}
                    onChange={(e) => setEditForm(prev => ({ ...prev, membershipTier: e.target.value }))}
                    className="input-elevate"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Silver">Silver Tier</option>
                    <option value="Gold">Gold Elite</option>
                    <option value="VIP">VIP Lounge</option>
                  </select>
                </div>
              </div>

              {/* Contact Preference */}
              <div className="space-y-1">
                <label className="label-elevate">Contact Preference</label>
                <select
                  value={editForm.contactPreference}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contactPreference: e.target.value }))}
                  className="input-elevate"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerEdit}
                className="btn-elevate-primary flex-1 font-extrabold text-xs py-2.5 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
