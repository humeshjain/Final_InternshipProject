import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  TrendingUp, Mic, Volume2, VolumeX, Send, Brain, ShieldAlert, 
  DollarSign, LineChart as LineChartIcon, Cpu, Mail, MessageSquare, Phone, Bell, 
  Sparkles, RefreshCw, Play, Check, FileText, Layers, Tag, 
  Package, UserCheck, History, AlertTriangle, Percent, Clock, ChevronRight, Trash2
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar, LineChart, Line 
} from "recharts";

export default function AIModule({
  chatMessages,
  handleSendMessage,
  aiIsTyping,
  voiceSpeechSupported,
  triggerVoiceCommand,
  voiceActive,
  setVoiceActive,
  addNotification,
  db,
  setDb,
  activeProducts,
  activeCustomers,
  activeBills,
  activeBusinessId,
  clearChatHistory
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, aiIsTyping]);

  const [isScanningFraud, setIsScanningFraud] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [isAnalyzingMetrics, setIsAnalyzingMetrics] = useState(false);
  const [selectedProductPricing, setSelectedProductPricing] = useState("");
  const [pricingRecommendations, setPricingRecommendations] = useState(null);

  // Generative Summaries state
  const [summaryPeriod, setSummaryPeriod] = useState("daily");
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Marketing campaign generator states
  const [marketingGroup, setMarketingGroup] = useState("VIP");
  const [marketingProduct, setMarketingProduct] = useState("");
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);

  // Automation states
  const [automationLogs, setAutomationLogs] = useState([]);
  const [reportSchedule, setReportSchedule] = useState("Weekly");
  const [backupSchedule, setBackupSchedule] = useState("Daily");

  // Notifications Toggles
  const [alertStockout, setAlertStockout] = useState(true);
  const [alertSalesDrop, setAlertSalesDrop] = useState(true);
  const [alertExpenses, setAlertExpenses] = useState(true);
  const [alertKhataDue, setAlertKhataDue] = useState(true);
  const [alertFraud, setAlertFraud] = useState(true);
  
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  // Predefined questions
  const quickQuestions = [
    { text: "What are today's sales?", val: "What are today's sales? Please analyze today's transactions." },
    { text: "Which products need restocking?", val: "Which products are currently at low stock or critical levels?" },
    { text: "Show unpaid invoices", val: "List all unpaid bills and outstanding Khata credits." },
    { text: "Who are my top customers?", val: "Who are the highest-value customers by purchases and outstanding limit?" },
    { text: "Compare sales with last month", val: "Compare current sales performance metrics with the previous month." },
    { text: "Show inventory worth > ₹1L", val: "List all inventory products whose cumulative stock value exceeds ₹1,00,000." },
    { text: "Which customers haven't purchased in 90 days?", val: "Identify customers who haven't made a transaction in the last 90 days." }
  ];

  // Auto-select first product for pricing on mount or product list change
  useEffect(() => {
    if (activeProducts.length > 0 && !selectedProductPricing) {
      setSelectedProductPricing(activeProducts[0].id);
    }
  }, [activeProducts]);

  // Generate dynamic pricing recommendation based on mock data
  useEffect(() => {
    if (!selectedProductPricing) return;
    const prod = activeProducts.find(p => p.id === selectedProductPricing);
    if (!prod) return;

    // Simulate smart dynamic pricing
    const base = prod.purchasePrice;
    const current = prod.salePrice;
    const demandMultiplier = prod.stock < prod.minStockLevel ? 1.15 : 1.05;

    const bestPrice = Math.round(base * 1.35 * demandMultiplier);
    const promoPrice = Math.round(current * 0.9);
    const discountPercent = 10;
    const profitMaxPrice = Math.round(base * 1.5);
    const seasonalPrice = Math.round(current * 1.08);
    const bundlePrice = Math.round((current * 2) * 0.85);
    const dynamicPrice = Math.round(current * (prod.stock < 15 ? 1.12 : 0.98));

    setPricingRecommendations({
      productId: prod.id,
      productName: prod.name,
      currentPrice: current,
      purchasePrice: base,
      bestPrice,
      promoPrice,
      discountPercent,
      profitMaxPrice,
      seasonalPrice,
      bundlePrice,
      dynamicPrice,
      expectedRevenueBoost: Math.round(12 + Math.random() * 8),
      expectedProfitBoost: Math.round(15 + Math.random() * 10)
    });
  }, [selectedProductPricing, activeProducts]);

  const onSend = () => {
    if (!chatInput.trim()) return;
    handleSendMessage(chatInput);
    setChatInput("");
  };

  // Run Fraud & Anomaly detection
  const runFraudScan = () => {
    setIsScanningFraud(true);
    setScanCompleted(false);

    setTimeout(() => {
      const detected = [];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

      // 1. Scan for Duplicate Invoices
      const invoiceGroups = {};
      activeBills.forEach(b => {
        const key = `${b.customerId}-${b.totalAmount}`;
        if (!invoiceGroups[key]) invoiceGroups[key] = [];
        invoiceGroups[key].push(b);
      });

      Object.values(invoiceGroups).forEach(group => {
        if (group.length > 1) {
          detected.push({
            id: `fraud-dup-inv-${group[0].id}`,
            title: "Duplicate Invoice Detected",
            severity: "Critical",
            description: `Multiple invoices found for customer "${group[0].customerName}" with exact total amount of ₹${group[0].totalAmount.toLocaleString('en-IN')}. Invoices: ${group.map(g => g.invoiceNumber).join(", ")}.`,
            time: group[0].date || nowStr,
            action: "Void duplicate voucher",
            type: "duplicate_invoice"
          });
        }
      });

      // 2. Scan for Excessive Discounts
      activeBills.forEach(b => {
        const discRatio = b.discount / (b.totalAmount + b.discount);
        if (discRatio > 0.3) {
          detected.push({
            id: `fraud-disc-${b.id}`,
            title: "Excessive Discount Applied",
            severity: "High",
            description: `Invoice ${b.invoiceNumber} applied a discount of ₹${b.discount.toLocaleString('en-IN')} (over 30% of order value) for customer "${b.customerName}".`,
            time: b.date || nowStr,
            action: "Requires Owner approval",
            type: "excessive_discount"
          });
        }
      });

      // 3. Scan for Unusual Refunds or Returns
      const returns = activeBills.filter(b => b.isReturn === true || b.totalAmount < 0);
      returns.forEach(ret => {
        detected.push({
          id: `fraud-ref-${ret.id}`,
          title: "Suspicious Product Refund",
          severity: "Medium",
          description: `Refund invoice ${ret.invoiceNumber} processed for ₹${Math.abs(ret.totalAmount).toLocaleString('en-IN')} with cash fallback. No linked original sale transaction verification found.`,
          time: ret.date || nowStr,
          action: "Audit return invoice payload",
          type: "suspicious_refund"
        });
      });

      // 4. Inject static anomaly indicators
      detected.push({
        id: "fraud-static-1",
        title: "Unusual Midnight Cashier Activity",
        severity: "High",
        description: "Cashier Priya logged 3 cash transactions exceeding ₹45,000 between 11:45 PM and 12:15 AM outside standard warehouse lock times.",
        time: "Yesterday, 23:55",
        action: "Review CCTV & terminal logs",
        type: "unusual_employee_activity"
      });

      detected.push({
        id: "fraud-static-2",
        title: "Potential Inventory Theft / Shrinkage Indicator",
        severity: "Critical",
        description: "Discrepancy of 24 units of high-value Neem Face Wash noted between physical stocktake log and electronic SKU ledger adjustment entries.",
        time: "Active alert",
        action: "Freeze adjust permissions & audit",
        type: "inventory_theft"
      });

      detected.push({
        id: "fraud-static-3",
        title: "Fraudulent Payment Attempt Blocked",
        severity: "Medium",
        description: "UPI Gateway flagged and blocked 2 sequential high-value QR payments totaling ₹75,000 with suspicious device tokens.",
        time: "Today, 04:12",
        action: "Flag customer UPI account ID",
        type: "payment_fraud"
      });

      setAnomalies(detected);
      setIsScanningFraud(false);
      setScanCompleted(true);
      addNotification("AI Fraud & Anomaly sweep completed. Security log updated.", "success");
    }, 1500);
  };

  // Dispatch alert to administrator
  const dispatchAdminAlert = (anomaly) => {
    addNotification(`Security Alert Dispatched: "${anomaly.title}" forwarded to owner via WhatsApp & SMS.`, "error");
    
    // Add to audit trail
    const newLog = {
      id: "log-" + Date.now(),
      tenant_id: "tenant-main",
      business_id: activeBusinessId,
      action: "AI Fraud Sentinel Alert",
      userId: "ai_bot",
      username: "AI Fraud Sentinel",
      details: `Dispatched high-severity warning to Admin for: ${anomaly.title} (${anomaly.description})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setDb((prev) => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  // Generate business performance summaries
  const generateBusinessSummary = () => {
    setIsGeneratingSummary(true);
    setGeneratedSummary("");

    setTimeout(() => {
      const salesSum = activeBills.reduce((acc, b) => acc + b.totalAmount, 0);
      const discountSum = activeBills.reduce((acc, b) => acc + b.discount, 0);
      const lowStockCount = activeProducts.filter(p => p.stock <= p.minStockLevel).length;
      const overdueAmount = activeCustomers.reduce((acc, c) => acc + c.outstandingBalance, 0);

      let text = "";
      if (summaryPeriod === "daily") {
        text = `VYAPAAR AI DAILY BUSINESS REPORT (Mumbai Division)
Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
------------------------------------------------------------
SUMMARY OF OPERATIONS:
• Gross Revenue Today: ₹${(salesSum * 0.12 + 15200).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
• Net Profit Today: ₹${((salesSum * 0.12 + 15200) * 0.42).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Margin: 42.1%)
• Total Invoices: ${Math.round(activeBills.length / 5) + 3} processed successfully.

INVENTORY HEALTH & SUPPLY METRICS:
• Restocking Alert: ${lowStockCount} products are below critical safety stock. Paracetamol 650mg is fast-depleting (predicted stockout in 3.2 days).
• Auto-categorization agent matched 100% of newly loaded SKUs.

FINANCIAL & KHATA ANALYSIS:
• Today's cash inflows are highly solid with UPI payments dominating at 74%.
• Outstanding Udhaar (Khata) accounts stand at ₹${overdueAmount.toLocaleString('en-IN')}. Top overdue account is Priya General Store.

AI BUSINESS RECOMMENDATION:
• Increase Paracetamol unit price by 3% tomorrow. Seasonal monsoon demand is rising rapidly.
• Dispatched automated WhatsApp payment links to 2 customers with over ₹10k overdue.`;
      } else if (summaryPeriod === "weekly") {
        text = `VYAPAAR AI WEEKLY EXECUTIVE REPORT
Period: Past 7 Days (Jul 06 - Jul 13, 2026)
------------------------------------------------------------
FINANCIAL CONSOLIDATION:
• Consolidated Sales: ₹${(salesSum * 0.9 + 125000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
• Gross Margin: ₹${((salesSum * 0.9 + 125000) * 0.45).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (45.0%)
• Total Cash Flow Inflow: ₹${(salesSum * 0.95 + 110000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}

CATEGORY & PRODUCT PERFORMANCE:
• Top Performing Category: "Pharmaceuticals" (contributed 62% of weekly gross volume)
• Fastest-Selling SKU: "Paracetamol 650mg" (124 units sold, 84% stock turn velocity)
• Least Profitable Product: "Herbal Neem Soap" (excessive discounts applied to clear slow stock)

EMPLOYEE PERFORMANCE INSIGHTS:
• Cashier Priya processed ₹1.42L sales with 99.8% balance accuracy and an average checkout time of 42 seconds.
• Attendance score for the team is 98.2% with ₹5,200 total incentive bonus unlocked.

SECURITY SCAN REPORT:
• Ran 14 complete system sweeps. Flagged 2 duplicate transactions and blocked 1 fraudulent payment attempt.`;
      } else if (summaryPeriod === "monthly") {
        text = `VYAPAAR AI MONTHLY BOARD REPORT
Period: July 2026 (M-T-D Performance)
------------------------------------------------------------
PERFORMANCE SUMMARY:
• Monthly Revenue: ₹${(salesSum * 3.8 + 480000).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Up 12.4% vs June)
• Consolidated Net Profit: ₹${((salesSum * 3.8 + 480000) * 0.43).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
• Average Cart Value: ₹2,480 (Increased by 8.5% driven by AI bundle offers)

CUSTOMER BUYING TRENDS:
• Silver/Gold tier retention has hit a record 86%.
• Overdue accounts credit risk is under control at 3.1% of sales volume.
• Customer Acquisition Cost (CAC) dropped by 18% due to active referral rewards.

AI STRATEGIC FORECASTS:
• Demand for Wellness & Surgical masks is predicted to rise by 25% next week due to monsoon atmospheric drops.
• Recommended action: Secure bulk purchase contract with supplier "Sun Pharma Biotech" for an additional 500 strips to lock in a 15% wholesale discount.`;
      } else {
        text = `VYAPAAR AI ANNUAL STRATEGIC CONSOLIDATION
Fiscal Period: Year-to-Date (Y-T-D 2026)
------------------------------------------------------------
CORPORATE OVERVIEW:
• YTD Revenue: ₹${(salesSum * 42.5 + 4500000).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (Exceeding baseline targets by 18.2%)
• Annual Profit Forecast: ₹${((salesSum * 42.5 + 4500000) * 0.44).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
• Total Tax Provision (GST 18%/12%): ₹${((salesSum * 42.5 + 4500000) * 0.15).toLocaleString('en-IN', { maximumFractionDigits: 0 })}

MACRO TRENDS & SUPPLY CHAIN INTELLIGENCE:
• Inventory turnover index is optimized at 14.2x (industry average 11.5x), preventing capital lockup.
• Cash reserves are extremely strong with negligible reliance on overdraft credit facilities.
• System scheduled backups run nightly to private redundant cloud vault with 100% SLA uptime.`;
      }

      setGeneratedSummary(text);
      setIsGeneratingSummary(false);
      addNotification(`${summaryPeriod.toUpperCase()} business report compiled successfully.`, "success");
    }, 1200);
  };

  // Generate marketing promotion campaign
  const generateMarketingCampaign = () => {
    setIsGeneratingCampaign(true);
    setGeneratedCampaign(null);

    setTimeout(() => {
      const prod = activeProducts.find(p => p.id === marketingProduct) || activeProducts[0];
      if (!prod) {
        setIsGeneratingCampaign(false);
        return;
      }

      const prodName = prod.name;
      const price = prod.salePrice;

      let whatsapp = "";
      let sms = "";
      let email = "";

      if (marketingGroup === "VIP") {
        whatsapp = `🌟 *EXCLUSIVE VIP OFFER from Vishwa Retailers!* 🌟\n\nDear Premium Member, we appreciate your loyalty. Get a special *15% OFF* on our top-selling *${prodName}* today.\n\n• Regular Price: ₹${price}\n• VIP Deal: *₹${Math.round(price * 0.85)}* only!\n\nTap below to order instantly or secure your slot. Valid today only!`;
        sms = `Vishwa Retail VIP Alert: Dear Premium Member, enjoy an exclusive 15% VIP discount on ${prodName}. Pay just Rs ${Math.round(price * 0.85)} instead of Rs ${price} today. Show this SMS at the counter!`;
        email = `Subject: VIP Exclusive: Secure 15% Off ${prodName} - Today Only!\n\nDear Valued VIP Customer,\n\nAs a valued Gold/VIP Member of Elevate Business Network, we want to extend a personalized reward for your continuous patronage.\n\nWe are offering our highest-velocity wellness essential, ${prodName}, at an exclusive 15% discount for the next 24 hours.\n\n- Retail Price: Rs ${price}\n- Your VIP Price: Rs ${Math.round(price * 0.85)}\n\nThank you for choosing Elevate Business.\n\nWarm regards,\nManagement Team`;
      } else if (marketingGroup === "Inactive") {
        whatsapp = `👋 *We Miss You! Special Comeback Deal!* 👋\n\nIt's been over 90 days since your last purchase. We'd love to welcome you back with a massive *20% discount* on *${prodName}*.\n\n• Regular: ₹${price}\n• Your Comeback Price: *₹${Math.round(price * 0.8)}*!\n\nVisit us today or respond to this text to order. Let's catch up!`;
        sms = `We miss you at Vishwa Retail! Use code COMEBACK20 for a massive 20% discount on ${prodName}. Pay only Rs ${Math.round(price * 0.8)} today. See you soon!`;
        email = `Subject: We miss you! Here is a 20% discount to welcome you back\n\nHello,\n\nIt has been a while since we saw you at Elevate Business. To make your comeback extra sweet, we've prepared a custom voucher.\n\nSave 20% on our premium ${prodName}. Bring this email or use code WELCOMEBACK at checkout.\n\n- Original: Rs ${price}\n- Return Special: Rs ${Math.round(price * 0.8)}\n\nHope to see you soon!\n\nSincerely,\nElevate Business Support`;
      } else {
        whatsapp = `📢 *Monsoon Mega Deal is LIVE!* 📢\n\nProtect your family this season! Get the popular *${prodName}* at a special promotional discount.\n\n• Price: *₹${price}* only!\n• Offers: Buy 2 get an extra 5% off!\n\nDeliveries at MG Road are active. Reply now to book!`;
        sms = `Monsoon Mega Deal: Get ${prodName} at Vishwa Retail for only Rs ${price}! Special bundle discounts available in store. Hurry, stock is limited!`;
        email = `Subject: Monsoon Mega Savings: Stock up on ${prodName}!\n\nDear Customer,\n\nKeep your wellness safety locked in this monsoon with our top recommended essential: ${prodName}.\n\n- Active Selling Price: Rs ${price}\n- Special Offer: Bundle with Surgical masks for an extra 10% off!\n\nOrder today for lightning-fast delivery to MG Road, Mumbai.\n\nBest wishes,\nElevate Business team`;
      }

      setGeneratedCampaign({ whatsapp, sms, email });
      setIsGeneratingCampaign(false);
      addNotification("Promotional marketing campaign copies generated.", "success");
    }, 1200);
  };

  // Apply Price Optimization dynamically
  const applyPriceOptimization = (type) => {
    if (!pricingRecommendations) return;

    let targetPrice = pricingRecommendations.currentPrice;
    if (type === "best") targetPrice = pricingRecommendations.bestPrice;
    if (type === "promo") targetPrice = pricingRecommendations.promoPrice;
    if (type === "seasonal") targetPrice = pricingRecommendations.seasonalPrice;
    if (type === "dynamic") targetPrice = pricingRecommendations.dynamicPrice;

    setDb((prev) => {
      const updatedProducts = prev.products.map((p) => {
        if (p.id === pricingRecommendations.productId) {
          return {
            ...p,
            salePrice: targetPrice,
            updated_by: "ai_pricing_agent"
          };
        }
        return p;
      });

      const audit = {
        id: "log-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: "AI Pricing Optimization Applied",
        userId: "ai_bot",
        username: "Vyapaar AI Optimizer",
        details: `Optimized price of product "${pricingRecommendations.productName}" to ₹${targetPrice} (${type} pricing strategy)`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      return {
        ...prev,
        products: updatedProducts,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });

    addNotification(`AI Pricing applied! "${pricingRecommendations.productName}" is now priced at ₹${targetPrice}.`, "success");
  };

  // Run AI automation processes
  const runAutomation = (type) => {
    setAutomationLogs(prev => [`[${new Date().toLocaleTimeString()}] Triggered AI Automation: ${type}`, ...prev]);

    if (type === "auto-categorize") {
      setTimeout(() => {
        let count = 0;
        setDb((prev) => {
          const updatedProducts = prev.products.map((p) => {
            if (!p.category || p.category === "General" || p.category === "") {
              count++;
              let cat = "Wellness";
              if (p.name.toLowerCase().includes("para") || p.name.toLowerCase().includes("cough") || p.name.toLowerCase().includes("tablet")) {
                cat = "Pharmaceuticals";
              } else if (p.name.toLowerCase().includes("soap") || p.name.toLowerCase().includes("wash") || p.name.toLowerCase().includes("cream")) {
                cat = "Cosmetics";
              } else if (p.name.toLowerCase().includes("mask") || p.name.toLowerCase().includes("glove") || p.name.toLowerCase().includes("bandage")) {
                cat = "Surgicals";
              }
              
              let gst = 12;
              if (cat === "Pharmaceuticals") gst = 12;
              else if (cat === "Surgicals") gst = 18;
              else if (cat === "Cosmetics") gst = 18;
              else gst = 5;

              return { ...p, category: cat, gstPercent: gst, updated_by: "ai_automation_agent" };
            }
            return p;
          });

          return { ...prev, products: updatedProducts };
        });

        setAutomationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] SUCCESS: Auto-categorized and assigned tax codes to ${count || 2} unmapped inventory SKUs.`,
          `[${new Date().toLocaleTimeString()}] TAX: Harmonized GST categories (12% / 18% slab boundaries match Indian Retailing standard)`,
          ...prev
        ]);
        addNotification(`AI categorizer matches and tax matched ${count || 2} products!`, "success");
      }, 1000);
    } else if (type === "duplicate-products") {
      setTimeout(() => {
        setAutomationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] SCAN: Finished duplicate product barcode sweep...`,
          `[${new Date().toLocaleTimeString()}] SUMMARY: 0 matching duplicates or trailing SKU barcodes found in active registry. Database is completely synchronized.`,
          ...prev
        ]);
        addNotification("Duplicate check complete. No product merges needed.", "success");
      }, 800);
    } else if (type === "sku-gen") {
      setTimeout(() => {
        setAutomationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] GENERATION: suggestions completed.`,
          `[${new Date().toLocaleTimeString()}] SKU SUGGESTION: "Paracetamol 650mg" -> suggested HSN SKU "PHA-PARA-650-10X"`,
          `[${new Date().toLocaleTimeString()}] SKU SUGGESTION: "N95 Surgical Mask" -> suggested HSN SKU "SUR-N95-PRO-P50"`,
          ...prev
        ]);
        addNotification("Generated optimized SKU formatting suggestion successfully.", "success");
      }, 800);
    } else if (type === "desc-gen") {
      setTimeout(() => {
        setAutomationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] DESCRIPTION: Generated detailed SEO description for "Paracetamol 650mg"`,
          `[${new Date().toLocaleTimeString()}] TEXT: "High-efficacy, medical-grade Paracetamol 650mg tablets for effective pain relief and fever reduction. Complies with pharmaceutical safety norms."`,
          ...prev
        ]);
        addNotification("Generated GenAI product description.", "success");
      }, 800);
    }
  };

  // Test notification broadcast simulator
  const triggerNotificationBroadcast = () => {
    let channels = [];
    if (notifyInApp) channels.push("In-App");
    if (notifyEmail) channels.push("Email");
    if (notifySMS) channels.push("SMS");
    if (notifyWhatsApp) channels.push("WhatsApp");

    if (channels.length === 0) {
      addNotification("Please select at least one notification dispatch channel first.", "error");
      return;
    }

    addNotification(`Broadcast triggered via [${channels.join(", ")}] to notify: predicted stockouts & critical fraud alerts!`, "success");
  };

  // Mock forecast data for Recharts
  const predictionsData = [
    { name: "Jul 13", revenue: 142560, profit: 59875, cashflow: 95000, demand: 85 },
    { name: "Jul 14", revenue: 148900, profit: 62538, cashflow: 102000, demand: 89 },
    { name: "Jul 15", revenue: 151200, profit: 63504, cashflow: 98000, demand: 92 },
    { name: "Jul 16", revenue: 154000, profit: 64680, cashflow: 110000, demand: 90 },
    { name: "Jul 17", revenue: 159100, profit: 66822, cashflow: 115000, demand: 94 },
    { name: "Jul 18", revenue: 165000, profit: 69300, cashflow: 121000, demand: 97 },
    { name: "Jul 19", revenue: 172000, profit: 72240, cashflow: 128000, demand: 99 }
  ];

  const categoryPerformance = [
    { name: "Pharmaceuticals", sales: 124000, profit: 52080, margin: "42%" },
    { name: "Wellness Items", sales: 48500, profit: 21825, margin: "45%" },
    { name: "Surgical Equipment", sales: 32000, profit: 12800, margin: "40%" },
    { name: "Cosmetics & Wash", sales: 15400, profit: 6160, margin: "40%" }
  ];

  return (
    <div id="ai-intellect-module" className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-[#0F172A] animate-fadeIn">
      
      {/* 1. LEFT AI SUITE NAVIGATION RAIL */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 lg:col-span-1 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="w-10 h-10 bg-[#5C52FB] rounded-xl flex items-center justify-center text-white shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-[#0F172A]">VYAPAAR AI SUITE</h4>
            <span className="text-[9px] uppercase tracking-wider text-[#5C52FB] font-semibold block">Active Intelligence</span>
          </div>
        </div>

        <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "chat", label: "AI Q&A Assistant", icon: MessageSquare },
            { id: "performance", label: "GenAI Reports", icon: FileText },
            { id: "pricing", label: "Pricing Optimizer", icon: Percent },
            { id: "fraud", label: "Fraud Sentinel", icon: ShieldAlert },
            { id: "predictions", label: "Predictive Forecasts", icon: LineChartIcon },
            { id: "automation", label: "AI Automation Lab", icon: Cpu },
            { id: "notifications", label: "Alert Dispatcher", icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap w-full cursor-pointer ${
                  active 
                    ? "bg-[#5C52FB] text-white shadow-xs" 
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#E2E8F0] hidden lg:block space-y-3">
          <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Workspace Health Score</div>
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-[#0F172A] block">84<span className="text-xs text-[#5C52FB]">/100</span></span>
              <span className="text-[9px] text-[#94A3B8] font-bold uppercase">Strong SME Growth</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-dashed border-[#5C52FB]/40 flex items-center justify-center text-[10px] font-black text-[#5C52FB]">
              Optimal
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN ACTIVE AI WORKSPACE CANVAS */}
      <div className="lg:col-span-3 space-y-6">

        {/* ======================= TAB 1: AI CHAT ASSISTANT ======================= */}
        {activeTab === "chat" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[600px]">
            {/* Header */}
            <div className="p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="text-[#5C52FB] w-4.5 h-4.5" />
                  AI Natural Q&A Business Assistant
                </h3>
                <p className="text-[9px] text-[#94A3B8] mt-0.5">English, Hindi & Hinglish Smart Voice Analytics Active</p>
              </div>
              
              <div className="flex items-center gap-2">
                {clearChatHistory && (
                  <button
                    onClick={clearChatHistory}
                    disabled={aiIsTyping}
                    className="p-2 bg-white hover:bg-slate-100 text-[#0F172A] rounded-xl flex items-center gap-1.5 border border-[#E2E8F0] transition-all text-xs font-bold disabled:opacity-50 cursor-pointer"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (voiceSpeechSupported) {
                      triggerVoiceCommand();
                    } else {
                      addNotification("Speech recognition simulation activated.", "success");
                      triggerVoiceCommand();
                    }
                  }}
                  className="p-2.5 bg-[#5C52FB] hover:bg-[#4B42E0] text-white rounded-xl flex items-center justify-center shadow-xs transition-all cursor-pointer"
                  title="Speak Voice Command"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                </button>
                <button 
                  onClick={() => setVoiceActive(!voiceActive)}
                  className={`p-2.5 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    voiceActive ? "bg-[#5C52FB] text-white border-transparent" : "border-[#E2E8F0] text-slate-600 hover:bg-[#F8FAFC]"
                  }`}
                  title="Toggle Text-To-Speech Output Voice"
                >
                  {voiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Chat message viewport */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl p-4 shadow-xs text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#5C52FB] text-white font-semibold rounded-tr-none' 
                      : 'bg-[#F8FAFC] text-[#0F172A] rounded-tl-none border border-[#E2E8F0]'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-slate max-w-none text-xs space-y-2.5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-slate-200 [&_code]:text-[#5C52FB] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-[#5C52FB] [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#E2E8F0] [&_th]:p-2 [&_td]:border [&_td]:border-[#E2E8F0] [&_td]:p-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {aiIsTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3.5 text-xs text-[#0F172A] animate-pulse rounded-tl-none flex items-center gap-2.5 shadow-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#5C52FB]" />
                    <span className="font-semibold">Vyapaar AI is thinking & generating response...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Pills */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap gap-1.5">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  disabled={aiIsTyping}
                  onClick={() => {
                    if (aiIsTyping) return;
                    handleSendMessage(q.val);
                  }}
                  className="text-[10px] font-bold bg-white hover:bg-slate-100 disabled:opacity-50 text-[#5C52FB] px-3 py-1.5 rounded-lg border border-[#E2E8F0] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>{q.text}</span>
                  <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-[#E2E8F0] flex gap-2.5 bg-white items-center">
              <div className="relative flex-1">
                <input 
                  type="text"
                  disabled={aiIsTyping}
                  placeholder={aiIsTyping ? "AI is thinking, please wait..." : "Ask Vyapaar AI about sales, stock, customers, or tax..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  className="w-full h-11 pl-4 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5C52FB] focus:bg-white focus:ring-2 focus:ring-[#5C52FB]/20 transition-all shadow-2xs"
                />
              </div>
              <button 
                onClick={onSend}
                disabled={aiIsTyping || !chatInput.trim()}
                className="h-11 px-6 bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{aiIsTyping ? "Thinking" : "Send"}</span>
                {aiIsTyping ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: PERFORMANCE & GENAI REPORTS ======================= */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            
            {/* Top-performing & Profitability cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="text-[#5C52FB] w-4 h-4" />
                    Top-Selling Categories
                  </h4>
                  <span className="text-[10px] text-[#94A3B8] font-bold">Volume</span>
                </div>
                <div className="space-y-2.5">
                  {categoryPerformance.map((cat, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-[#0F172A] font-semibold">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#94A3B8]">Margin: <span className="text-emerald-600 font-bold">{cat.margin}</span></span>
                        <span className="text-[#0F172A] font-extrabold">₹{cat.sales.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="text-[#5C52FB] w-4 h-4" />
                    Product Profitability Rankings
                  </h4>
                  <span className="text-[10px] text-[#94A3B8] font-bold">Y-T-D</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-emerald-700 font-extrabold block">Most Profitable Product</span>
                      <span className="text-[#0F172A] font-semibold">Paracetamol 650mg</span>
                    </div>
                    <span className="text-emerald-700 font-extrabold text-xs">₹52,080 Net</span>
                  </div>

                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="text-rose-700 font-extrabold block">Least Profitable Product</span>
                      <span className="text-[#0F172A] font-semibold">Herbal Neem Soap</span>
                    </div>
                    <span className="text-rose-700 font-extrabold text-xs">₹1,240 Net</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SME summaries & Reports generation */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Generative Executive Business Summaries</h3>
                  <p className="text-[10px] text-[#94A3B8]">Generates human-readable corporate reports in plain English and Hinglish</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={summaryPeriod} 
                    onChange={(e) => setSummaryPeriod(e.target.value)}
                    className="input-elevate text-xs font-bold"
                  >
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="monthly">Monthly Summary</option>
                    <option value="yearly">Yearly Consolidation</option>
                  </select>
                  <button 
                    onClick={generateBusinessSummary}
                    disabled={isGeneratingSummary}
                    className="btn-elevate-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? "animate-spin" : ""}`} />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {generatedSummary ? (
                <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] font-mono text-xs text-[#0F172A] whitespace-pre-line leading-relaxed">
                  {generatedSummary}
                </div>
              ) : (
                <div className="text-center py-12 text-[#94A3B8] border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
                  <p className="text-xs font-bold text-[#0F172A]">Select a reporting period and click "Generate" to parse database trends.</p>
                </div>
              )}
            </div>

            {/* Campaign Generator */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                  <Sparkles className="text-[#5C52FB] w-4 h-4" />
                  GenAI Customer Promotional Campaigns
                </h3>
                <p className="text-[10px] text-[#94A3B8]">Generate targeted SMS, WhatsApp, and Email copies based on buyer categories</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label-elevate block mb-1">Target Customer Cohort</label>
                  <select 
                    value={marketingGroup}
                    onChange={(e) => setMarketingGroup(e.target.value)}
                    className="input-elevate text-xs font-bold"
                  >
                    <option value="VIP">VIP & High Spenders (15% promo)</option>
                    <option value="Inactive">Inactive Customers (over 90 days)</option>
                    <option value="General">General / Seasonal Megadeal</option>
                  </select>
                </div>

                <div>
                  <label className="label-elevate block mb-1">Selected Product</label>
                  <select 
                    value={marketingProduct}
                    onChange={(e) => setMarketingProduct(e.target.value)}
                    className="input-elevate text-xs font-bold"
                  >
                    {activeProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.salePrice})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    onClick={generateMarketingCampaign}
                    disabled={isGeneratingCampaign}
                    className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#5C52FB] border border-[#E2E8F0] text-xs font-extrabold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCampaign ? "animate-spin" : ""}`} />
                    <span>Create Campaign Copies</span>
                  </button>
                </div>
              </div>

              {generatedCampaign && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#E2E8F0]">
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#5C52FB] flex items-center gap-1">
                      <Phone className="w-3 h-3" /> WhatsApp Copy
                    </span>
                    <pre className="text-[11px] text-[#0F172A] font-sans whitespace-pre-wrap leading-normal select-all bg-white p-2.5 rounded-lg border border-[#E2E8F0]">{generatedCampaign.whatsapp}</pre>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#5C52FB] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> SMS Copy
                    </span>
                    <pre className="text-[11px] text-[#0F172A] font-sans whitespace-pre-wrap leading-normal select-all bg-white p-2.5 rounded-lg border border-[#E2E8F0]">{generatedCampaign.sms}</pre>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#5C52FB] flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email Copy
                    </span>
                    <pre className="text-[11px] text-[#0F172A] font-sans whitespace-pre-wrap leading-normal select-all bg-white p-2.5 rounded-lg border border-[#E2E8F0]">{generatedCampaign.email}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: AI PRICING OPTIMIZATION ======================= */}
        {activeTab === "pricing" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                <Percent className="text-[#5C52FB] w-4.5 h-4.5" />
                AI-Driven Smart Pricing Optimizer
              </h3>
              <p className="text-[10px] text-[#94A3B8]">Calculates maximum profit points, promo scales, and dynamic pricing strategies based on competitor rates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Product selector list */}
              <div className="space-y-2 col-span-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">Products List</span>
                <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] max-h-[300px] overflow-y-auto p-2 space-y-1">
                  {activeProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductPricing(p.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center transition-all cursor-pointer ${
                        selectedProductPricing === p.id 
                          ? "bg-[#5C52FB] text-white font-extrabold shadow-xs" 
                          : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="font-mono">₹{p.salePrice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="md:col-span-2 space-y-4">
                {pricingRecommendations ? (
                  <div className="space-y-4">
                    <div className="bg-[#F8FAFC] p-4.5 rounded-2xl border border-[#E2E8F0] flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold uppercase block">Selected Product</span>
                        <h4 className="text-sm font-extrabold text-[#0F172A]">{pricingRecommendations.productName}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#94A3B8] font-bold uppercase block">Current Price</span>
                        <span className="font-mono text-[#0F172A] font-black">₹{pricingRecommendations.currentPrice}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                        <span className="text-2xl font-black text-emerald-700">+{pricingRecommendations.expectedRevenueBoost}%</span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase block">Expected Revenue Impact</span>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-center text-center">
                        <span className="text-2xl font-black text-[#5C52FB]">+{pricingRecommendations.expectedProfitBoost}%</span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase block">Expected Profit Boost</span>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block pt-2">Select Optimization Strategy</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-[#0F172A] block">Profit-Maximizing Price</span>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">Captures high margin on healthy demand velocity</p>
                        </div>
                        <div className="flex items-center justify-between mt-3.5">
                          <span className="font-mono text-sm font-bold text-[#5C52FB]">₹{pricingRecommendations.profitMaxPrice}</span>
                          <button 
                            onClick={() => applyPriceOptimization("best")}
                            className="bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[10px] font-bold text-[#0F172A] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 text-[#5C52FB]" /> Apply
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-[#0F172A] block">Dynamic Price (Smart Demand)</span>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">Auto-adjusts according to stock count velocity</p>
                        </div>
                        <div className="flex items-center justify-between mt-3.5">
                          <span className="font-mono text-sm font-bold text-[#5C52FB]">₹{pricingRecommendations.dynamicPrice}</span>
                          <button 
                            onClick={() => applyPriceOptimization("dynamic")}
                            className="bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[10px] font-bold text-[#0F172A] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 text-[#5C52FB]" /> Apply
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-[#0F172A] block">Seasonal Surge pricing</span>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">Boost price for heavy monsoon wellness queries</p>
                        </div>
                        <div className="flex items-center justify-between mt-3.5">
                          <span className="font-mono text-sm font-bold text-[#5C52FB]">₹{pricingRecommendations.seasonalPrice}</span>
                          <button 
                            onClick={() => applyPriceOptimization("seasonal")}
                            className="bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[10px] font-bold text-[#0F172A] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 text-[#5C52FB]" /> Apply
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-extrabold text-[#0F172A] block">Promotional pricing</span>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">Boost sale velocity with temporary discount</p>
                        </div>
                        <div className="flex items-center justify-between mt-3.5">
                          <span className="font-mono text-sm font-bold text-rose-600">₹{pricingRecommendations.promoPrice}</span>
                          <button 
                            onClick={() => applyPriceOptimization("promo")}
                            className="bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[10px] font-bold text-[#0F172A] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 text-rose-600" /> Apply
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-[#94A3B8]">
                    No pricing recommendations compiled.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ======================= TAB 4: FRAUD & ANOMALY DETECTION ======================= */}
        {activeTab === "fraud" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-1.5">
                  <ShieldAlert className="text-rose-600 w-4.5 h-4.5" />
                  Vyapaar AI Fraud & Anomaly Sentinel
                </h3>
                <p className="text-[10px] text-[#94A3B8]">Checks invoice records, refund logs, employee adjustments, and payment gateway responses for risks</p>
              </div>
              <button 
                onClick={runFraudScan}
                disabled={isScanningFraud}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningFraud ? "animate-spin" : ""}`} />
                <span>{isScanningFraud ? "Scanning Records..." : "Scan Database"}</span>
              </button>
            </div>

            {scanCompleted ? (
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200 p-4.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="text-rose-600 w-5 h-5" />
                    <div>
                      <span className="text-xs font-black text-rose-700 uppercase block">Anomalies Detected</span>
                      <span className="text-[10px] text-slate-600">Review flagged billing entries and employee patterns</span>
                    </div>
                  </div>
                  <span className="bg-white border border-rose-200 text-rose-700 text-xs font-black px-3 py-1 rounded-full shadow-2xs">{anomalies.length} Flagged</span>
                </div>

                <div className="space-y-3">
                  {anomalies.map((an, i) => (
                    <div key={i} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            an.severity === "Critical" ? "bg-rose-100 text-rose-700 border border-rose-200" :
                            an.severity === "High" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            "bg-slate-200 text-slate-700"
                          }`}>{an.severity}</span>
                          <h4 className="text-xs font-extrabold text-[#0F172A]">{an.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">{an.description}</p>
                        <span className="text-[9px] text-[#94A3B8] block pt-1">Timestamp: {an.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 self-start md:self-center">
                        <button 
                          onClick={() => dispatchAdminAlert(an)}
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Send Alert to Admin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-[#94A3B8] border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-[#94A3B8]" />
                <p className="text-xs font-bold text-[#0F172A]">Launch a complete database security audit to verify operational integrity.</p>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 5: PREDICTIVE ANALYTICS ======================= */}
        {activeTab === "predictions" && (
          <div className="space-y-6">
            
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 text-center space-y-1 shadow-xs">
                <span className="text-[9px] text-[#94A3B8] font-extrabold uppercase block">Predicted Revenue (7 Days)</span>
                <span className="text-2xl font-black text-[#0F172A]">₹10,93,660</span>
                <span className="text-[10px] text-emerald-600 font-bold block">↑ +14.2% Growth</span>
              </div>
              
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 text-center space-y-1 shadow-xs">
                <span className="text-[9px] text-[#94A3B8] font-extrabold uppercase block">Average Cash Reserve</span>
                <span className="text-2xl font-black text-[#0F172A]">₹8,42,000</span>
                <span className="text-[10px] text-emerald-600 font-bold block">↑ Stable Balance</span>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4.5 text-center space-y-1 shadow-xs">
                <span className="text-[9px] text-[#94A3B8] font-extrabold uppercase block">Critical Stockout Risk items</span>
                <span className="text-2xl font-black text-rose-600">2 Products</span>
                <span className="text-[10px] text-rose-600 font-bold block">Action advised</span>
              </div>
            </div>

            {/* Interactive forecasting graph */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A]">Revenue & Net Profit 7-Day Forecast</h3>
                <p className="text-[10px] text-[#94A3B8]">Deep neural projections based on transaction velocities and seasonal monsoon shifts</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5C52FB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#5C52FB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                    <YAxis stroke="#94A3B8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', color: '#0F172A' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="revenue" name="Predicted Revenue (₹)" stroke="#5C52FB" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="profit" name="Predicted Net Profit (₹)" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash flow and Stockout risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">Estimated Cash Flow Velocity</h4>
                  <p className="text-[9px] text-[#94A3B8]">Predicted liquidity inflow (customer bill clearances) vs outflow</p>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={predictionsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={8} />
                      <YAxis stroke="#94A3B8" fontSize={8} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }} />
                      <Bar dataKey="cashflow" name="Liquidity Inflow" fill="#5C52FB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h4 className="font-extrabold text-xs text-[#0F172A] uppercase tracking-wider">Demand Popularity index & Stockout Risk</h4>
                  <p className="text-[9px] text-[#94A3B8]">Estimated remaining days of supply vs velocity metric</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#0F172A] font-bold">Paracetamol 650mg</span>
                      <span className="text-rose-600 font-bold">3.2 Days remaining (High Risk)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
                      <div className="bg-rose-500 h-full w-[20%]"></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#0F172A] font-bold">N95 Surgical Masks</span>
                      <span className="text-amber-600 font-bold">6.5 Days remaining (Medium Risk)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
                      <div className="bg-amber-500 h-full w-[45%]"></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#0F172A] font-bold">Neem Face wash</span>
                      <span className="text-emerald-600 font-bold">28.0 Days remaining (Optimal)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-[#E2E8F0]">
                      <div className="bg-emerald-500 h-full w-[80%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 6: AI AUTOMATION LAB ======================= */}
        {activeTab === "automation" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Action panel */}
            <div className="md:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5 shadow-xs">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F172A]">AI Automation Lab</h3>
                <p className="text-[10px] text-[#94A3B8]">Instruct and deploy automatic robotic routines to manage database sanity</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button 
                  onClick={() => runAutomation("auto-categorize")}
                  className="p-4 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-2xl text-left transition-all space-y-2 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#E2E8F0] text-[#5C52FB] group-hover:bg-[#5C52FB] group-hover:text-white transition-all shadow-2xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0F172A] block">Auto-Categorize & Tax</span>
                    <span className="text-[9px] text-[#94A3B8] block mt-0.5">Categorize unmapped products & map GST brackets</span>
                  </div>
                </button>

                <button 
                  onClick={() => runAutomation("duplicate-products")}
                  className="p-4 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-2xl text-left transition-all space-y-2 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#E2E8F0] text-[#5C52FB] group-hover:bg-[#5C52FB] group-hover:text-white transition-all shadow-2xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0F172A] block">Detect Duplicate Products</span>
                    <span className="text-[9px] text-[#94A3B8] block mt-0.5">Scans active barcodes to merge double registrations</span>
                  </div>
                </button>

                <button 
                  onClick={() => runAutomation("sku-gen")}
                  className="p-4 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-2xl text-left transition-all space-y-2 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#E2E8F0] text-[#5C52FB] group-hover:bg-[#5C52FB] group-hover:text-white transition-all shadow-2xs">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0F172A] block">Generate SKU Suggestions</span>
                    <span className="text-[9px] text-[#94A3B8] block mt-0.5">Fills empty SKUs with structured codes</span>
                  </div>
                </button>

                <button 
                  onClick={() => runAutomation("desc-gen")}
                  className="p-4 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-2xl text-left transition-all space-y-2 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[#E2E8F0] text-[#5C52FB] group-hover:bg-[#5C52FB] group-hover:text-white transition-all shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0F172A] block">GenAI Descriptions</span>
                    <span className="text-[9px] text-[#94A3B8] block mt-0.5">Write engaging product catalogs automatically</span>
                  </div>
                </button>
              </div>

              {/* Schedulers */}
              <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block">AI Scheduling Controls</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#0F172A] block">Recurring Report Sched</span>
                      <span className="text-[9px] text-[#94A3B8] mt-0.5">Automatically trigger analytics</span>
                    </div>
                    <select 
                      value={reportSchedule}
                      onChange={(e) => {
                        setReportSchedule(e.target.value);
                        addNotification(`Recurring reports scheduled to execute ${e.target.value}`, "success");
                      }}
                      className="bg-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-[#E2E8F0] text-[#0F172A]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-[#0F172A] block">Automated backup Sched</span>
                      <span className="text-[9px] text-[#94A3B8] mt-0.5">Offline local sync backups</span>
                    </div>
                    <select 
                      value={backupSchedule}
                      onChange={(e) => {
                        setBackupSchedule(e.target.value);
                        addNotification(`Database backup scheduled to run ${e.target.value}`, "success");
                      }}
                      className="bg-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-[#E2E8F0] text-[#0F172A]"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Never">Never</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 flex flex-col h-full col-span-1 shadow-xs">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-[#5C52FB]" /> Automation Terminal
              </span>
              <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-4.5 border border-[#E2E8F0] font-mono text-[9px] text-[#5C52FB] leading-relaxed overflow-y-auto max-h-[350px] space-y-2">
                {automationLogs.length > 0 ? (
                  automationLogs.map((log, i) => (
                    <div key={i} className="border-b border-[#E2E8F0] pb-1.5 last:border-0">{log}</div>
                  ))
                ) : (
                  <div className="text-[#94A3B8] text-center py-12">
                    Terminal idle. Run an automation routine above to print telemetry.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB 7: NOTIFICATIONS & ALERTS DISPATCHER ======================= */}
        {activeTab === "notifications" && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Predictive Notifications & Channels Setup</h3>
              <p className="text-[10px] text-[#94A3B8]">Configure what predictive triggers forward immediate alerts to store administration</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left toggles: Trigger conditions */}
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block">Predictive Trigger Events</span>
                
                <div className="space-y-3">
                  {[
                    { state: alertStockout, set: setAlertStockout, title: "Predicted Stockouts Alert", desc: "Triggers when sales velocity models predict stock depleting under 5 days" },
                    { state: alertSalesDrop, set: setAlertSalesDrop, title: "Sudden Sales Drop Alert", desc: "Notify when hourly invoice checkout drops more than 40% vs week baseline" },
                    { state: alertExpenses, set: setAlertExpenses, title: "Overlimit Expenses Warning", desc: "Triggers if non-billable expense logs spike drastically" },
                    { state: alertKhataDue, set: setAlertKhataDue, title: "Overdue Khata Customer Warning", desc: "Alert when active credit balance reaches customer credit limit" },
                    { state: alertFraud, set: setAlertFraud, title: "Immediate Fraud Alerts", desc: "Critical flags on duplicate invoices or midnight terminal anomalies" }
                  ].map((trig, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-[#0F172A] block">{trig.title}</span>
                        <span className="text-[9px] text-[#94A3B8] block leading-tight">{trig.desc}</span>
                      </div>
                      <button 
                        onClick={() => {
                          trig.set(!trig.state);
                          addNotification(`${trig.title} configuration updated.`, "success");
                        }}
                        className={`w-10 h-5.5 rounded-full transition-all relative cursor-pointer ${trig.state ? "bg-[#5C52FB]" : "bg-slate-300"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-xs ${trig.state ? "right-1" : "left-1"}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right channels config */}
              <div className="space-y-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block">Dispatch Channels Subscription</span>
                
                <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600" /> In-App Alert Bell
                    </span>
                    <input 
                      type="checkbox" 
                      checked={notifyInApp} 
                      onChange={(e) => setNotifyInApp(e.target.checked)}
                      className="w-4 h-4 accent-[#5C52FB] rounded border-[#E2E8F0]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-600" /> Email Broadcasts
                    </span>
                    <input 
                      type="checkbox" 
                      checked={notifyEmail} 
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-4 h-4 accent-[#5C52FB] rounded border-[#E2E8F0]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600" /> SMS Broadcasts
                    </span>
                    <input 
                      type="checkbox" 
                      checked={notifySMS} 
                      onChange={(e) => setNotifySMS(e.target.checked)}
                      className="w-4 h-4 accent-[#5C52FB] rounded border-[#E2E8F0]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" /> WhatsApp Integration
                    </span>
                    <input 
                      type="checkbox" 
                      checked={notifyWhatsApp} 
                      onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                      className="w-4 h-4 accent-[#5C52FB] rounded border-[#E2E8F0]"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0]">
                    <button 
                      onClick={triggerNotificationBroadcast}
                      className="btn-elevate-primary w-full text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Trigger Test Channel Broadcast</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
