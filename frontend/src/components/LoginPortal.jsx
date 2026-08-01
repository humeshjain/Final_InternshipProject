import React, { useState } from "react";
import { Shield, Sparkles, Building2, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function LoginPortal({
  onLoginSuccess,
  onRegisterSuccess,
  addNotification
}) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields
  const [username, setUsername] = useState("priya_owner");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");

  const DEMO_ACCOUNTS = [
    { role: "Owner", user: "priya_owner", pass: "password123" },
    { role: "Admin", user: "vikram_admin", pass: "password123" },
    { role: "Staff", user: "raj_staff", pass: "password123" },
    { role: "Finance", user: "kavita_accountant", pass: "password123" }
  ];

  const handleSelectDemo = (acc) => {
    setUsername(acc.user);
    setPassword(acc.pass);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        if (res.ok) {
          const data = await res.json();
          if (addNotification) {
            addNotification(`Welcome back, ${data.user?.name || username}!`, "success");
          }
          onLoginSuccess(data.token, data.user);
        } else {
          const data = await res.json();
          setErrorMsg(data.error || "Invalid store username or password.");
          if (addNotification) {
            addNotification(data.error || "Authentication failed", "error");
          }
        }
      } else {
        if (!username || !password || !name || !email || !phone || !businessName) {
          setErrorMsg("All store registration details are required for security verification.");
          setLoading(false);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setErrorMsg("Email verification failed: Please enter a valid email address.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            name,
            email,
            phone,
            role: "owner",
            businessName
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (addNotification) {
            addNotification(`Workspace ${businessName} initialized successfully!`, "success");
          }
          onRegisterSuccess(data.token, data.user, businessName);
        } else {
          const data = await res.json();
          setErrorMsg(data.error || "Registration failed. Username may already exist.");
          if (addNotification) {
            addNotification(data.error || "Registration failed", "error");
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to auth server.");
      if (addNotification) {
        addNotification("Network error during authentication", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-6 font-sans antialiased">
      {/* Centered Login Card */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-8 md:p-10 flex flex-col justify-between transition-all">
        
        <div>
          {/* Header & Branding Section */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5C52FB] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xl shadow-md mx-auto mb-3">
              E
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">
              Elevate Business
            </h1>
            <p className="text-xs text-[#64748B] font-medium leading-relaxed">
              Indian Retail & SME Double-Entry Billing Gateway
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] mb-5">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                mode === "login"
                  ? "bg-white text-[#5C52FB] shadow-xs border border-[#E2E8F0]"
                  : "text-[#94A3B8] hover:text-[#0F172A]"
              }`}
            >
              Portal Login
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setErrorMsg(""); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                mode === "signup"
                  ? "bg-white text-[#5C52FB] shadow-xs border border-[#E2E8F0]"
                  : "text-[#94A3B8] hover:text-[#0F172A]"
              }`}
            >
              Register Workspace
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-semibold leading-normal">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent transition-all placeholder-[#94A3B8]"
                    placeholder="e.g. Priya Agarwal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                    BUSINESS NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent transition-all placeholder-[#94A3B8]"
                    placeholder="e.g. Vishwa Retail Enterprise"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent"
                      placeholder="priya@vishwa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                      MOBILE
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                STORE USERNAME
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent transition-all placeholder-[#94A3B8]"
                placeholder="Enter username (e.g. priya_owner)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5">
                ACCESS PIN / PASSWORD
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#5C52FB] focus:border-transparent transition-all placeholder-[#94A3B8]"
                placeholder="••••••••••••"
              />
            </div>

            {/* Quick Demo Role Selector Pills */}
            {mode === "login" && (
              <div className="pt-1">
                <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  PRE-FILLED DEMO ROLES:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSel = username === acc.user;
                    return (
                      <button
                        key={acc.user}
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className={`py-1.5 px-1 text-[10px] font-extrabold rounded-md border text-center transition-all cursor-pointer truncate ${
                          isSel
                            ? "bg-[#5C52FB] text-white border-[#5C52FB]"
                            : "bg-[#F8FAFC] hover:bg-slate-100 border-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        {acc.role}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-lg bg-[#5C52FB] hover:bg-[#4B42E0] text-white font-bold text-sm tracking-wide uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{mode === "login" ? "SECURE AUTHENTICATION" : "REGISTER & PROVISION STORE"}</span>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials Footer */}
        <div className="text-xs text-[#94A3B8] text-center mt-6 pt-4 border-t border-[#E2E8F0]/60">
          Demo Credentials: <strong className="text-[#0F172A]">{username || "priya_owner"}</strong> / <strong className="text-[#0F172A]">password123</strong>
        </div>

      </div>
    </div>
  );
}
