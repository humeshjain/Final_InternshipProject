import React, { useState, useEffect } from "react";
import { 
  Search, Trash2, QrCode, Barcode, Receipt, Upload, Download,
  Plus, Save, UserPlus, FileText, History, User, Lock, PlusCircle, Edit, CheckCircle
} from "lucide-react";
import { PaymentMethod, PaymentStatus, EmployeeRole } from "../types";
import POSHistory from "./pos/POSHistory";
import { saveTransaction, saveProduct, saveCustomer } from "../lib/supabaseService";
import { 
  AddCatalogModal, AddManualModal, EditCustomerModal, QuickCustomerModal, 
  VoidModal, EmailModal, InvoicePreviewModal 
} from "./pos/POSModals";
import { getCategories, generateSkuForCategory, validateSku } from "../utils/catalogUtils.js";

export default function POSModule({
  db,
  setDb,
  activeProducts,
  activeCustomers,
  isOffline,
  addNotification,
  activeBusinessId,
  activeBusiness,
  pendingCartProduct,
  clearPendingCartProduct,
  currentUserRole,
  initialSubTab,
  triggerImportExport
}) {
  // Filter active, non-archived products for billing terminal
  const availableProducts = (activeProducts || []).filter(p => (p.status || "Active").toLowerCase() === "active");

  const [posSearchTerm, setPosSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(activeCustomers[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.UPI);
  const [posDiscount, setPosDiscount] = useState(0);
  const [posNotes, setPosNotes] = useState("");
  const [billStatus, setBillStatus] = useState(PaymentStatus.PAID);
  const [paidAmount, setPaidAmount] = useState(0);
  const [invoicePreviewBill, setInvoicePreviewBill] = useState(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState("");
  const [mobileScanning, setMobileScanning] = useState(false);

  // Sub-tab: "checkout" | "history"
  const [posSubTab, setPosSubTab] = useState(initialSubTab || "checkout");

  // Split Payment Configuration State
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitMethod1, setSplitMethod1] = useState(PaymentMethod.CASH);
  const [splitAmount1, setSplitAmount1] = useState(0);
  const [splitMethod2, setSplitMethod2] = useState(PaymentMethod.UPI);
  const [splitAmount2, setSplitAmount2] = useState(0);

  useEffect(() => {
    if (initialSubTab) {
      setPosSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Persistent Draft Bills State
  const [draftBills, setDraftBills] = useState(() => {
    try {
      const saved = localStorage.getItem(`vyapaar_drafts_${activeBusinessId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`vyapaar_drafts_${activeBusinessId}`, JSON.stringify(draftBills));
  }, [draftBills, activeBusinessId]);

  const handleParkAsDraft = () => {
    if (cartItems.length === 0) {
      addNotification("Cannot park an empty cart.", "error");
      return;
    }
    const customerObj = activeCustomers.find(c => c.id === selectedCustomerId) || activeCustomers[0];
    const newDraft = {
      id: "draft-" + Date.now(),
      businessId: activeBusinessId,
      customerId: selectedCustomerId,
      customerName: customerObj ? customerObj.name : "Walk-in Customer",
      items: cartItems,
      discount: posDiscount,
      notes: posNotes,
      paymentMethod: paymentMethod,
      billStatus: billStatus,
      paidAmount: paidAmount,
      isSplitPayment: isSplitPayment,
      splitMethod1, splitAmount1, splitMethod2, splitAmount2,
      createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString('en-IN')
    };

    setDraftBills(prev => [newDraft, ...prev]);
    setCartItems([]);
    setPosDiscount(0);
    setPosNotes("");
    addNotification("Current bill parked as draft successfully.", "success");
  };

  const handleResumeDraft = (draft) => {
    if (cartItems.length > 0) {
      const confirmMerge = window.confirm("You have active items in your cart. Would you like to save your current cart as a draft first? Click 'OK' to save current as draft and resume, or 'Cancel' to overwrite current cart.");
      if (confirmMerge) {
        const customerObj = activeCustomers.find(c => c.id === selectedCustomerId) || activeCustomers[0];
        const currentDraft = {
          id: "draft-" + Date.now(),
          businessId: activeBusinessId,
          customerId: selectedCustomerId,
          customerName: customerObj ? customerObj.name : "Walk-in Customer",
          items: cartItems,
          discount: posDiscount,
          notes: posNotes,
          paymentMethod: paymentMethod,
          billStatus: billStatus,
          paidAmount: paidAmount,
          isSplitPayment: isSplitPayment,
          splitMethod1, splitAmount1, splitMethod2, splitAmount2,
          createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString('en-IN')
        };
        setDraftBills(prev => [currentDraft, ...prev.filter(d => d.id !== draft.id)]);
      } else {
        setDraftBills(prev => prev.filter(d => d.id !== draft.id));
      }
    } else {
      setDraftBills(prev => prev.filter(d => d.id !== draft.id));
    }

    setCartItems(draft.items);
    setSelectedCustomerId(draft.customerId);
    setPosDiscount(draft.discount || 0);
    setPosNotes(draft.notes || "");
    setPaymentMethod(draft.paymentMethod || PaymentMethod.UPI);
    setBillStatus(draft.billStatus || PaymentStatus.PAID);
    setPaidAmount(draft.paidAmount || 0);
    setIsSplitPayment(draft.isSplitPayment || false);
    if (draft.isSplitPayment) {
      setSplitMethod1(draft.splitMethod1);
      setSplitAmount1(draft.splitAmount1);
      setSplitMethod2(draft.splitMethod2);
      setSplitAmount2(draft.splitAmount2);
    }
    addNotification(`Resumed draft for ${draft.customerName}.`, "success");
  };

  const handleDiscardDraft = (draftId) => {
    setDraftBills(prev => prev.filter(d => d.id !== draftId));
    addNotification("Draft discarded.", "success");
  };

  const handleStartNew = () => {
    if (cartItems.length > 0) {
      const park = window.confirm("You have active items in your cart. Would you like to park this cart as a draft before starting a new one?");
      if (park) {
        handleParkAsDraft();
        return;
      }
    }
    setCartItems([]);
    setPosDiscount(0);
    setPosNotes("");
    setPaidAmount(0);
    setBillStatus(PaymentStatus.PAID);
    addNotification("Cleared current terminal and started a fresh bill.", "success");
  };

  // Keyboard Shortcuts inside POS Terminal
  useEffect(() => {
    const handlePOSShortcuts = (e) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      if (isInput && !(e.altKey)) return;

      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        prepareDraftBill();
      }
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleParkAsDraft();
      }
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleStartNew();
      }
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setCartItems([]);
        addNotification("Cleared cart.", "success");
      }
    };
    window.addEventListener("keydown", handlePOSShortcuts);
    return () => window.removeEventListener("keydown", handlePOSShortcuts);
  }, [cartItems, selectedCustomerId, posDiscount, posNotes, paymentMethod, billStatus, paidAmount, isSplitPayment, draftBills]);

  // Custom/Manual Item Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState(0);
  const [manualGst, setManualGst] = useState(18);
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState("pcs");

  // State for Add Catalog Product Modal while billing
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);
  const [newCatalogProdName, setNewCatalogProdName] = useState("");
  const [newCatalogProdSku, setNewCatalogProdSku] = useState("");
  const [newCatalogProdBarcode, setNewCatalogProdBarcode] = useState("");
  const [newCatalogProdCategory, setNewCatalogProdCategory] = useState("General");
  const [newCatalogProdPurchasePrice, setNewCatalogProdPurchasePrice] = useState(0);
  const [newCatalogProdSalePrice, setNewCatalogProdSalePrice] = useState(0);
  const [newCatalogProdGst, setNewCatalogProdGst] = useState(18);
  const [newCatalogProdStock, setNewCatalogProdStock] = useState(100);
  const [newCatalogProdMinStock, setNewCatalogProdMinStock] = useState(10);
  const [newCatalogProdUnit, setNewCatalogProdUnit] = useState("pcs");

  // Quick Customer Registration Inline State
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(50000);
  const [newCustTier, setNewCustTier] = useState("Standard");

  // Edit Customer POS State
  const [editingCustomerPOS, setEditingCustomerPOS] = useState(null);
  const [editFormPOS, setEditFormPOS] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    membershipTier: "Regular",
    creditLimit: 0
  });

  // Draft print-preview state before DB save
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [draftBill, setDraftBill] = useState(null);

  // Void/Cancel authorization states
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [invoiceToVoid, setInvoiceToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidOperatorRole, setVoidOperatorRole] = useState("Manager");

  // Email invoice overlay state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoiceRef, setEmailInvoiceRef] = useState(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Sync selected customer if database updates
  useEffect(() => {
    if (activeCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(activeCustomers[0].id);
    }
  }, [activeCustomers, selectedCustomerId]);

  const addToCart = (product, variantId) => {
    let finalPrice = product.salePrice;
    let finalName = product.name;

    if (variantId && product.variants) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        finalPrice = variant.price;
        finalName = `${product.name} (${variant.name})`;
      }
    }

    const existingIdx = cartItems.findIndex(item => item.productId === product.id && item.variantId === variantId);
    if (existingIdx > -1) {
      const updated = [...cartItems];
      updated[existingIdx].quantity = Number((updated[existingIdx].quantity + 1).toFixed(2));
      updated[existingIdx].total = (updated[existingIdx].quantity * updated[existingIdx].unitPrice) - updated[existingIdx].discount;
      setCartItems(updated);
    } else {
      const gstAmt = (finalPrice * (product.gstPercent / 100));
      const newItem = {
        productId: product.id,
        productName: finalName,
        quantity: 1,
        unitPrice: finalPrice,
        gstPercent: product.gstPercent,
        gstAmount: gstAmt,
        discount: 0,
        total: finalPrice,
        variantId,
        unit: product.unit || "pcs"
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Handle catalog addition bridge
  useEffect(() => {
    if (pendingCartProduct) {
      addToCart(pendingCartProduct);
      if (clearPendingCartProduct) {
        clearPendingCartProduct();
      }
    }
  }, [pendingCartProduct, clearPendingCartProduct]);

  const updateCartQty = (idx, qty) => {
    if (qty < 0) return;
    const updated = [...cartItems];
    updated[idx].quantity = qty;
    updated[idx].total = (qty * updated[idx].unitPrice) - updated[idx].discount;
    setCartItems(updated);
  };

  const updateCartDiscount = (idx, discount) => {
    if (discount < 0) return;
    const updated = [...cartItems];
    updated[idx].discount = discount;
    updated[idx].total = (updated[idx].quantity * updated[idx].unitPrice) - discount;
    setCartItems(updated);
  };

  const removeFromCart = (idx) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const handleBarcodeSelect = (prodId) => {
    const product = activeProducts.find(p => p.id === prodId);
    if (product) {
      addToCart(product);
      addNotification(`Scanned Barcode: ${product.barcode} for ${product.name}`, "success");
      setSelectedBarcodeProduct("");
    }
  };

  const getBusinessState = () => {
    if (activeBusinessId === "biz-1") return "Maharashtra";
    return "Delhi";
  };

  const getBusinessUPI = () => {
    if (activeBusinessId === "biz-1") return "vishwa.pharma@okaxis";
    return "bharat.retail@okaxis";
  };

  const [taxMode, setTaxMode] = useState("inclusive");
  const [customerState, setCustomerState] = useState("Maharashtra");

  useEffect(() => {
    setCustomerState(getBusinessState());
  }, [activeBusinessId]);

  // Compute cart quantities, base prices, GST amounts, and final totals based on Tax Mode
  const computedCartItems = cartItems.map(item => {
    const qty = item.quantity;
    const basePriceNoTax = item.unitPrice;
    const gstPct = item.gstPercent;
    const disc = item.discount;

    let itemSubTotal = 0;
    let itemGst = 0;
    let itemTotal = 0;

    if (taxMode === "inclusive") {
      const totalGross = basePriceNoTax * qty;
      const totalGrossAfterDiscount = Math.max(0, totalGross - disc);
      
      itemTotal = totalGrossAfterDiscount;
      itemSubTotal = itemTotal / (1 + gstPct / 100);
      itemGst = itemTotal - itemSubTotal;
    } else {
      const totalGross = basePriceNoTax * qty;
      const totalBaseAfterDiscount = Math.max(0, totalGross - disc);
      
      itemSubTotal = totalBaseAfterDiscount;
      itemGst = totalBaseAfterDiscount * (gstPct / 100);
      itemTotal = itemSubTotal + itemGst;
    }

    return {
      ...item,
      gstAmount: itemGst,
      total: itemTotal,
      subTotal: itemSubTotal
    };
  });

  const cartSubTotal = computedCartItems.reduce((acc, item) => acc + item.subTotal, 0);
  const cartTotalGst = computedCartItems.reduce((acc, item) => acc + item.gstAmount, 0);
  const cartGrandTotal = Math.max(0, computedCartItems.reduce((acc, item) => acc + item.total, 0) - posDiscount);

  const isIntraState = customerState.trim().toLowerCase() === getBusinessState().trim().toLowerCase();
  const cgstAmount = isIntraState ? cartTotalGst / 2 : 0;
  const sgstAmount = isIntraState ? cartTotalGst / 2 : 0;
  const igstAmount = isIntraState ? 0 : cartTotalGst;

  useEffect(() => {
    setPaidAmount(Number(cartGrandTotal.toFixed(2)));
  }, [cartGrandTotal]);

  const prepareDraftBill = () => {
    if (cartItems.length === 0) {
      addNotification("Cart is empty. Please add products to check out.", "error");
      return;
    }

    const customer = activeCustomers.find(c => c.id === selectedCustomerId) || activeCustomers[0];
    const invNum = `INV-2026-${String(db.bills.length + 1).padStart(3, "0")}`;

    const finalItems = computedCartItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstPercent: item.gstPercent,
      gstAmount: Number(item.gstAmount.toFixed(2)),
      discount: item.discount,
      total: Number(item.total.toFixed(2)),
      variantId: item.variantId,
      unit: item.unit || "pcs"
    }));

    let finalPaid = paidAmount;
    let finalMethod = paymentMethod;

    if (isSplitPayment) {
      finalPaid = Number((splitAmount1 + splitAmount2).toFixed(2));
      finalMethod = `Split (${splitMethod1}: ₹${splitAmount1} + ${splitMethod2}: ₹${splitAmount2})`;
    }

    let finalStatus = billStatus;
    if (finalPaid >= cartGrandTotal) {
      finalStatus = PaymentStatus.PAID;
    } else if (finalPaid > 0) {
      finalStatus = PaymentStatus.PARTIAL;
    } else {
      finalStatus = PaymentStatus.PENDING;
    }

    const draft = {
      id: "bill-" + Date.now(),
      tenant_id: activeBusinessId === "biz-1" ? "tenant-vishwa" : "tenant-bharat",
      business_id: activeBusinessId,
      created_by: "user-3",
      updated_by: "user-3",
      invoiceNumber: invNum,
      date: new Date().toISOString().split("T")[0],
      customerId: customer?.id || "walk-in",
      customerName: customer?.name || "Walk-In Customer",
      customerPhone: customer?.phone || "+91 99999 88888",
      items: finalItems,
      subTotal: Number(cartSubTotal.toFixed(2)),
      discount: posDiscount,
      gstAmount: Number(cartTotalGst.toFixed(2)),
      totalAmount: Number(cartGrandTotal.toFixed(2)),
      paidAmount: finalPaid,
      paymentMethod: finalMethod,
      paymentStatus: finalStatus,
      dueDate: finalStatus !== PaymentStatus.PAID ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : undefined,
      notes: posNotes,
      whatsappStatus: "Sent",
      smsStatus: "Sent",
      remindersCount: 0
    };

    saveFinalizedBill(draft);
  };

  const saveFinalizedBill = async (billToSave) => {
    if (isOffline) {
      addNotification(`POS bill checkout complete! Created INVOICE offline: ${billToSave.invoiceNumber}. Will sync automatically when online.`, "success");
      setInvoicePreviewBill(billToSave);
      setCartItems([]);
      setPosDiscount(0);
      setPosNotes("");
      setIsSplitPayment(false);
      setShowDraftPreview(false);
      setDraftBill(null);
      return;
    }

    // Async persistence to Supabase cloud database
    try {
      await saveTransaction(billToSave);
      
      // Update product stock in Supabase
      for (const item of cartItems) {
        const prod = activeProducts.find(p => p.id === item.productId);
        if (prod) {
          const updatedStock = Math.max(0, prod.stock - item.quantity);
          await saveProduct({ ...prod, stock: updatedStock });
        }
      }

      // Update customer Khata balance in Supabase
      if (billToSave.customerId !== "walk-in") {
        const cust = activeCustomers.find(c => c.id === billToSave.customerId);
        if (cust) {
          const unpaid = billToSave.totalAmount - billToSave.paidAmount;
          if (unpaid > 0) {
            const updatedBal = (cust.outstandingBalance || 0) + unpaid;
            await saveCustomer({ ...cust, outstandingBalance: updatedBal });
          }
        }
      }
    } catch (err) {
      console.warn("Supabase bill save notice:", err);
    }

    setDb(prev => {
      const updatedProducts = prev.products.map(prod => {
        const cartItem = cartItems.find(item => item.productId === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.quantity) };
        }
        return prod;
      });

      const updatedCustomers = prev.customers.map(cust => {
        if (cust.id === billToSave.customerId && billToSave.customerId !== "walk-in") {
          const unpaid = billToSave.totalAmount - billToSave.paidAmount;
          return {
            ...cust,
            outstandingBalance: cust.outstandingBalance + unpaid
          };
        }
        return cust;
      });

      let updatedKhata = [...prev.khata];
      const unpaid = billToSave.totalAmount - billToSave.paidAmount;
      if (unpaid > 0 && billToSave.customerId !== "walk-in") {
        updatedKhata.push({
          id: "k-" + Date.now(),
          tenant_id: billToSave.tenant_id,
          business_id: billToSave.business_id,
          created_by: "user-3",
          updated_by: "user-3",
          partyType: "customer",
          partyId: billToSave.customerId,
          partyName: billToSave.customerName,
          type: "credit",
          amount: unpaid,
          description: `Outstanding from Invoice ${billToSave.invoiceNumber}`,
          date: billToSave.date
        });
      }

      const updatedJournal = [...prev.journal, {
        id: "j-" + Date.now(),
        tenant_id: billToSave.tenant_id,
        business_id: billToSave.business_id,
        created_by: "user-3",
        updated_by: "user-3",
        date: billToSave.date,
        description: `POS Bill ${billToSave.invoiceNumber} sales ledger capture`,
        debitAccount: billToSave.paymentMethod === PaymentMethod.STORE_CREDIT ? "Customer Accounts (Debtors)" : "Bank / Cash",
        creditAccount: "Sales Revenue",
        amount: billToSave.totalAmount
      }];

      const updatedAudit = [...prev.auditLogs, {
        id: "log-" + Date.now(),
        tenant_id: billToSave.tenant_id,
        business_id: billToSave.business_id,
        action: "Invoice Created",
        userId: "user-3",
        username: "priya_cashier",
        details: `Successfully checked out invoice ${billToSave.invoiceNumber} for customer ${billToSave.customerName} (₹${billToSave.totalAmount})`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }];

      return {
        ...prev,
        products: updatedProducts,
        customers: updatedCustomers,
        bills: [billToSave, ...prev.bills],
        khata: updatedKhata,
        journal: updatedJournal,
        auditLogs: updatedAudit
      };
    });

    addNotification(`POS checkout complete! INVOICE ${billToSave.invoiceNumber} generated & dispatched.`, "success");
    setInvoicePreviewBill(billToSave);
    setCartItems([]);
    setPosDiscount(0);
    setPosNotes("");
    setIsSplitPayment(false);
    setShowDraftPreview(false);
    setDraftBill(null);
  };

  const quickRegisterCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      addNotification("Customer Name and Phone Number are mandatory.", "error");
      return;
    }

    const newCust = {
      id: "cust-" + Date.now(),
      tenant_id: activeBusinessId === "biz-1" ? "tenant-vishwa" : "tenant-bharat",
      business_id: activeBusinessId,
      created_by: "user-3",
      updated_by: "user-3",
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || "custom.client@elevatebusiness.ai",
      outstandingBalance: 0,
      creditLimit: newCustCreditLimit,
      membershipTier: newCustTier === "Standard" ? "Regular" : newCustTier,
      gstin: "",
      referralsCount: 0
    };

    setDb(prev => ({
      ...prev,
      customers: [newCust, ...prev.customers]
    }));

    setSelectedCustomerId(newCust.id);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setShowCustomerForm(false);
    addNotification(`Registered & Selected customer: ${newCust.name}`, "success");
  };

  const handleStartEditCustomerPOS = (customer) => {
    setEditingCustomerPOS(customer);
    setEditFormPOS({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      gstin: customer.gstin || "",
      membershipTier: customer.membershipTier || "Regular",
      creditLimit: customer.creditLimit || 0
    });
  };

  const handleSaveCustomerEditPOS = () => {
    if (!editFormPOS.name.trim() || !editFormPOS.phone.trim()) {
      addNotification("Customer Name and Phone Number are required.", "error");
      return;
    }

    setDb(prev => {
      const updated = prev.customers.map(c => {
        if (c.id === editingCustomerPOS?.id) {
          return {
            ...c,
            name: editFormPOS.name,
            phone: editFormPOS.phone,
            email: editFormPOS.email,
            gstin: editFormPOS.gstin,
            membershipTier: editFormPOS.membershipTier,
            creditLimit: editFormPOS.creditLimit,
            updated_by: "user-3"
          };
        }
        return c;
      });
      return { ...prev, customers: updated };
    });

    addNotification(`Customer "${editFormPOS.name}" updated successfully.`, "success");
    setEditingCustomerPOS(null);
  };

  const addCustomItemDirectly = () => {
    if (!manualName.trim()) {
      addNotification("Please enter custom product name", "error");
      return;
    }
    const priceVal = Number(manualPrice) || 0;
    const qtyVal = Number(manualQty) || 1;
    const gstPct = Number(manualGst) || 0;
    const gstAmt = (priceVal * (gstPct / 100)) * qtyVal;

    const newItem = {
      productId: "custom-" + Date.now(),
      productName: manualName,
      quantity: qtyVal,
      unitPrice: priceVal,
      gstPercent: gstPct,
      gstAmount: gstAmt,
      discount: 0,
      total: (priceVal * qtyVal),
      unit: manualUnit || "pcs"
    };

    setCartItems([...cartItems, newItem]);
    addNotification(`Added manual item: ${manualName}`, "success");
    setManualName("");
    setManualPrice(0);
    setManualQty(1);
    setManualUnit("pcs");
    setShowManualForm(false);
  };

  const categoriesList = getCategories(db);

  const handleAddCatalogProduct = (e) => {
    e.preventDefault();
    if (!newCatalogProdName.trim()) {
      addNotification("Please enter product name.", "error");
      return;
    }
    const saleP = Number(newCatalogProdSalePrice) || 0;
    const purP = Number(newCatalogProdPurchasePrice) || 0;
    const stockQty = Number(newCatalogProdStock) || 0;
    const minStk = Number(newCatalogProdMinStock) || 0;
    const gstPct = Number(newCatalogProdGst) || 18;

    const matchedCat = categoriesList.find(c => c.name.toLowerCase() === (newCatalogProdCategory || "").toLowerCase()) || categoriesList[0];
    const categoryName = matchedCat ? matchedCat.name : (newCatalogProdCategory || "General");
    const categoryId = matchedCat ? matchedCat.id : "cat-gen";

    let finalSku = newCatalogProdSku.trim();
    if (!finalSku && matchedCat) {
      finalSku = generateSkuForCategory(matchedCat, db.products || []);
    } else if (!finalSku) {
      finalSku = `GEN-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const skuVal = validateSku(finalSku, db.products || []);
    if (!skuVal.isValid) {
      addNotification(skuVal.error, "error");
      return;
    }

    const finalBarcode = newCatalogProdBarcode.trim() || Date.now().toString();
    const finalQrCode = finalSku ? `QR-${finalSku}` : "";

    const newProd = {
      id: "prod-" + Date.now(),
      tenant_id: "tenant-main",
      business_id: activeBusinessId,
      created_by: "user-1",
      updated_by: "user-1",
      name: newCatalogProdName.trim(),
      sku: finalSku,
      barcode: finalBarcode,
      qrCode: finalQrCode,
      categoryId: categoryId,
      category: categoryName,
      purchasePrice: purP,
      salePrice: saleP,
      gstPercent: gstPct,
      stock: stockQty,
      minStockLevel: minStk,
      warehouseId: "wh-1",
      productType: categoryName,
      attributes: {},
      unit: newCatalogProdUnit || "pcs"
    };

    setDb(prev => ({
      ...prev,
      products: [newProd, ...(prev.products || [])]
    }));

    addNotification(`Added product "${newProd.name}" (SKU: ${newProd.sku}) to Catalog successfully.`, "success");
    addToCart(newProd);

    setNewCatalogProdName("");
    setNewCatalogProdSku("");
    setNewCatalogProdBarcode("");
    setNewCatalogProdCategory(categoriesList[0]?.name || "General");
    setNewCatalogProdPurchasePrice(0);
    setNewCatalogProdSalePrice(0);
    setNewCatalogProdGst(18);
    setNewCatalogProdStock(100);
    setNewCatalogProdMinStock(10);
    setShowAddCatalogModal(false);
  };

  const voidFinalizedBill = (billToVoid, reason, operatorRole) => {
    if (!reason.trim()) {
      addNotification("A mandatory cancellation reason is required to void this bill.", "error");
      return;
    }

    if (operatorRole !== "Manager" && operatorRole !== "Admin" && operatorRole !== "Owner") {
      addNotification("Void access denied. Manager/Admin role authorization required.", "error");
      return;
    }

    setDb(prev => {
      const updatedProducts = prev.products.map(prod => {
        const itemInVoidedBill = billToVoid.items.find(item => item.productId === prod.id);
        if (itemInVoidedBill) {
          return { ...prod, stock: prod.stock + itemInVoidedBill.quantity };
        }
        return prod;
      });

      const updatedCustomers = prev.customers.map(cust => {
        if (cust.id === billToVoid.customerId && billToVoid.customerId !== "walk-in") {
          const unpaid = billToVoid.totalAmount - billToVoid.paidAmount;
          return {
            ...cust,
            outstandingBalance: Math.max(0, cust.outstandingBalance - unpaid)
          };
        }
        return cust;
      });

      const updatedBills = prev.bills.map(b => {
        if (b.id === billToVoid.id) {
          return {
            ...b,
            paymentStatus: PaymentStatus.REFUNDED,
            notes: `[VOIDED by ${operatorRole} on ${new Date().toLocaleDateString('en-IN')}. Reason: ${reason}] ${b.notes || ""}`
          };
        }
        return b;
      });

      let updatedKhata = [...prev.khata];
      const unpaid = billToVoid.totalAmount - billToVoid.paidAmount;
      if (unpaid > 0 && billToVoid.customerId !== "walk-in") {
        updatedKhata.push({
          id: "k-rev-" + Date.now(),
          tenant_id: billToVoid.tenant_id,
          business_id: billToVoid.business_id,
          created_by: "user-3",
          updated_by: "user-3",
          partyType: "customer",
          partyId: billToVoid.customerId,
          partyName: billToVoid.customerName,
          type: "debit",
          amount: unpaid,
          description: `REVERSAL Voided Invoice ${billToVoid.invoiceNumber}`,
          date: new Date().toISOString().split("T")[0]
        });
      }

      const updatedAudit = [...prev.auditLogs, {
        id: "log-" + Date.now(),
        tenant_id: billToVoid.tenant_id,
        business_id: billToVoid.business_id,
        action: "Invoice Voided",
        userId: "user-3",
        username: "priya_cashier",
        details: `Invoice ${billToVoid.invoiceNumber} voided by ${operatorRole}. Reason: ${reason}. Stock & customer dues restored.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }];

      return {
        ...prev,
        products: updatedProducts,
        customers: updatedCustomers,
        bills: updatedBills,
        khata: updatedKhata,
        auditLogs: updatedAudit
      };
    });

    addNotification(`Invoice ${billToVoid.invoiceNumber} successfully VOIDED. Inventory stock restored.`, "success");
    setShowVoidModal(false);
    setInvoiceToVoid(null);
    setVoidReason("");
  };

  const handleMockSendEmail = () => {
    if (!emailAddress.trim() || !emailInvoiceRef) return;
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setShowEmailModal(false);
      addNotification(`Successfully sent digital invoice PDF to ${emailAddress}`, "success");
      setEmailAddress("");
      setEmailInvoiceRef(null);
    }, 1500);
  };

  const activeBills = db.bills.filter(b => b.business_id === activeBusinessId);

  const selectedCustomer = db.customers.find(c => c.id === selectedCustomerId) || db.customers[0];
  const customerPastBills = activeBills.filter(b => b.customerId === selectedCustomerId);
  const customerTotalSales = customerPastBills.reduce((sum, b) => sum + b.totalAmount, 0);

  const isAllowedToBill = currentUserRole === EmployeeRole.OWNER || currentUserRole === EmployeeRole.CO_OWNER || currentUserRole === EmployeeRole.MANAGER || currentUserRole === EmployeeRole.CASHIER;

  if (!isAllowedToBill) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-12 text-center max-w-lg mx-auto my-12 space-y-6 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8 text-rose-600 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-[#0F172A] text-lg">Terminal Access Restricted</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your current workspace role (<strong className="text-rose-600">{currentUserRole}</strong>) does not have authorization to access the active cashier billing terminal.
          </p>
        </div>
        <div className="bg-[#F8FAFC] p-4 border border-[#E2E8F0] rounded-xl text-left space-y-2">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Authorized Roles</p>
          <div className="flex flex-wrap gap-2">
            {["Owner", "Co-owner", "Manager", "Cashier"].map(r => (
              <span key={r} className="px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[9px] font-bold text-[#0F172A]">
                {r}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[#64748B] font-medium">Please contact your administrator or switch to an authorized employee profile to proceed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#0F172A]">
      
      {/* 1. TOP MODULE NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setPosSubTab("checkout")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              posSubTab === "checkout"
                ? "bg-[#5C52FB] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>New Billing Counter</span>
          </button>
          <button
            onClick={() => setPosSubTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              posSubTab === "history"
                ? "bg-[#5C52FB] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Manage Invoices & History</span>
            {activeBills.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                posSubTab === "history" ? "bg-white text-[#5C52FB]" : "bg-purple-100 text-[#5C52FB]"
              }`}>
                {activeBills.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualForm(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:text-[#5C52FB] hover:border-[#5C52FB]/40 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#5C52FB]" />
            <span>Add Manual/Custom Item</span>
          </button>
          <button
            onClick={() => setShowCustomerForm(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:text-[#5C52FB] hover:border-[#5C52FB]/40 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#5C52FB]" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {posSubTab === "checkout" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Cart items & Search */}
          <div className="xl:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#94A3B8]" />
                <input 
                  type="text"
                  placeholder="Search product by name, category, or SKU..."
                  value={posSearchTerm}
                  onChange={(e) => setPosSearchTerm(e.target.value)}
                  className="input-elevate pl-9"
                />
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    value={selectedBarcodeProduct}
                    onChange={(e) => handleBarcodeSelect(e.target.value)}
                    className="input-elevate font-bold text-[#0F172A]"
                  >
                    <option value="" className="text-[#94A3B8]">-- Simulate barcode scan --</option>
                    {activeProducts.map(p => (
                      <option key={p.id} value={p.id} className="text-[#0F172A]">
                        [Barcode: {p.barcode}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setMobileScanning(!mobileScanning)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    mobileScanning ? "bg-[#5C52FB] border-[#5C52FB] text-white shadow-2xs" : "border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC] hover:bg-slate-100"
                  }`}
                  title="Toggle Camera Scanning Mockup"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewCatalogProdName(posSearchTerm);
                  setShowAddCatalogModal(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-[#5C52FB] hover:bg-[#5C52FB] hover:text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Catalog Product</span>
              </button>
            </div>

            {mobileScanning && (
              <div className="bg-[#F8FAFC] text-[#0F172A] rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 border border-[#E2E8F0] animate-pulse">
                <div className="w-12 h-12 border-2 border-[#5C52FB] rounded-md flex items-center justify-center bg-purple-50">
                  <Barcode className="w-6 h-6 text-[#5C52FB]" />
                </div>
                <p className="text-xs font-bold text-[#0F172A]">[Camera Simulator Active]</p>
                <button 
                  onClick={() => {
                    const rand = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                    if (rand) handleBarcodeSelect(rand.id);
                    setMobileScanning(false);
                  }}
                  className="bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  Trigger Capture Simulation
                </button>
              </div>
            )}

            {posSearchTerm.trim() && (
              <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                {(() => {
                  const matches = availableProducts.filter(p => 
                    (p.name || '').toLowerCase().includes(posSearchTerm.toLowerCase()) || 
                    (p.sku || '').toLowerCase().includes(posSearchTerm.toLowerCase()) ||
                    (p.category || '').toLowerCase().includes(posSearchTerm.toLowerCase())
                  );
                  if (matches.length === 0) {
                    return (
                      <div className="text-center py-4 space-y-3">
                        <p className="text-xs text-[#64748B]">No matching catalog product found for "{posSearchTerm}".</p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCatalogProdName(posSearchTerm);
                            setShowAddCatalogModal(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-extrabold text-xs transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Create & Bill "{posSearchTerm}" Now</span>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <>
                      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Search Results ({matches.length})</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {matches.map(p => (
                          <div key={p.id} className="bg-white p-2.5 border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-[#0F172A]">{p.name}</p>
                              <p className="text-[10px] text-[#64748B] font-mono">SKU: {p.sku} · Price: ₹{p.salePrice} · Stock: {p.stock}</p>
                            </div>
                            <button 
                              onClick={() => {
                                addToCart(p);
                                setPosSearchTerm("");
                              }}
                              className="bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-bold px-2.5 py-1 rounded-md text-[11px] cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Fast Billing Catalog</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableProducts.slice(0, 6).map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className="bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#5C52FB] p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-24 relative overflow-hidden group shadow-2xs hover:shadow-xs"
                  >
                    {p.stock <= p.minStockLevel && (
                      <span className="absolute right-2 top-2 bg-rose-50 text-rose-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-rose-200">LOW</span>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#5C52FB] transition-colors line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-[#64748B] font-medium mt-0.5">{p.category}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#5C52FB]">₹{p.salePrice}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">Stock: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl overflow-hidden flex-1 flex flex-col min-h-[18rem]">
              <div className="bg-white border-b border-[#E2E8F0] px-4 py-3.5 flex text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                <span className="flex-1">Product Description</span>
                <span className="w-20 text-center">Qty</span>
                <span className="w-24 text-right">Price (₹)</span>
                <span className="w-16 text-right">GST %</span>
                <span className="w-16 text-right">Disc</span>
                <span className="w-24 text-right">Total</span>
                <span className="w-8"></span>
              </div>
              
              <div className="flex-1 divide-y divide-[#E2E8F0] overflow-y-auto max-h-[25rem]">
                {cartItems.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8] text-xs py-24 flex flex-col items-center justify-center gap-3">
                    <Receipt className="w-8 h-8 text-[#94A3B8] animate-pulse" />
                    <span>No products added yet. Use search, barcode scan, or quick catalog.</span>
                  </div>
                ) : (
                  computedCartItems.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center text-xs hover:bg-white transition-all">
                      <div className="flex-1 min-w-0 pr-2">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => {
                            const updated = [...cartItems];
                            updated[idx].productName = e.target.value;
                            setCartItems(updated);
                          }}
                          className="bg-transparent border-b border-[#E2E8F0] hover:border-slate-300 focus:border-[#5C52FB] focus:outline-none text-[#0F172A] font-bold w-full text-xs truncate"
                        />
                        <p className="text-[9px] text-[#64748B] font-mono mt-0.5">
                          Base: ₹{Number(item.subTotal).toFixed(2)} · GST: ₹{Number(item.gstAmount).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="w-20 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCartQty(idx, Math.max(0, Number((item.quantity - 1).toFixed(2))))}
                          className="w-5 h-5 bg-[#F8FAFC] hover:bg-slate-200 text-[#0F172A] border border-[#E2E8F0] rounded flex items-center justify-center font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <div className="flex flex-col items-center min-w-[2.25rem]">
                          <input 
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(idx, parseFloat(e.target.value) || 0)}
                            className="w-9 border border-[#E2E8F0] bg-white p-0.5 text-center font-mono font-bold text-[#0F172A] rounded focus:outline-none text-[10px]"
                          />
                          <span className="text-[8px] text-[#5C52FB] font-semibold uppercase tracking-wide leading-none mt-0.5 select-none">
                            {item.unit || "pcs"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCartQty(idx, Number((item.quantity + 1).toFixed(2)))}
                          className="w-5 h-5 bg-[#F8FAFC] hover:bg-slate-200 text-[#0F172A] border border-[#E2E8F0] rounded flex items-center justify-center font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="w-24 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const updated = [...cartItems];
                            updated[idx].unitPrice = Number(e.target.value);
                            updated[idx].total = (updated[idx].quantity * updated[idx].unitPrice) - updated[idx].discount;
                            setCartItems(updated);
                          }}
                          className="w-20 border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-right text-[#0F172A] rounded focus:outline-none focus:ring-1 focus:ring-[#5C52FB] font-mono font-semibold"
                        />
                      </div>

                      <div className="w-16 text-right px-1">
                        <select
                          value={item.gstPercent}
                          onChange={(e) => {
                            const updated = [...cartItems];
                            updated[idx].gstPercent = Number(e.target.value);
                            setCartItems(updated);
                          }}
                          className="bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#0F172A] rounded focus:outline-none focus:ring-1 focus:ring-[#5C52FB] p-0.5"
                        >
                          {[0, 5, 12, 18, 28].map(rate => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-16 text-right">
                        <input 
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => updateCartDiscount(idx, Number(e.target.value))}
                          className="w-12 border border-[#E2E8F0] bg-[#F8FAFC] p-1 text-right text-[#0F172A] rounded focus:outline-none focus:ring-1 focus:ring-[#5C52FB] font-mono text-xs"
                        />
                      </div>

                      <div className="w-24 text-right font-black text-[#5C52FB] font-mono">
                        ₹{Number(item.total).toFixed(2)}
                      </div>

                      <div className="w-8 flex justify-end">
                        <button 
                          onClick={() => removeFromCart(idx)}
                          className="text-[#94A3B8] hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Checkout panel */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-5 text-[#0F172A]">
            
            <div className="space-y-4">
              <h3 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <Receipt className="text-[#5C52FB] w-4 h-4" />
                Billing Summary
              </h3>

              <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0] text-xs">
                <button
                  onClick={handleParkAsDraft}
                  disabled={cartItems.length === 0}
                  className={`py-1.5 px-3 rounded-lg font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    cartItems.length === 0
                      ? "bg-slate-100 border-[#E2E8F0] text-slate-400 cursor-not-allowed"
                      : "bg-white border-[#E2E8F0] hover:border-amber-400 text-amber-700 hover:bg-amber-50"
                  }`}
                  title="Park Current Bill (Alt + D)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Park as Draft</span>
                </button>
                <button
                  onClick={handleStartNew}
                  className="py-1.5 px-3 rounded-lg font-bold bg-white border border-[#E2E8F0] hover:border-emerald-400 text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5"
                  title="Start Fresh Bill (Alt + N)"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Start New Bill</span>
                </button>
              </div>

              {draftBills.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Parked Draft Bills ({draftBills.length})
                    </span>
                    <span className="text-[9px] text-[#64748B] font-mono font-medium">Click to resume</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {draftBills.map((draft) => (
                      <div key={draft.id} className="bg-white hover:bg-slate-50 border border-amber-200 p-2 rounded-lg flex flex-col gap-1 transition-all">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold text-[#0F172A] truncate max-w-[120px]">{draft.customerName}</span>
                          <span className="text-[9px] text-[#64748B] font-mono">{draft.createdAt}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#64748B] font-medium">
                          <span>{draft.items.reduce((acc, it) => acc + it.quantity, 0)} items</span>
                          <span className="font-bold text-amber-800 font-mono">
                            ₹{draft.items.reduce((acc, it) => acc + it.total, 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-1 border-t border-amber-100 pt-1.5">
                          <button
                            onClick={() => handleResumeDraft(draft)}
                            className="flex-1 py-1 bg-amber-100 hover:bg-[#5C52FB] text-amber-800 hover:text-white font-extrabold text-[9px] rounded uppercase tracking-wider transition-all"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDiscardDraft(draft.id)}
                            className="p-1 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                            title="Discard Draft"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="label-elevate block">Customer Account</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="input-elevate w-full font-bold"
                >
                  {activeCustomers.map(c => (
                    <option key={c.id} value={c.id} className="text-[#0F172A]">
                      {c.name} ({c.phone}) - Udhaar: ₹{c.outstandingBalance}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId !== "walk-in" && selectedCustomer && (
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#5C52FB]" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0F172A] font-sans">Customer Insights</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditCustomerPOS(selectedCustomer)}
                        className="text-[9px] text-[#5C52FB] hover:text-[#4B42E0] font-bold flex items-center gap-0.5 transition-colors border border-purple-200 bg-purple-50 px-1.5 py-0.5 rounded"
                      >
                        <Edit className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#5C52FB] font-black font-sans">
                        {selectedCustomer.membershipTier || "Standard"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[8px] uppercase">Lifetime Spend</span>
                      <span className="font-bold font-mono text-[#0F172A]">₹{customerTotalSales.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#E2E8F0]">
                      <span className="text-[#64748B] block text-[8px] uppercase">Bills Count</span>
                      <span className="font-bold font-mono text-[#0F172A]">{customerPastBills.length} invoices</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span className="text-[#64748B]">Credit Limit Usage</span>
                      <span className="text-[#0F172A] font-mono">
                        {selectedCustomer.creditLimit > 0 ? (
                          `₹${selectedCustomer.outstandingBalance} / ₹${selectedCustomer.creditLimit}`
                        ) : (
                          `₹${selectedCustomer.outstandingBalance} / No Limit`
                        )}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          selectedCustomer.creditLimit > 0 && (selectedCustomer.outstandingBalance / selectedCustomer.creditLimit) > 0.8 ? "bg-rose-500" : "bg-[#5C52FB]"
                        }`}
                        style={{ width: `${selectedCustomer.creditLimit > 0 ? Math.min(100, (selectedCustomer.outstandingBalance / selectedCustomer.creditLimit) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {customerPastBills.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 border-t border-[#E2E8F0]">
                      <span className="text-[8px] font-extrabold text-[#94A3B8] uppercase tracking-widest block">Recent Invoice Stream</span>
                      <div className="max-h-[4.5rem] overflow-y-auto space-y-1 pr-1">
                        {customerPastBills.slice(0, 3).map((b) => (
                          <div 
                            key={b.id} 
                            onClick={() => setInvoicePreviewBill(b)}
                            className="bg-white border border-[#E2E8F0] p-1.5 rounded-lg flex justify-between items-center text-[9px] hover:border-[#5C52FB] cursor-pointer transition-all"
                          >
                            <span className="font-bold text-[#0F172A] font-mono">{b.invoiceNumber}</span>
                            <span className="text-[#64748B] font-mono">{b.date}</span>
                            <span className="font-black font-mono text-[#5C52FB]">₹{b.totalAmount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[10px] font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#5C52FB]" />
                    Tax Configuration
                  </span>
                  <span className="text-[9px] font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                    GSTR-1 compliant
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="label-elevate block">Tax Mode Selector</span>
                  <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setTaxMode("inclusive")}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                        taxMode === "inclusive"
                          ? "bg-[#5C52FB] text-white shadow-2xs"
                          : "text-slate-600 hover:text-[#0F172A]"
                      }`}
                    >
                      Tax Inclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode("exclusive")}
                      className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${
                        taxMode === "exclusive"
                          ? "bg-[#5C52FB] text-white shadow-2xs"
                          : "text-slate-600 hover:text-[#0F172A]"
                      }`}
                    >
                      Tax Exclusive
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-[#64748B]">Customer State / Region</span>
                    <span className="text-[#5C52FB] font-mono font-extrabold">Shop: {getBusinessState()}</span>
                  </div>
                  <select
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="input-elevate w-full font-bold"
                  >
                    <option value="Maharashtra" className="text-[#0F172A]">Maharashtra (MH - 27)</option>
                    <option value="Delhi" className="text-[#0F172A]">Delhi (DL - 07)</option>
                    <option value="Karnataka" className="text-[#0F172A]">Karnataka (KA - 29)</option>
                    <option value="Tamil Nadu" className="text-[#0F172A]">Tamil Nadu (TN - 33)</option>
                    <option value="Gujarat" className="text-[#0F172A]">Gujarat (GJ - 24)</option>
                    <option value="Uttar Pradesh" className="text-[#0F172A]">Uttar Pradesh (UP - 09)</option>
                  </select>
                </div>

                <div className="border-t border-[#E2E8F0] pt-2 text-[10px] space-y-1 text-[#64748B]">
                  <div className="flex justify-between font-bold text-[#0F172A] mb-1">
                    <span>GST Tax Split Type:</span>
                    <span className="text-[#5C52FB]">
                      {isIntraState ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)"}
                    </span>
                  </div>
                  {isIntraState ? (
                    <>
                      <div className="flex justify-between pl-2">
                        <span>• Central GST (CGST - 50%):</span>
                        <span className="font-mono font-bold text-[#0F172A]">₹{cgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex justify-between pl-2">
                        <span>• State GST (SGST - 50%):</span>
                        <span className="font-mono font-bold text-[#0F172A]">₹{sgstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between pl-2">
                      <span>• Integrated GST (IGST - 100%):</span>
                      <span className="font-mono font-bold text-[#0F172A]">₹{igstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 bg-[#F8FAFC] p-4 rounded-xl text-xs font-semibold text-[#64748B] border border-[#E2E8F0]">
                <div className="flex justify-between">
                  <span>Sub-Total Items (Taxable):</span>
                  <span className="font-mono text-[#0F172A]">₹{cartSubTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax Amount ({taxMode === "inclusive" ? "Included" : "Added"}):</span>
                  <span className="font-mono text-[#0F172A]">₹{cartTotalGst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span>Discount Level (₹):</span>
                  <input 
                    type="number"
                    min="0"
                    value={posDiscount}
                    onChange={(e) => setPosDiscount(Number(e.target.value))}
                    className="w-20 border border-[#E2E8F0] bg-white p-1 text-right text-[#0F172A] rounded font-mono font-bold"
                  />
                </div>
                
                <hr className="border-[#E2E8F0]" />
                <div className="flex justify-between text-sm text-[#5C52FB] font-bold">
                  <span>Grand Total:</span>
                  <span className="font-black font-mono">₹{cartGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              <div className="space-y-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span>Enable Split Payments</span>
                  </label>
                  <input
                    type="checkbox"
                    id="split-payment-checkbox"
                    checked={isSplitPayment}
                    onChange={(e) => setIsSplitPayment(e.target.checked)}
                    className="accent-[#5C52FB] h-4 w-4 cursor-pointer rounded"
                  />
                </div>

                {isSplitPayment ? (
                  <div className="space-y-3 pt-1 text-[10px]">
                    <p className="text-[#64748B] text-[9px] leading-normal italic">
                      Divide the ₹{cartGrandTotal.toFixed(2)} total between two options:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={splitMethod1}
                        onChange={(e) => setSplitMethod1(e.target.value)}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] text-[11px] rounded-lg p-1.5 focus:outline-none"
                      >
                        <option value={PaymentMethod.CASH}>Cash</option>
                        <option value={PaymentMethod.UPI}>UPI/QR</option>
                        <option value={PaymentMethod.CREDIT_CARD}>Card</option>
                        <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amt 1"
                        value={splitAmount1 || ""}
                        onChange={(e) => {
                          const amt1 = Number(e.target.value);
                          setSplitAmount1(amt1);
                          setSplitAmount2(Number(Math.max(0, cartGrandTotal - amt1).toFixed(2)));
                        }}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] text-[11px] font-bold font-mono rounded-lg p-1.5 text-right focus:outline-none focus:ring-1 focus:ring-[#5C52FB]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={splitMethod2}
                        onChange={(e) => setSplitMethod2(e.target.value)}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] text-[11px] rounded-lg p-1.5 focus:outline-none"
                      >
                        <option value={PaymentMethod.UPI}>UPI/QR</option>
                        <option value={PaymentMethod.CASH}>Cash</option>
                        <option value={PaymentMethod.CREDIT_CARD}>Card</option>
                        <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amt 2"
                        value={splitAmount2 || ""}
                        onChange={(e) => {
                          const amt2 = Number(e.target.value);
                          setSplitAmount2(amt2);
                          setSplitAmount1(Number(Math.max(0, cartGrandTotal - amt2).toFixed(2)));
                        }}
                        className="bg-white border border-[#E2E8F0] text-[#0F172A] text-[11px] font-bold font-mono rounded-lg p-1.5 text-right focus:outline-none focus:ring-1 focus:ring-[#5C52FB]"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold bg-white p-2 rounded border border-[#E2E8F0]">
                      <span className="text-[#64748B]">Allocated Balance:</span>
                      <span className={Math.abs((splitAmount1 + splitAmount2) - cartGrandTotal) < 0.1 ? "text-emerald-700 font-mono" : "text-amber-700 font-mono"}>
                        ₹{(splitAmount1 + splitAmount2).toFixed(2)} of ₹{cartGrandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { method: PaymentMethod.CASH, label: "Cash" },
                        { method: PaymentMethod.UPI, label: "UPI/QR" },
                        { method: PaymentMethod.CREDIT_CARD, label: "Card" },
                        { method: PaymentMethod.STORE_CREDIT, label: "Udhaar" },
                        { method: PaymentMethod.CHEQUE, label: "Cheque" },
                        { method: PaymentMethod.BANK_TRANSFER, label: "Bank Trsf" }
                      ].map((m) => {
                        const sel = paymentMethod === m.method;
                        return (
                          <button
                            key={m.method}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(m.method);
                              if (m.method === PaymentMethod.STORE_CREDIT) {
                                setBillStatus(PaymentStatus.PENDING);
                                setPaidAmount(0);
                              } else {
                                setBillStatus(PaymentStatus.PAID);
                                setPaidAmount(cartGrandTotal);
                              }
                            }}
                            className={`py-1.5 text-center text-[10px] font-extrabold rounded-lg border transition-all ${
                              sel 
                                ? "bg-[#5C52FB] text-white border-[#5C52FB]" 
                                : "bg-white hover:bg-slate-100 border-[#E2E8F0] text-slate-600"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="label-elevate block mb-1">Paid Amount (₹)</label>
                        <input 
                          type="number"
                          value={paidAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPaidAmount(val);
                            if (val >= cartGrandTotal) {
                              setBillStatus(PaymentStatus.PAID);
                            } else if (val === 0) {
                              setBillStatus(PaymentStatus.PENDING);
                            } else {
                              setBillStatus(PaymentStatus.PARTIAL);
                            }
                          }}
                          className="w-full border border-[#E2E8F0] bg-white p-1.5 text-center font-bold text-[#0F172A] rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5C52FB]"
                        />
                      </div>
                      <div>
                        <label className="label-elevate block mb-1">Receipt Status</label>
                        <select
                          value={billStatus}
                          onChange={(e) => setBillStatus(e.target.value)}
                          className="w-full border border-[#E2E8F0] bg-white p-1.5 text-center font-bold text-[#0F172A] rounded-lg focus:outline-none text-xs"
                        >
                          <option value={PaymentStatus.PAID} className="text-[#0F172A]">Fully Paid</option>
                          <option value={PaymentStatus.PARTIAL} className="text-[#0F172A]">Partial</option>
                          <option value={PaymentStatus.PENDING} className="text-[#0F172A]">Pending / Credit</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="label-elevate block">Notes / Special Instructions</span>
                  <textarea 
                    placeholder="Add memo/notes/delivery instructions to invoice..."
                    value={posNotes}
                    onChange={(e) => setPosNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-white border border-[#E2E8F0] text-xs rounded-xl focus:outline-none text-[#0F172A] placeholder-slate-400 resize-none font-medium"
                  />
                </div>
              </div>

              {paymentMethod === PaymentMethod.UPI && cartGrandTotal > 0 && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3.5 flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="text-[10px] font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-[#5C52FB]" />
                      UPI Dynamic QR Terminal
                    </span>
                    <span className="text-[9px] text-[#5C52FB] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold animate-pulse">
                      Ready to scan
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl relative group border border-[#E2E8F0]">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                        `upi://pay?pa=${getBusinessUPI()}&pn=${encodeURIComponent(activeBusiness.name)}&am=${cartGrandTotal.toFixed(2)}&tn=POS-${activeBusinessId}-${Date.now()}&cu=INR`
                      )}`}
                      alt="UPI Payment QR Code"
                      referrerPolicy="no-referrer"
                      className="w-36 h-36 mx-auto object-contain transition-transform group-hover:scale-105 duration-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-black text-[#0F172A]">₹{cartGrandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    <p className="text-[9px] text-[#64748B] font-mono">
                      UPI VPA: <span className="text-[#0F172A] font-bold">{getBusinessUPI()}</span>
                    </p>
                    <p className="text-[9px] text-[#64748B] font-bold max-w-xs leading-normal">
                      Ask customer to scan with BHIM, Google Pay, PhonePe, Paytm, or any UPI app.
                    </p>
                  </div>

                  <div className="w-full pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPaidAmount(Number(cartGrandTotal.toFixed(2)));
                        setBillStatus(PaymentStatus.PAID);
                        addNotification("Mock UPI payment confirmation received via webhook!", "success");
                      }}
                      className="w-full bg-white hover:bg-slate-100 border border-[#E2E8F0] text-[10px] font-extrabold text-[#0F172A] py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[#5C52FB]" />
                      Simulate Bank Confirmation
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button 
                onClick={prepareDraftBill}
                className="w-full bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-extrabold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                Complete POS Checkout
              </button>
              <p className="text-[9px] text-[#64748B] text-center font-medium uppercase tracking-wider">
                PDF Invoice dispatched via WhatsApp & SMS automatically
              </p>
            </div>

          </div>
        </div>
      ) : (
        <POSHistory
          activeBills={activeBills}
          triggerImportExport={triggerImportExport}
          posSearchTerm={posSearchTerm}
          setPosSearchTerm={setPosSearchTerm}
          billStatus={billStatus}
          setBillStatus={setBillStatus}
          customerState={customerState}
          setCustomerState={setCustomerState}
          setInvoicePreviewBill={setInvoicePreviewBill}
          setInvoiceToVoid={setInvoiceToVoid}
          setVoidOperatorRole={setVoidOperatorRole}
          setVoidReason={setVoidReason}
          setShowVoidModal={setShowVoidModal}
          db={db}
        />
      )}

      {/* Render All Modals */}
      <AddCatalogModal
        showAddCatalogModal={showAddCatalogModal}
        setShowAddCatalogModal={setShowAddCatalogModal}
        handleAddCatalogProduct={handleAddCatalogProduct}
        newCatalogProdName={newCatalogProdName}
        setNewCatalogProdName={setNewCatalogProdName}
        newCatalogProdSku={newCatalogProdSku}
        setNewCatalogProdSku={setNewCatalogProdSku}
        newCatalogProdBarcode={newCatalogProdBarcode}
        setNewCatalogProdBarcode={setNewCatalogProdBarcode}
        newCatalogProdPurchasePrice={newCatalogProdPurchasePrice}
        setNewCatalogProdPurchasePrice={setNewCatalogProdPurchasePrice}
        newCatalogProdSalePrice={newCatalogProdSalePrice}
        setNewCatalogProdSalePrice={setNewCatalogProdSalePrice}
        newCatalogProdGst={newCatalogProdGst}
        setNewCatalogProdGst={setNewCatalogProdGst}
        newCatalogProdCategory={newCatalogProdCategory}
        setNewCatalogProdCategory={setNewCatalogProdCategory}
        newCatalogProdUnit={newCatalogProdUnit}
        setNewCatalogProdUnit={setNewCatalogProdUnit}
        newCatalogProdStock={newCatalogProdStock}
        setNewCatalogProdStock={setNewCatalogProdStock}
        newCatalogProdMinStock={newCatalogProdMinStock}
        setNewCatalogProdMinStock={setNewCatalogProdMinStock}
        categories={categoriesList}
      />

      <AddManualModal
        showManualForm={showManualForm}
        setShowManualForm={setShowManualForm}
        manualName={manualName}
        setManualName={setManualName}
        manualPrice={manualPrice}
        setManualPrice={setManualPrice}
        manualGst={manualGst}
        setManualGst={setManualGst}
        manualQty={manualQty}
        setManualQty={setManualQty}
        manualUnit={manualUnit}
        setManualUnit={setManualUnit}
        addCustomItemDirectly={addCustomItemDirectly}
      />

      <EditCustomerModal
        editingCustomerPOS={editingCustomerPOS}
        setEditingCustomerPOS={setEditingCustomerPOS}
        editFormPOS={editFormPOS}
        setEditFormPOS={setEditFormPOS}
        handleSaveCustomerEditPOS={handleSaveCustomerEditPOS}
      />

      <QuickCustomerModal
        showCustomerForm={showCustomerForm}
        setShowCustomerForm={setShowCustomerForm}
        newCustName={newCustName}
        setNewCustName={setNewCustName}
        newCustPhone={newCustPhone}
        setNewCustPhone={setNewCustPhone}
        newCustEmail={newCustEmail}
        setNewCustEmail={setNewCustEmail}
        newCustCreditLimit={newCustCreditLimit}
        setNewCustCreditLimit={setNewCustCreditLimit}
        newCustTier={newCustTier}
        setNewCustTier={setNewCustTier}
        quickRegisterCustomer={quickRegisterCustomer}
      />

      <VoidModal
        showVoidModal={showVoidModal}
        setShowVoidModal={setShowVoidModal}
        invoiceToVoid={invoiceToVoid}
        setInvoiceToVoid={setInvoiceToVoid}
        voidReason={voidReason}
        setVoidReason={setVoidReason}
        voidOperatorRole={voidOperatorRole}
        setVoidOperatorRole={setVoidOperatorRole}
        voidFinalizedBill={voidFinalizedBill}
      />

      <EmailModal
        showEmailModal={showEmailModal}
        setShowEmailModal={setShowEmailModal}
        emailInvoiceRef={emailInvoiceRef}
        setEmailInvoiceRef={setEmailInvoiceRef}
        emailAddress={emailAddress}
        setEmailAddress={setEmailAddress}
        handleMockSendEmail={handleMockSendEmail}
        isSendingEmail={isSendingEmail}
      />

      <InvoicePreviewModal
        invoicePreviewBill={invoicePreviewBill}
        setInvoicePreviewBill={setInvoicePreviewBill}
        activeBusiness={activeBusiness}
        getBusinessUPI={getBusinessUPI}
        taxMode={taxMode}
        isIntraState={isIntraState}
        addNotification={addNotification}
      />

    </div>
  );
}
