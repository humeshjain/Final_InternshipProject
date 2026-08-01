import React, { useState } from "react";
import { 
  UserPlus, Shield, MessageSquare, MessageCircle, Mail, 
  RotateCcw, ArrowLeft, ArrowRight, Check, Sparkles, Users, CheckCircle2
} from "lucide-react";

export default function CustomerOnboardingModule({
  db,
  setDb,
  addNotification,
  activeBusinessId,
  setActiveTab
}) {
  const [wizardStep, setWizardStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOnboardedName, setLastOnboardedName] = useState("");

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
    setIsSuccess(false);
    addNotification("Onboarding form data has been cleared.", "success");
  };

  const handleOnboardCustomerSubmit = (e) => {
    e.preventDefault();
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

    setDb((prev) => ({
      ...prev,
      customers: [newCust, ...prev.customers]
    }));

    if (newCustomerForm.enableWelcomeMessage) {
      addNotification(`Onboarded & sent welcome broadcast to ${newCust.name} via ${newCustomerForm.contactPreference}!`, "success");
    } else {
      addNotification(`Onboarded customer "${newCust.name}" successfully!`, "success");
    }

    setLastOnboardedName(newCust.name);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#E2E8F0] p-8 rounded-3xl text-center space-y-6 animate-fadeIn shadow-xs text-[#0F172A]">
        <div className="w-16 h-16 bg-[#5C52FB]/10 border border-[#5C52FB]/20 text-[#5C52FB] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[#0F172A]">Customer Onboarded Successfully!</h3>
          <p className="text-slate-600 text-xs max-w-md mx-auto">
            <span className="font-bold text-[#5C52FB]">{lastOnboardedName}</span> has been added to your business database. A welcome message with their credit classification has been dispatched.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <button
            onClick={() => {
              handleResetForm();
              setIsSuccess(false);
            }}
            className="w-full sm:w-auto btn-elevate-primary text-xs font-bold px-5 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Another Customer</span>
          </button>
          
          <button
            onClick={() => setActiveTab("crm")}
            className="w-full sm:w-auto bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-bold px-5 py-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Users className="w-4 h-4 text-[#5C52FB]" />
            <span>Go to Customer Accounts</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6 animate-fadeIn text-[#0F172A]">
      
      <div className="border-b border-[#E2E8F0] pb-4 flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-[#0F172A] flex items-center gap-2 text-sm">
            <UserPlus className="text-[#5C52FB] w-4.5 h-4.5" />
            New Customer Onboarding Wizard
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1">Onboard customer, assign custom credit limits, and launch instant welcome messaging</p>
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-6 rounded-2xl space-y-6">
        {/* Wizard Status Tracker */}
        <div className="grid grid-cols-3 gap-2 border-b border-[#E2E8F0] pb-4">
          <button 
            type="button"
            onClick={() => setWizardStep(1)}
            className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
              wizardStep === 1 
                ? "bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs" 
                : "text-[#94A3B8] hover:text-[#0F172A]"
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Step 1</span>
            <span className="text-xs font-extrabold flex items-center gap-1 text-[#0F172A]">
              <UserPlus className="w-3.5 h-3.5 text-[#5C52FB]" /> Identity
            </span>
          </button>

          <button 
            type="button"
            onClick={() => {
              if (!newCustomerForm.name || !newCustomerForm.phone) {
                addNotification("Please enter full name and phone number first.", "error");
                return;
              }
              setWizardStep(2);
            }}
            className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
              wizardStep === 2 
                ? "bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs" 
                : "text-[#94A3B8] hover:text-[#0F172A]"
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Step 2</span>
            <span className="text-xs font-extrabold flex items-center gap-1 text-[#0F172A]">
              <Shield className="w-3.5 h-3.5 text-[#5C52FB]" /> Credit Limit
            </span>
          </button>

          <button 
            type="button"
            onClick={() => {
              if (!newCustomerForm.name || !newCustomerForm.phone) {
                addNotification("Please enter full name and phone number first.", "error");
                return;
              }
              setWizardStep(3);
            }}
            className={`text-left p-2.5 rounded-xl transition-all cursor-pointer ${
              wizardStep === 3 
                ? "bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs" 
                : "text-[#94A3B8] hover:text-[#0F172A]"
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Step 3</span>
            <span className="text-xs font-extrabold flex items-center gap-1 text-[#0F172A]">
              <MessageSquare className="w-3.5 h-3.5 text-[#5C52FB]" /> Broadcast
            </span>
          </button>
        </div>

        {/* Wizard Content Panel */}
        <form onSubmit={handleOnboardCustomerSubmit} className="space-y-6">
          
          {/* STEP 1: IDENTITY & CONTACT */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#5C52FB]" />
                  Onboarding: Identity & Contacts
                </h4>
                <span className="text-[10px] text-[#94A3B8] font-mono">1 of 3 Steps</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-elevate mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    placeholder="e.g. Anand Sharma"
                    className="input-elevate"
                  />
                </div>
                <div>
                  <label className="label-elevate mb-1 block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    placeholder="e.g. +91 98123 45678"
                    className="input-elevate"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-elevate mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    placeholder="anand@gmail.com"
                    className="input-elevate"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="label-elevate">GSTIN (GST Identification Number)</label>
                    <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] font-bold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={newCustomerForm.gstin}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="input-elevate font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CREDIT & PREFERENCES */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#5C52FB]" />
                  Onboarding: Credit Limits & Classification
                </h4>
                <span className="text-[10px] text-[#94A3B8] font-mono">2 of 3 Steps</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-elevate mb-1 block">
                    Credit Limit (₹) <span className="text-[9px] text-[#94A3B8] lowercase">(0 = Unlimited)</span>
                  </label>
                  <input
                    type="number"
                    value={newCustomerForm.creditLimit}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimit: Number(e.target.value) })}
                    className="input-elevate font-mono font-bold"
                  />
                  
                  {/* Quick select Chips */}
                  <div className="flex gap-1.5 mt-2">
                    {[0, 5000, 15000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewCustomerForm({ ...newCustomerForm, creditLimit: amt })}
                        className={`text-[10px] font-black px-2 py-1 rounded-md border transition-all cursor-pointer ${
                          newCustomerForm.creditLimit === amt 
                            ? "bg-[#5C52FB]/10 text-[#5C52FB] border-[#5C52FB]/35" 
                            : "bg-white border-[#E2E8F0] text-slate-600 hover:text-[#0F172A]"
                        }`}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-elevate mb-1 block">Membership Tier</label>
                  <select
                    value={newCustomerForm.membershipTier}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, membershipTier: e.target.value })}
                    className="input-elevate font-bold"
                  >
                    <option value="Regular">Regular (Standard)</option>
                    <option value="Silver">Silver (Tier 2)</option>
                    <option value="Gold">Gold (Premium)</option>
                    <option value="VIP">VIP (Exclusive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-elevate mb-2 block">Preferred Dispatch Channel</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
                    { id: "SMS", icon: MessageSquare, color: "text-amber-600" },
                    { id: "Email", icon: Mail, color: "text-cyan-600" }
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = newCustomerForm.contactPreference === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewCustomerForm({ ...newCustomerForm, contactPreference: item.id })}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-white border-[#5C52FB] text-[#0F172A] shadow-xs" 
                            : "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] hover:text-[#0F172A]"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${item.color}`} />
                        <span className="text-[10px] font-bold">{item.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AUTOMATED WELCOME SETUP */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#5C52FB]" />
                  Onboarding: Welcome Messages
                </h4>
                <span className="text-[10px] text-[#94A3B8] font-mono">3 of 3 Steps</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#0F172A] block">Enable automated greeting message</span>
                    <span className="text-[10px] text-[#94A3B8] block">Sends instantly on completion to established channel</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newCustomerForm.enableWelcomeMessage}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, enableWelcomeMessage: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#5C52FB]"></div>
                  </label>
                </div>

                {newCustomerForm.enableWelcomeMessage && (
                  <div className="space-y-3 animate-fadeIn pt-1.5 border-t border-[#E2E8F0]">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="label-elevate block">Message Template</label>
                        <span className="text-[8px] text-[#94A3B8] font-bold uppercase font-mono">Placeholders: {"{name}"} and {"{creditLimit}"}</span>
                      </div>
                      <textarea
                        rows={2}
                        value={newCustomerForm.welcomeMessageTemplate}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, welcomeMessageTemplate: e.target.value })}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#5C52FB]"
                      />
                    </div>

                    {/* Interactive Mobile Preview Card */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider block">Live Message Preview ({newCustomerForm.contactPreference})</span>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#5C52FB]"></div>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#94A3B8] font-bold mb-1.5">
                          <Sparkles className="w-3 h-3 text-[#5C52FB]" />
                          <span>Preview simulation</span>
                        </div>
                        <p className="text-xs text-[#0F172A] font-medium leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          "{getSubstitutedMessage()}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wizard Nav/Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleResetForm}
              className="bg-white hover:bg-slate-50 text-rose-600 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] flex items-center gap-1.5 w-full sm:w-auto justify-center transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Fields</span>
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              {wizardStep > 1 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-1 w-full sm:w-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) {
                      if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
                        addNotification("Name and Phone are mandatory to proceed.", "error");
                        return;
                      }
                    }
                    setWizardStep(prev => prev + 1);
                  }}
                  className="bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-extrabold px-5 py-2.5 rounded-xl border border-[#E2E8F0] flex items-center justify-center gap-1 w-full sm:w-auto cursor-pointer shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5C52FB]" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-elevate-primary text-xs font-black px-6 py-2.5 flex items-center justify-center gap-1 w-full sm:w-auto cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Onboard & Dispatch</span>
                </button>
              )}
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}
