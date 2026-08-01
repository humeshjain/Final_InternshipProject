import { useState } from "react";
import { authService } from "../services/authService.js";
import { EmployeeRole } from "../constants/roles.js";

export function useAuth(addNotification) {
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem("vyapaar_session_token") || "";
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("vyapaar_session_user");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [activeBusinessId, setActiveBusinessId] = useState(() => {
    const saved = localStorage.getItem("vyapaar_session_user");
    if (saved) {
      try { return JSON.parse(saved).businessId; } catch (e) {}
    }
    return "biz-1";
  });
  
  const [currentUserRole, setCurrentUserRole] = useState(() => {
    const saved = localStorage.getItem("vyapaar_session_user");
    if (saved) {
      try { return JSON.parse(saved).role; } catch (e) {}
    }
    return EmployeeRole.OWNER;
  });

  const handleRegisterSuccess = (token, user, businessName, setDb) => {
    localStorage.setItem("vyapaar_session_token", token);
    localStorage.setItem("vyapaar_session_user", JSON.stringify(user));
    
    setSessionToken(token);
    setCurrentUser(user);
    setActiveBusinessId(user.businessId);
    setCurrentUserRole(user.role);

    setDb(prev => {
      const exists = prev.businesses.some(b => b.id === user.businessId);
      if (!exists) {
        const newBizObj = {
          id: user.businessId,
          name: businessName || `${user.name}'s Enterprise`,
          gstin: "27AAAAA" + Math.floor(1000 + Math.random() * 9000) + "A1Z1",
          address: "Primary Business Location Address",
          phone: "+91 99999 99999",
          email: user.email,
          ownerId: user.id,
          currency: "INR",
          createdAt: new Date().toISOString().substring(0, 10),
          enabledProductTypes: ["Grocery", "Electronics", "Clothing", "Pharmacy"],
          customProductTypes: [],
          isOnboarded: true
        };
        return {
          ...prev,
          businesses: [...prev.businesses, newBizObj]
        };
      }
      return prev;
    });

    if (addNotification) addNotification(`Welcome ${user.name}! Registered and isolated secure SME workspace.`, "success");
    authService.logAudit(token, "User Onboarding", `Provisioned isolated business workspace for "${businessName || user.name}"`);
  };

  const handleLoginSuccess = (token, user, setDb) => {
    localStorage.setItem("vyapaar_session_token", token);
    localStorage.setItem("vyapaar_session_user", JSON.stringify(user));
    
    setSessionToken(token);
    setCurrentUser(user);
    setActiveBusinessId(user.businessId);
    setCurrentUserRole(user.role);

    setDb(prev => {
      const exists = prev.businesses.some(b => b.id === user.businessId);
      if (!exists) {
        const isTenant2 = user.businessId === "biz-2";
        const bizNameVal = isTenant2 ? "Bharat Wholesale Distribution" : `${user.name}'s Retail Ledger`;
        const gstinVal = isTenant2 ? "07GGGGG2222A1Z2" : "27AAAAA1111A1Z1";
        const newBizObj = {
          id: user.businessId,
          name: bizNameVal,
          gstin: gstinVal,
          address: "Sector 14, Gurgaon, NCR Region",
          phone: "+91 99887 76655",
          email: user.email,
          ownerId: user.id,
          currency: "INR",
          createdAt: "2026-01-01",
          enabledProductTypes: ["Grocery", "Electronics", "Clothing", "Pharmacy"],
          customProductTypes: [],
          isOnboarded: true
        };
        return {
          ...prev,
          businesses: [...prev.businesses, newBizObj]
        };
      } else {
        return {
          ...prev,
          businesses: prev.businesses.map(b => {
            if (b.id === "biz-1" && !b.name) {
              return { ...b, name: "Vishwa Retail Enterprise" };
            }
            return b;
          })
        };
      }
    });

    if (addNotification) addNotification(`Welcome back, ${user.name}! Secure session established.`, "success");
    authService.logAudit(token, "User Login", `Logged in to tenant workspace as ${user.role}`);
  };

  const handleLogout = async (dueToInactivity = false) => {
    try {
      if (sessionToken) {
        await authService.logout(sessionToken);
      }
    } catch (e) {
      console.warn("Server logout notification skipped:", e);
    }

    localStorage.removeItem("vyapaar_session_token");
    localStorage.removeItem("vyapaar_session_user");
    setSessionToken("");
    setCurrentUser(null);
    if (addNotification) {
      addNotification(
        dueToInactivity 
          ? "Session auto-expired due to 15 minutes of inactivity. Please sign in again to secure your ledgers." 
          : "Successfully signed out. Active session invalidated.", 
        dueToInactivity ? "error" : "success"
      );
    }
  };

  return {
    sessionToken,
    currentUser,
    activeBusinessId,
    setActiveBusinessId,
    currentUserRole,
    setCurrentUserRole,
    handleRegisterSuccess,
    handleLoginSuccess,
    handleLogout
  };
}
