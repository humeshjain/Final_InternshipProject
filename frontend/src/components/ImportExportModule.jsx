import React, { useState, useEffect, useRef } from "react";
import { 
  Download, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, 
  Settings, History, HelpCircle, FileText, ChevronRight, ChevronLeft, 
  Trash2, Filter, Check, RefreshCw, Layers, ShieldCheck, Database, 
  Users, Package, Receipt, Calendar, Key, AlertCircle, FileArchive,
  UserPlus, Plus, X
} from "lucide-react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import Papa from "papaparse";
import { EmployeeRole, PaymentMethod, PaymentStatus } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { 
  upsertProducts, upsertCustomers, upsertTransactions, upsertExpenses 
} from "../lib/supabaseService";

// Map entity IDs to human readable labels
const ENTITIES = [
  { id: "customers", label: "Customers", desc: "CRM client profiles, accounts & loyalty tiers", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "suppliers", label: "Suppliers", desc: "Vendor accounts, credit ledgers & details", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "products", label: "Products", desc: "Stock catalog, prices, categories & SKU codes", requiredRoles: ["Owner", "Co-owner", "Manager", "Inventory Manager"] },
  { id: "inventory", label: "Inventory / Opening Stock", desc: "Update existing product quantities and base parameters", requiredRoles: ["Owner", "Co-owner", "Manager", "Inventory Manager"] },
  { id: "bills", label: "Bills / Invoices", desc: "Sales transactions, POS history ledgers & bills", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "khata", label: "Payments / Receipts", desc: "Credit receipts, outstanding balances and dues", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "expenses", label: "Expenses", desc: "Operational costs, double-entry expense vouchers", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "employees", label: "Employees", desc: "Staff directory, usernames, roles & salary configurations", requiredRoles: ["Owner", "Co-owner"] },
  { id: "attendance", label: "Employee Logs / Attendance", desc: "Presence register, check-ins, rates & logs", requiredRoles: ["Owner", "Co-owner", "Manager"] },
  { id: "categories", label: "Categories", desc: "Configure custom product types & group catalogs", requiredRoles: ["Owner", "Co-owner", "Manager"] },
  { id: "customer_opening", label: "Customer Opening Balances", desc: "Set credit accounts, Udhaar baselines & values", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] },
  { id: "supplier_opening", label: "Supplier Opening Balances", desc: "Set supplier outstanding baselines & values", requiredRoles: ["Owner", "Co-owner", "Manager", "Accountant"] }
];

// Entity field definitions for column mapping & validation
const ENTITY_SCHEMAS = {
  customers: [
    { key: "name", label: "Customer Name", required: true, type: "string", desc: "Full name of the client" },
    { key: "phone", label: "Phone Number", required: true, type: "string", desc: "WhatsApp contact number (10-digits)" },
    { key: "email", label: "Email Address", required: false, type: "string", desc: "Billing email" },
    { key: "outstandingBalance", label: "Outstanding Balance", required: false, type: "number", desc: "Current pending Udhaar (₹)" },
    { key: "creditLimit", label: "Credit Limit", required: false, type: "number", desc: "Credit ceiling (₹, 0 for unlimited)" },
    { key: "membershipTier", label: "Membership Tier", required: false, type: "select", options: ["Regular", "Silver", "Gold", "VIP"], desc: "Customer rewards class" },
    { key: "gstin", label: "GSTIN", required: false, type: "string", desc: "15-character GSTIN code" }
  ],
  suppliers: [
    { key: "name", label: "Supplier Name", required: true, type: "string", desc: "Vendor company name" },
    { key: "phone", label: "Contact Phone", required: true, type: "string", desc: "Primary phone" },
    { key: "email", label: "Email Address", required: false, type: "string", desc: "Contact email" },
    { key: "outstandingBalance", label: "Outstanding Balance", required: false, type: "number", desc: "Current due to supplier (₹)" },
    { key: "gstin", label: "GSTIN", required: false, type: "string", desc: "Vendor GSTIN registration" }
  ],
  products: [
    { key: "name", label: "Product Name", required: true, type: "string", desc: "Unique item description" },
    { key: "sku", label: "SKU Code", required: true, type: "string", desc: "Stock keeping unit code" },
    { key: "barcode", label: "Barcode", required: false, type: "string", desc: "UPC / EAN identifier" },
    { key: "category", label: "Category", required: true, type: "string", desc: "Product group, e.g. Grocery" },
    { key: "purchasePrice", label: "Purchase Price", required: true, type: "number", desc: "Cost price per unit (₹)" },
    { key: "salePrice", label: "Sale Price", required: true, type: "number", desc: "Selling price per unit (₹)" },
    { key: "gstPercent", label: "GST Percent", required: false, type: "select", options: ["0", "5", "12", "18", "28"], desc: "GST tier applicable" },
    { key: "stock", label: "Stock Quantity", required: false, type: "number", desc: "Current opening units on shelf" },
    { key: "minStockLevel", label: "Min Stock Limit", required: false, type: "number", desc: "Low-stock trigger limit" },
    { key: "unit", label: "Unit of Measure", required: false, type: "select", options: ["pcs", "kg", "g", "liters", "ml", "meters", "box", "packet", "tablet", "strip"], desc: "Base count unit" }
  ],
  inventory: [
    { key: "sku", label: "SKU Code", required: true, type: "string", desc: "Matches product SKU exactly" },
    { key: "stock", label: "Stock Adjustment", required: true, type: "number", desc: "Quantity count (overwrites current stock if absolute, or updates)" },
    { key: "minStockLevel", label: "Min Stock Level", required: false, type: "number", desc: "New warning threshold" }
  ],
  bills: [
    { key: "invoiceNumber", label: "Invoice Number", required: true, type: "string", desc: "Unique invoice ID, e.g. INV-2026-001" },
    { key: "date", label: "Invoice Date", required: true, type: "date", desc: "Format YYYY-MM-DD" },
    { key: "customerName", label: "Customer Name", required: true, type: "string", desc: "Client name" },
    { key: "customerPhone", label: "Customer Phone", required: false, type: "string", desc: "10-digit phone" },
    { key: "totalAmount", label: "Grand Total", required: true, type: "number", desc: "Total billed value (₹)" },
    { key: "paidAmount", label: "Paid Amount", required: false, type: "number", desc: "Amount paid on checkout (₹)" },
    { key: "paymentStatus", label: "Payment Status", required: true, type: "select", options: ["Paid", "Partial", "Pending", "Refunded"], desc: "Outstanding status" },
    { key: "paymentMethod", label: "Payment Method", required: false, type: "select", options: ["Cash", "UPI", "Cheque", "Bank Transfer", "Credit Card"], desc: "Mode of transaction" }
  ],
  khata: [
    { key: "customerName", label: "Customer Name", required: true, type: "string", desc: "Associated customer" },
    { key: "amount", label: "Payment Amount", required: true, type: "number", desc: "Value paid / credited (₹)" },
    { key: "date", label: "Transaction Date", required: true, type: "date", desc: "Format YYYY-MM-DD" },
    { key: "paymentMethod", label: "Payment Method", required: false, type: "select", options: ["Cash", "UPI", "Cheque", "Bank Transfer"], desc: "Mode of entry" },
    { key: "notes", label: "Notes", required: false, type: "string", desc: "Memo description" }
  ],
  expenses: [
    { key: "description", label: "Memo Description", required: true, type: "string", desc: "Details of spending, e.g. Electricity bills" },
    { key: "amount", label: "Amount", required: true, type: "number", desc: "Expense cost in ₹" },
    { key: "date", label: "Date Paid", required: true, type: "date", desc: "Format YYYY-MM-DD" },
    { key: "debitAccount", label: "Debit Expense Category", required: true, type: "string", desc: "e.g. Utilities, Fuel, Rent" },
    { key: "creditAccount", label: "Paid Via (Credit)", required: false, type: "string", desc: "e.g. Cash, Bank Account, Card" }
  ],
  employees: [
    { key: "username", label: "Staff Username", required: true, type: "string", desc: "Unique login handle, e.g. amit_sharma" },
    { key: "name", label: "Full Name", required: true, type: "string", desc: "Employee display name" },
    { key: "role", label: "System Role", required: true, type: "select", options: ["Manager", "Accountant", "Cashier", "Inventory Manager", "Sales Executive"], desc: "Roster authorization" },
    { key: "phone", label: "Phone Number", required: true, type: "string", desc: "Contact contact" },
    { key: "email", label: "Email Address", required: false, type: "string", desc: "Corporate email" },
    { key: "salary", label: "Monthly Salary", required: true, type: "number", desc: "Fixed compensation (₹)" },
    { key: "attendanceRate", label: "Attendance Rate", required: false, type: "number", desc: "Roster default rating (0-100)" }
  ],
  attendance: [
    { key: "employeeUsername", label: "Employee Username", required: true, type: "string", desc: "Matches username exactly" },
    { key: "date", label: "Log Date", required: true, type: "date", desc: "Format YYYY-MM-DD" },
    { key: "status", label: "Roster Status", required: true, type: "select", options: ["Present", "Absent", "Half-Day"], desc: "Presence status" },
    { key: "checkIn", label: "Check-in Time", required: false, type: "string", desc: "Format HH:MM (24-hr)" },
    { key: "checkOut", label: "Check-out Time", required: false, type: "string", desc: "Format HH:MM (24-hr)" }
  ],
  categories: [
    { key: "name", label: "Category Name", required: true, type: "string", desc: "E.g. Electronics, Grocery, Stationary" }
  ],
  customer_opening: [
    { key: "phone", label: "Customer Phone", required: true, type: "string", desc: "Locates existing customer account" },
    { key: "outstandingBalance", label: "Opening Udhaar Balance", required: true, type: "number", desc: "Balance to instantiate (₹)" }
  ],
  supplier_opening: [
    { key: "phone", label: "Supplier Phone", required: true, type: "string", desc: "Locates existing supplier account" },
    { key: "outstandingBalance", label: "Opening Outstanding Due", required: true, type: "number", desc: "Due value to instantiate (₹)" }
  ]
};

// Generates and downloads template with mock rows programmatically
const generateTemplate = (entityId) => {
  const schema = ENTITY_SCHEMAS[entityId];
  if (!schema) return;

  const headers = schema.map(f => f.label);
  
  // Custom mock rows for professional onboarding guidance
  let mockRow1 = {};
  let mockRow2 = {};

  if (entityId === "customers") {
    mockRow1 = { "Customer Name": "Rajesh Kumar", "Phone Number": "9876543210", "Email Address": "rajesh.kumar@gmail.com", "Outstanding Balance": 1500, "Credit Limit": 50000, "Membership Tier": "Gold", "GSTIN": "27AAAAA1111A1Z1" };
    mockRow2 = { "Customer Name": "Sunita Sharma", "Phone Number": "9123456789", "Email Address": "sunita@sharma.co.in", "Outstanding Balance": 0, "Credit Limit": 20000, "Membership Tier": "Regular", "GSTIN": "" };
  } else if (entityId === "suppliers") {
    mockRow1 = { "Supplier Name": "Hindustan Distributors", "Contact Phone": "9812345678", "Email Address": "orders@hindustan.com", "Outstanding Balance": 8400, "GSTIN": "27BBBBB2222B2Z2" };
    mockRow2 = { "Supplier Name": "Apex Pharma Logistics", "Contact Phone": "9922334455", "Email Address": "apex@pharma.in", "Outstanding Balance": 0, "GSTIN": "" };
  } else if (entityId === "products") {
    mockRow1 = { "Product Name": "Paracetamol 650mg Tabletten", "SKU Code": "PARA-650", "Barcode": "8901043001224", "Category": "Pharmacy", "Purchase Price": 12.5, "Sale Price": 18.0, "GST Percent": "12", "Stock Quantity": 120, "Min Stock Limit": 25, "Unit of Measure": "strip" };
    mockRow2 = { "Product Name": "N95 Medical Face Mask", "SKU Code": "MASK-N95", "Barcode": "8902045006611", "Category": "Hardware", "Purchase Price": 45.0, "Sale Price": 85.0, "GST Percent": "5", "Stock Quantity": 300, "Min Stock Limit": 50, "Unit of Measure": "pcs" };
  } else if (entityId === "inventory") {
    mockRow1 = { "SKU Code": "PARA-650", "Stock Adjustment": 150, "Min Stock Level": 30 };
    mockRow2 = { "SKU Code": "MASK-N95", "Stock Adjustment": 20, "Min Stock Level": 45 };
  } else if (entityId === "bills") {
    mockRow1 = { "Invoice Number": "INV-2026-0001", "Invoice Date": "2026-07-20", "Customer Name": "Rajesh Kumar", "Customer Phone": "9876543210", "Grand Total": 2400.0, "Paid Amount": 2400.0, "Payment Status": "Paid", "Payment Method": "UPI" };
    mockRow2 = { "Invoice Number": "INV-2026-0002", "Invoice Date": "2026-07-21", "Customer Name": "Sunita Sharma", "Customer Phone": "9123456789", "Grand Total": 850.0, "Paid Amount": 200.0, "Payment Status": "Partial", "Payment Method": "Cash" };
  } else if (entityId === "khata") {
    mockRow1 = { "Customer Name": "Rajesh Kumar", "Payment Amount": 1500, "Date Transaction": "2026-07-20", "Payment Method": "Cash", "Notes": "Settled outstanding invoice dues" };
    mockRow2 = { "Customer Name": "Sunita Sharma", "Payment Amount": 500, "Date Transaction": "2026-07-21", "Payment Method": "UPI", "Notes": "Partial credit payment received" };
  } else if (entityId === "expenses") {
    mockRow1 = { "Memo Description": "Office Electric Meter Bill", "Amount": 4200, "Date Paid": "2026-07-05", "Debit Expense Category": "Utilities", "Paid Via (Credit)": "Bank Account" };
    mockRow2 = { "Memo Description": "Godown Monthly Rent Contribution", "Amount": 18000, "Date Paid": "2026-07-01", "Debit Expense Category": "Rent Expense", "Paid Via (Credit)": "Cheque" };
  } else if (entityId === "employees") {
    mockRow1 = { "Staff Username": "subhash_mgr", "Full Name": "Subhash Chandra", "System Role": "Manager", "Phone Number": "9811002233", "Email Address": "subhash@elevate.com", "Monthly Salary": 45000, "Attendance Rate": 100 };
    mockRow2 = { "Staff Username": "pooja_billing", "Full Name": "Pooja Verma", "System Role": "Cashier", "Phone Number": "9955441100", "Email Address": "pooja@elevate.com", "Monthly Salary": 18000, "Attendance Rate": 95 };
  } else if (entityId === "attendance") {
    mockRow1 = { "Employee Username": "subhash_mgr", "Log Date": "2026-07-20", "Roster Status": "Present", "Check-in Time": "09:12", "Check-out Time": "18:04" };
    mockRow2 = { "Employee Username": "pooja_billing", "Log Date": "2026-07-20", "Roster Status": "Present", "Check-in Time": "08:55", "Check-out Time": "18:00" };
  } else if (entityId === "categories") {
    mockRow1 = { "Category Name": "Pharmacy" };
    mockRow2 = { "Category Name": "Organic Food" };
  } else if (entityId === "customer_opening") {
    mockRow1 = { "Customer Phone": "9876543210", "Opening Udhaar Balance": 4500 };
    mockRow2 = { "Customer Phone": "9123456789", "Opening Udhaar Balance": 120 };
  } else if (entityId === "supplier_opening") {
    mockRow1 = { "Supplier Phone": "9812345678", "Opening Outstanding Due": 9200 };
    mockRow2 = { "Supplier Phone": "9922334455", "Opening Outstanding Due": 50 };
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet([mockRow1, mockRow2]);
  XLSX.utils.book_append_sheet(wb, ws, "Onboarding Template");

  // Output as XLSX
  XLSX.writeFile(wb, `Elevate_${entityId}_template.xlsx`);
};

// CSV Immunization helper to shield from formula injection attacks (OWASP compliance)
const immunizeValue = (val) => {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
    return `'` + str; // Prefix with escape quote to neutralize Excel execution triggers
  }
  return str;
};

export default function ImportExportModule({
  db,
  setDb,
  activeBusinessId,
  activeBusiness,
  preselectedEntity,
  clearPreselect,
  addNotification,
  currentUserRole,
  currentUser
}) {
  
  // Primary Tabs: "wizard" (Guided Data Migration Wizard), "manual" (Direct Manual Controls), "history" (Logs & Audit Trials)
  const [activeTab, setActiveTab] = useState("wizard");

  // Multi-tenant isolation locking
  const isOwnerOrCoOwner = currentUserRole === EmployeeRole.OWNER || currentUserRole === EmployeeRole.CO_OWNER;

  // Audit history state loaded dynamically from db
  const localHistory = db.auditLogs.filter((l) => 
    l.business_id === activeBusinessId && 
    (l.action.toLowerCase().includes("import") || l.action.toLowerCase().includes("export"))
  );

  // -------------------------------------------------------------
  // GUIDED DATA MIGRATION WIZARD STATE
  // -------------------------------------------------------------
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardEntity, setWizardEntity] = useState("customers");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileHeaders, setUploadedFileHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMappings, setColumnMappings] = useState({}); // Db Field -> Excel Column Name
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicatePolicy, setDuplicatePolicy] = useState("skip");
  const [importSummary, setImportSummary] = useState(null);

  // File drag state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Pre-selection listener
  useEffect(() => {
    if (preselectedEntity) {
      const match = ENTITIES.find(e => e.id === preselectedEntity);
      if (match) {
        setWizardEntity(preselectedEntity);
        setWizardStep(1);
        setActiveTab("wizard");
        addNotification(`Onboarding Migration Wizard initialized for ${match.label}.`, "success");
        if (clearPreselect) clearPreselect();
      }
    }
  }, [preselectedEntity, clearPreselect]);

  // Manual Employee Addition Modal State
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "Staff",
    phone: "",
    email: "",
    salary: ""
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.username.trim() || !employeeForm.password.trim() || !employeeForm.phone.trim()) {
      addNotification("Please fill in Name, Username, Access Password, and Phone Number.", "error");
      return;
    }

    if (employeeForm.password.trim().length < 4) {
      addNotification("Access Password / PIN must be at least 4 characters.", "error");
      return;
    }

    const cleanUsername = employeeForm.username.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check if username already exists in local DB
    const exists = (db.users || []).some(u => u.username === cleanUsername);
    if (exists) {
      addNotification(`Username @${cleanUsername} already exists. Please use a unique handle.`, "error");
      return;
    }

    setIsSubmittingEmployee(true);

    try {
      const token = localStorage.getItem("bharatbiz_token") || "";
      const res = await fetch(`${API_BASE_URL}/api/auth/add-employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: employeeForm.password.trim(),
          name: employeeForm.name.trim(),
          role: employeeForm.role,
          phone: employeeForm.phone.trim(),
          email: employeeForm.email.trim(),
          salary: Number(employeeForm.salary) || 0
        })
      });

      let backendSuccess = false;
      let createdUserObj = null;

      if (res.ok) {
        const data = await res.json();
        backendSuccess = true;
        createdUserObj = data.user || data.employee;
      }

      const newEmp = {
        id: createdUserObj?.id || `user-${Date.now()}`,
        businessId: activeBusinessId,
        username: cleanUsername,
        name: employeeForm.name.trim(),
        role: employeeForm.role,
        phone: employeeForm.phone.trim(),
        email: employeeForm.email.trim(),
        salary: Number(employeeForm.salary) || 0,
        attendanceRate: 100,
        incentiveEarned: 0,
        password: employeeForm.password.trim()
      };

      setDb(prev => ({
        ...prev,
        users: [...(prev.users || []).filter(u => u.username !== cleanUsername), newEmp],
        auditLogs: [
          {
            id: `audit-${Date.now()}`,
            business_id: activeBusinessId,
            username: currentUserRole || "owner",
            action: "Manual Employee Added",
            details: `Added employee ${newEmp.name} (@${newEmp.username}) with role '${newEmp.role}' and login password to workspace ${activeBusinessId}.`,
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
          },
          ...(prev.auditLogs || [])
        ]
      }));

      addNotification(`Employee ${newEmp.name} (@${newEmp.username}) created! They can now log in to store workspace '${activeBusiness?.name || activeBusinessId}' with password.`, "success");
      setShowAddEmployeeModal(false);
      setEmployeeForm({
        name: "",
        username: "",
        password: "",
        role: "Staff",
        phone: "",
        email: "",
        salary: ""
      });
    } catch (err) {
      console.error("Error creating employee account:", err);
      // Fallback local save if network error occurs
      const newEmp = {
        id: `user-${Date.now()}`,
        businessId: activeBusinessId,
        username: cleanUsername,
        name: employeeForm.name.trim(),
        role: employeeForm.role,
        phone: employeeForm.phone.trim(),
        email: employeeForm.email.trim(),
        salary: Number(employeeForm.salary) || 0,
        attendanceRate: 100,
        incentiveEarned: 0,
        password: employeeForm.password.trim()
      };

      setDb(prev => ({
        ...prev,
        users: [...(prev.users || []).filter(u => u.username !== cleanUsername), newEmp],
        auditLogs: [
          {
            id: `audit-${Date.now()}`,
            business_id: activeBusinessId,
            username: currentUserRole || "owner",
            action: "Manual Employee Added (Offline)",
            details: `Added employee ${newEmp.name} (@${newEmp.username}) with role '${newEmp.role}' to workspace ${activeBusinessId}.`,
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
          },
          ...(prev.auditLogs || [])
        ]
      }));

      addNotification(`Employee ${newEmp.name} (@${cleanUsername}) added to local workspace!`, "success");
      setShowAddEmployeeModal(false);
      setEmployeeForm({
        name: "",
        username: "",
        password: "",
        role: "Staff",
        phone: "",
        email: "",
        salary: ""
      });
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  // Reset wizard handler
  const resetWizard = () => {
    setWizardStep(1);
    setUploadedFile(null);
    setUploadedFileName("");
    setUploadedFileHeaders([]);
    setParsedRows([]);
    setColumnMappings({});
    setValidationErrors([]);
    setDuplicatePolicy("skip");
    setImportSummary(null);
  };

  // -------------------------------------------------------------
  // VALIDATION & PARSING ENGINES
  // -------------------------------------------------------------

  // Force file and size verification
  const handleFileChange = (file) => {
    if (!file) return;
    
    // File size restriction: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addNotification("Upload rejected: File size exceeds secure limit of 5MB.", "error");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls" && ext !== "csv") {
      addNotification("Invalid file type: Please upload a standard Excel (.xlsx, .xls) or CSV file.", "error");
      return;
    }

    setUploadedFile(file);
    setUploadedFileName(file.name);
    parseUploadedFile(file);
  };

  // Automated Column Detection Heuristic Matcher
  const autoDetectMappings = (headers) => {
    const schemaFields = ENTITY_SCHEMAS[wizardEntity];
    const initialMap = {};

    schemaFields.forEach(f => {
      // Heuristic 1: Exact case-insensitive match on key or label
      let matchedHeader = headers.find(h => 
        h.toLowerCase() === f.key.toLowerCase() || 
        h.toLowerCase() === f.label.toLowerCase()
      );

      // Heuristic 2: Substring inclusion
      if (!matchedHeader) {
        matchedHeader = headers.find(h => 
          h.toLowerCase().includes(f.key.toLowerCase()) || 
          f.key.toLowerCase().includes(h.toLowerCase()) ||
          h.toLowerCase().includes(f.label.toLowerCase()) ||
          f.label.toLowerCase().includes(h.toLowerCase())
        );
      }

      // Heuristic 3: Synonym lists for common SME field keys
      if (!matchedHeader) {
        const keyLower = f.key.toLowerCase();
        let synonyms = [];

        if (keyLower === "phone") {
          synonyms = ["mobile", "whatsapp", "contact", "phone", "number", "tel", "cell", "contact number", "phone number"];
        } else if (keyLower === "email") {
          synonyms = ["email", "e-mail", "mail", "address"];
        } else if (keyLower === "outstandingbalance") {
          synonyms = ["outstanding", "balance", "udhaar", "due", "pending", "amount due", "debit", "credit"];
        } else if (keyLower === "creditlimit") {
          synonyms = ["limit", "credit limit", "ceiling", "max credit"];
        } else if (keyLower === "membershiptier") {
          synonyms = ["tier", "membership", "category", "class", "group", "loyalty"];
        } else if (keyLower === "name") {
          synonyms = ["name", "customer", "supplier", "vendor", "client", "person", "full name", "company"];
        } else if (keyLower === "sku") {
          synonyms = ["sku", "code", "item code", "id", "product code", "item_code"];
        } else if (keyLower === "barcode") {
          synonyms = ["barcode", "upc", "ean", "scan"];
        } else if (keyLower === "category") {
          synonyms = ["category", "type", "group", "class", "product category", "dept", "department"];
        } else if (keyLower === "purchaseprice") {
          synonyms = ["purchase", "cost", "buy", "purchase price", "cost price", "purchase_price", "buy_price"];
        } else if (keyLower === "saleprice") {
          synonyms = ["sale", "selling", "price", "sale price", "mrp", "sale_price", "retail"];
        } else if (keyLower === "gstpercent") {
          synonyms = ["gst", "tax", "gst percent", "gst%", "percent", "tax_percent"];
        } else if (keyLower === "stock") {
          synonyms = ["stock", "quantity", "qty", "count", "on hand", "opening stock", "stock_qty"];
        } else if (keyLower === "minstocklevel") {
          synonyms = ["min", "minimum", "reorder", "alert", "threshold", "min_stock"];
        } else if (keyLower === "unit") {
          synonyms = ["unit", "uom", "measure", "unit of measure"];
        } else if (keyLower === "date") {
          synonyms = ["date", "created", "timestamp", "invoice date", "bill date", "date paid"];
        } else if (keyLower === "totalamount") {
          synonyms = ["total", "grand total", "net", "amount", "total_amount", "bill amount"];
        } else if (keyLower === "paidamount") {
          synonyms = ["paid", "received", "amount paid", "cash", "paid_amount"];
        } else if (keyLower === "paymentstatus") {
          synonyms = ["status", "payment status", "paid status", "payment_status"];
        } else if (keyLower === "paymentmethod") {
          synonyms = ["method", "mode", "payment method", "pay via", "payment_method"];
        } else if (keyLower === "description") {
          synonyms = ["description", "notes", "memo", "desc", "details", "item desc"];
        }

        matchedHeader = headers.find(h => 
          synonyms.some(syn => h.toLowerCase() === syn || h.toLowerCase().includes(syn))
        );
      }

      if (matchedHeader) {
        initialMap[f.key] = matchedHeader;
      }
    });

    setColumnMappings(initialMap);
  };

  // Robust parsing of CSV (via PapaParse) and Excel XLSX/XLS (via SheetJS)
  const parseUploadedFile = (file) => {
    if (file.name.endsWith(".csv")) {
      // Parse CSV asynchronously using PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => {
          try {
            const rows = results.data;
            const headers = results.meta.fields || [];

            if (headers.length === 0 || rows.length === 0) {
              addNotification("Parsing complete: Zero data records detected in CSV.", "error");
              return;
            }

            // Filter out empty headers
            const cleanedHeaders = headers.filter(h => h && h.trim() !== "");

            setUploadedFileHeaders(cleanedHeaders);
            setParsedRows(rows);
            
            // Auto-detect mappings based on heuristics & synonyms
            autoDetectMappings(cleanedHeaders);

            // Move to column mapping step
            setWizardStep(3);
            addNotification(`Parsed CSV file "${file.name}" with ${rows.length} records successfully using PapaParse.`, "success");
          } catch (err) {
            console.error("CSV PapaParse Process Error:", err);
            addNotification(`Failure during CSV parsing: ${err.message || err}`, "error");
          }
        },
        error: (err) => {
          console.error("PapaParse error:", err);
          addNotification(`PapaParse failed: ${err.message}`, "error");
        }
      });
    } else {
      // Parse Excel XLSX/XLS using SheetJS
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("File stream could not be loaded.");

          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (json.length === 0) {
            addNotification("Parsing complete: Zero data records detected in sheet.", "error");
            return;
          }

          // Get headers from first row keys
          const headers = Object.keys(json[0]);
          if (headers.length === 0) {
            addNotification("Parsing complete: Zero headers detected in sheet.", "error");
            return;
          }

          const cleanedHeaders = headers.filter(h => h && h.trim() !== "");

          setUploadedFileHeaders(cleanedHeaders);
          setParsedRows(json);
          
          // Auto-detect mappings based on heuristics & synonyms
          autoDetectMappings(cleanedHeaders);

          // Move to column mapping step
          setWizardStep(3);
          addNotification(`Parsed Excel file "${file.name}" with ${json.length} rows successfully using SheetJS.`, "success");

        } catch (err) {
          console.error("Excel SheetJS Parse Error:", err);
          addNotification(`Failure during Excel parsing: ${err.message || "Unrecognized excel structure."}`, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Perform interactive validation on mapped data rows
  const validateMappedData = () => {
    const schema = ENTITY_SCHEMAS[wizardEntity];
    const errors = [];

    parsedRows.forEach((row, rowIdx) => {
      schema.forEach(field => {
        const mappedColName = columnMappings[field.key];
        const val = mappedColName ? row[mappedColName] : undefined;
        const strVal = val !== undefined && val !== null ? String(val).trim() : "";

        // Check required fields
        if (field.required && !strVal) {
          errors.push({
            rowIdx: rowIdx + 1,
            field: field.label,
            error: "This field is required but is currently empty.",
            level: "error"
          });
        }

        // Field value specific type checking
        if (strVal) {
          if (field.type === "number" && isNaN(Number(strVal))) {
            errors.push({
              rowIdx: rowIdx + 1,
              field: field.label,
              error: `Invalid numeric value "${strVal}". Must be a number.`,
              level: "error"
            });
          }

          if (field.type === "date" && isNaN(Date.parse(strVal))) {
            errors.push({
              rowIdx: rowIdx + 1,
              field: field.label,
              error: `Invalid date "${strVal}". Use YYYY-MM-DD or standard format.`,
              level: "error"
            });
          }

          if (field.type === "select" && field.options && !field.options.map(o => o.toLowerCase()).includes(strVal.toLowerCase())) {
            errors.push({
              rowIdx: rowIdx + 1,
              field: field.label,
              error: `Value "${strVal}" is not in allowed list: (${field.options.join(", ")}).`,
              level: "warning"
            });
          }

          // Custom sanitization rules
          if (field.key === "phone" && !/^\+?[0-9\s-]{10,14}$/.test(strVal)) {
            errors.push({
              rowIdx: rowIdx + 1,
              field: field.label,
              error: `Potential warning: Contact number "${strVal}" might not be a valid 10-digit phone format.`,
              level: "warning"
            });
          }
        }
      });
    });

    setValidationErrors(errors);
    setWizardStep(4);
    addNotification("Data validation pipeline executed completely.", "success");
  };

  // Final commit of parsed and mapped rows with duplicate checks & tenant isolation
  const handleWizardCommit = () => {
    const hasFatalErrors = validationErrors.some(e => e.level === "error");
    if (hasFatalErrors) {
      addNotification("Cannot commit data: Resolve the fatal errors highlighted in red first.", "error");
      return;
    }

    const schema = ENTITY_SCHEMAS[wizardEntity];
    let successCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    setDb((prevDb) => {
      // Clones of the relevant collection arrays
      let customersCopy = [...(prevDb.customers || [])];
      let suppliersCopy = [...(prevDb.suppliers || [])];
      let productsCopy = [...(prevDb.products || [])];
      let usersCopy = [...(prevDb.users || [])];
      let billsCopy = [...(prevDb.bills || [])];
      let khataCopy = [...(prevDb.khata || [])];
      let journalCopy = [...(prevDb.journal || [])];
      let auditCopy = [...(prevDb.auditLogs || [])];

      // Custom helper for resolving product customProductTypes mapping
      let customTypesCopy = prevDb.businesses[0]?.customProductTypes ? [...prevDb.businesses[0].customProductTypes] : [];
      let enabledTypesCopy = prevDb.businesses[0]?.enabledProductTypes ? [...prevDb.businesses[0].enabledProductTypes] : [];

      parsedRows.forEach((row, rowIdx) => {
        try {
          // Map uploaded row to our strict DB record format using column mappings
          const mappedRecord = {
            id: "", // Calculated below
            tenant_id: "tenant-main",
            business_id: activeBusinessId,
            created_by: currentUser?.id || "user-1",
            updated_by: currentUser?.id || "user-1"
          };

          schema.forEach(field => {
            const mappedCol = columnMappings[field.key];
            const rawVal = mappedCol ? row[mappedCol] : undefined;
            
            // Format types
            if (rawVal !== undefined && rawVal !== null) {
              const strVal = String(rawVal).trim();
              if (field.type === "number") {
                mappedRecord[field.key] = Number(strVal) || 0;
              } else if (field.type === "date") {
                // Ensure correct ISO formatting or simple YYYY-MM-DD
                const parsedDate = new Date(strVal);
                mappedRecord[field.key] = !isNaN(parsedDate.getTime()) 
                  ? parsedDate.toISOString().split('T')[0] 
                  : new Date().toISOString().split('T')[0];
              } else {
                // Immunize string variables against Formula Injection
                mappedRecord[field.key] = immunizeValue(rawVal);
              }
            } else {
              // Defaults
              mappedRecord[field.key] = field.type === "number" ? 0 : "";
            }
          });

          // Perform specific entity insertions
          if (wizardEntity === "customers") {
            const existingIdx = customersCopy.findIndex(c => c.phone === mappedRecord.phone && c.business_id === activeBusinessId);
            if (existingIdx > -1) {
              if (duplicatePolicy === "skip") {
                skippedCount++;
                return;
              } else if (duplicatePolicy === "overwrite") {
                customersCopy[existingIdx] = { ...customersCopy[existingIdx], ...mappedRecord, id: customersCopy[existingIdx].id, updated_by: currentUser.id };
                updatedCount++;
                return;
              }
            }
            mappedRecord.id = "cust-" + (Date.now() + rowIdx);
            mappedRecord.outstandingBalance = Number(mappedRecord.outstandingBalance) || 0;
            mappedRecord.creditLimit = Number(mappedRecord.creditLimit) || 50000;
            mappedRecord.membershipTier = mappedRecord.membershipTier || "Regular";
            customersCopy.push(mappedRecord);
            successCount++;

          } else if (wizardEntity === "suppliers") {
            const existingIdx = suppliersCopy.findIndex(s => s.phone === mappedRecord.phone && s.business_id === activeBusinessId);
            if (existingIdx > -1) {
              if (duplicatePolicy === "skip") {
                skippedCount++;
                return;
              } else if (duplicatePolicy === "overwrite") {
                suppliersCopy[existingIdx] = { ...suppliersCopy[existingIdx], ...mappedRecord, id: suppliersCopy[existingIdx].id, updated_by: currentUser.id };
                updatedCount++;
                return;
              }
            }
            mappedRecord.id = "supp-" + (Date.now() + rowIdx);
            mappedRecord.outstandingBalance = Number(mappedRecord.outstandingBalance) || 0;
            suppliersCopy.push(mappedRecord);
            successCount++;

          } else if (wizardEntity === "products") {
            const existingIdx = productsCopy.findIndex(p => p.sku === mappedRecord.sku && p.business_id === activeBusinessId);
            if (existingIdx > -1) {
              if (duplicatePolicy === "skip") {
                skippedCount++;
                return;
              } else if (duplicatePolicy === "overwrite") {
                productsCopy[existingIdx] = { ...productsCopy[existingIdx], ...mappedRecord, id: productsCopy[existingIdx].id, updated_by: currentUser.id };
                updatedCount++;
                return;
              }
            }
            mappedRecord.id = "prod-" + (Date.now() + rowIdx);
            mappedRecord.barcode = mappedRecord.barcode || "";
            mappedRecord.qrCode = mappedRecord.sku ? `QR-${mappedRecord.sku}` : "";
            mappedRecord.gstPercent = Number(mappedRecord.gstPercent) || 18;
            mappedRecord.stock = Number(mappedRecord.stock) || 0;
            mappedRecord.minStockLevel = Number(mappedRecord.minStockLevel) || 10;
            mappedRecord.unit = mappedRecord.unit || "pcs";
            mappedRecord.warehouseId = "wh-1";
            productsCopy.push(mappedRecord);
            successCount++;

          } else if (wizardEntity === "inventory") {
            // Find existing product SKU
            const existingIdx = productsCopy.findIndex(p => p.sku === mappedRecord.sku && p.business_id === activeBusinessId);
            if (existingIdx > -1) {
              // Opening stock adjustment (Absolute overwrite for simplicity/accuracy)
              productsCopy[existingIdx].stock = Number(mappedRecord.stock);
              if (mappedRecord.minStockLevel) {
                productsCopy[existingIdx].minStockLevel = Number(mappedRecord.minStockLevel);
              }
              updatedCount++;
            } else {
              skippedCount++; // Cannot adjust stock for non-existent SKU
            }

          } else if (wizardEntity === "bills") {
            const existingIdx = billsCopy.findIndex(b => b.invoiceNumber === mappedRecord.invoiceNumber && b.business_id === activeBusinessId);
            if (existingIdx > -1) {
              if (duplicatePolicy === "skip") {
                skippedCount++;
                return;
              } else if (duplicatePolicy === "overwrite") {
                billsCopy[existingIdx] = { ...billsCopy[existingIdx], ...mappedRecord, id: billsCopy[existingIdx].id };
                updatedCount++;
                return;
              }
            }
            mappedRecord.id = "bill-" + (Date.now() + rowIdx);
            mappedRecord.items = []; // Historical imports have blank itemized breakdown
            mappedRecord.cgstAmount = Math.round(mappedRecord.totalAmount * 0.09);
            mappedRecord.sgstAmount = Math.round(mappedRecord.totalAmount * 0.09);
            mappedRecord.igstAmount = 0;
            mappedRecord.paymentMethod = mappedRecord.paymentMethod || "UPI";
            billsCopy.push(mappedRecord);
            successCount++;

          } else if (wizardEntity === "khata") {
            mappedRecord.id = "khata-" + (Date.now() + rowIdx);
            mappedRecord.paymentMethod = mappedRecord.paymentMethod || "Cash";
            khataCopy.push(mappedRecord);
            
            // Reconcile client's balance in CRM if exists
            const client = customersCopy.find(c => c.name.toLowerCase() === mappedRecord.customerName.toLowerCase() && c.business_id === activeBusinessId);
            if (client) {
              client.outstandingBalance = Math.max(0, client.outstandingBalance - Number(mappedRecord.amount));
            }
            successCount++;

          } else if (wizardEntity === "expenses") {
            // Expenses map to Accounting journal double entries
            mappedRecord.id = "log-" + (Date.now() + rowIdx);
            const journalItem = {
              id: "journal-" + (Date.now() + rowIdx),
              tenant_id: "tenant-main",
              business_id: activeBusinessId,
              date: mappedRecord.date,
              description: mappedRecord.description,
              debitAccount: mappedRecord.debitAccount, // Expense account
              creditAccount: mappedRecord.creditAccount || "Cash", // Asset paid with
              amount: Number(mappedRecord.amount)
            };
            journalCopy.push(journalItem);
            successCount++;

          } else if (wizardEntity === "employees") {
            const existingIdx = usersCopy.findIndex(u => u.username === mappedRecord.username && u.businessId === activeBusinessId);
            if (existingIdx > -1) {
              if (duplicatePolicy === "skip") {
                skippedCount++;
                return;
              } else if (duplicatePolicy === "overwrite") {
                usersCopy[existingIdx] = { ...usersCopy[existingIdx], ...mappedRecord, id: usersCopy[existingIdx].id };
                updatedCount++;
                return;
              }
            }
            mappedRecord.id = "user-" + (Date.now() + rowIdx);
            mappedRecord.businessId = activeBusinessId;
            mappedRecord.salary = Number(mappedRecord.salary) || 20000;
            mappedRecord.attendanceRate = Number(mappedRecord.attendanceRate) || 100;
            mappedRecord.incentiveEarned = 0;
            usersCopy.push(mappedRecord);
            successCount++;

          } else if (wizardEntity === "attendance") {
            // Map employee log
            mappedRecord.id = "att-" + (Date.now() + rowIdx);
            // Verify employee username exists
            const userExists = usersCopy.some(u => u.username === mappedRecord.employeeUsername && u.businessId === activeBusinessId);
            if (userExists) {
              if (!prevDb.attendanceLogs) prevDb.attendanceLogs = [];
              // Standard push
              prevDb.attendanceLogs.push({
                id: mappedRecord.id,
                businessId: activeBusinessId,
                employeeUsername: mappedRecord.employeeUsername,
                date: mappedRecord.date,
                status: mappedRecord.status,
                checkIn: mappedRecord.checkIn || "09:00",
                checkOut: mappedRecord.checkOut || "18:00"
              });
              successCount++;
            } else {
              failedCount++;
            }

          } else if (wizardEntity === "categories") {
            const catName = mappedRecord.name;
            if (catName) {
              if (!customTypesCopy.includes(catName)) {
                customTypesCopy.push(catName);
              }
              if (!enabledTypesCopy.includes(catName)) {
                enabledTypesCopy.push(catName);
              }
              successCount++;
            } else {
              failedCount++;
            }

          } else if (wizardEntity === "customer_opening") {
            // Find existing customer by phone
            const clientIdx = customersCopy.findIndex(c => c.phone === mappedRecord.phone && c.business_id === activeBusinessId);
            if (clientIdx > -1) {
              customersCopy[clientIdx].outstandingBalance = Number(mappedRecord.outstandingBalance);
              updatedCount++;
            } else {
              failedCount++;
            }

          } else if (wizardEntity === "supplier_opening") {
            // Find existing supplier by phone
            const supplierIdx = suppliersCopy.findIndex(s => s.phone === mappedRecord.phone && s.business_id === activeBusinessId);
            if (supplierIdx > -1) {
              suppliersCopy[supplierIdx].outstandingBalance = Number(mappedRecord.outstandingBalance);
              updatedCount++;
            } else {
              failedCount++;
            }
          }

        } catch (e) {
          console.error("Row parsing exception: ", e);
          failedCount++;
        }
      });

      // Write local multi-tenant Audit Log entry to system logs
      const auditLogItem = {
        id: "log-audit-" + Date.now(),
        tenant_id: "tenant-main",
        business_id: activeBusinessId,
        action: `Import ${wizardEntity.toUpperCase()}`,
        userId: currentUser?.id || "user-1",
        username: currentUser?.username || "owner",
        details: `Imported parsed file "${uploadedFileName}". Outcomes: ${successCount} successfully created, ${updatedCount} overwritten, ${skippedCount} skipped, ${failedCount} failures. Duplicate policy used: ${duplicatePolicy}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      auditCopy.unshift(auditLogItem);

      // Return fully locked multi-tenant state safely updated!
      return {
        ...prevDb,
        customers: customersCopy,
        suppliers: suppliersCopy,
        products: productsCopy,
        users: usersCopy,
        bills: billsCopy,
        khata: khataCopy,
        journal: journalCopy,
        auditLogs: auditCopy,
        businesses: prevDb.businesses.map((b) => 
          b.id === activeBusinessId 
            ? { ...b, customProductTypes: customTypesCopy, enabledProductTypes: enabledTypesCopy } 
            : b
        )
      };
    });

    // Batch upsert to Supabase cloud database
    try {
      if (wizardEntity === "products" || wizardEntity === "inventory") {
        upsertProducts(parsedRows.map(r => ({ ...r, business_id: activeBusinessId }))).catch(() => {});
      } else if (wizardEntity === "customers") {
        upsertCustomers(parsedRows.map(r => ({ ...r, business_id: activeBusinessId }))).catch(() => {});
      } else if (wizardEntity === "bills") {
        upsertTransactions(parsedRows.map(r => ({ ...r, business_id: activeBusinessId }))).catch(() => {});
      } else if (wizardEntity === "expenses") {
        upsertExpenses(parsedRows.map(r => ({ ...r, business_id: activeBusinessId }))).catch(() => {});
      }
    } catch (e) {
      console.warn("Supabase batch import error:", e);
    }

    setImportSummary({
      total: parsedRows.length,
      success: successCount,
      skipped: skippedCount,
      updated: updatedCount,
      failed: failedCount
    });
    setWizardStep(5);
    addNotification(`Data ingestion finished. Completed: ${successCount} items loaded.`, "success");
  };

  // -------------------------------------------------------------
  // DIRECT EXPORT ENGINES (SheetJS and jszip ZIP generation)
  // -------------------------------------------------------------
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [exportFilterRange, setExportFilterRange] = useState("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState({});

  // Initialize selected columns for direct exporter
  useEffect(() => {
    const schema = ENTITY_SCHEMAS[wizardEntity];
    if (schema) {
      const initialSelection = {};
      schema.forEach(field => {
        initialSelection[field.key] = true;
      });
      setSelectedColumns(initialSelection);
    }
  }, [wizardEntity]);

  const handleManualExport = (entityId) => {
    // Audit authorization
    const isAllowed = isOwnerOrCoOwner || ["Manager", "Accountant"].includes(currentUserRole);
    if (!isAllowed) {
      addNotification("Export Denied: Your employee role is restricted from exporting business records.", "error");
      return;
    }

    try {
      // Load source data strictly isolated by active business tenant id
      let rawData = [];
      if (entityId === "customers") {
        rawData = db.customers.filter((c) => c.business_id === activeBusinessId);
      } else if (entityId === "suppliers") {
        rawData = db.suppliers.filter((s) => s.business_id === activeBusinessId);
      } else if (entityId === "products") {
        rawData = db.products.filter((p) => p.business_id === activeBusinessId);
      } else if (entityId === "inventory") {
        rawData = db.products.filter((p) => p.business_id === activeBusinessId).map(p => ({
          sku: p.sku,
          name: p.name,
          category: p.category,
          stock: p.stock,
          valuationPrice: p.purchasePrice,
          totalValuation: p.stock * p.purchasePrice
        }));
      } else if (entityId === "bills") {
        rawData = db.bills.filter((b) => b.business_id === activeBusinessId);
      } else if (entityId === "khata") {
        rawData = db.khata.filter((k) => k.business_id === activeBusinessId);
      } else if (entityId === "expenses") {
        rawData = db.journal.filter((j) => j.business_id === activeBusinessId && j.debitAccount.toLowerCase().includes("expense"));
      } else if (entityId === "employees") {
        rawData = db.users.filter((u) => u.businessId === activeBusinessId);
      } else if (entityId === "attendance") {
        rawData = (db.attendanceLogs || []).filter((l) => l.businessId === activeBusinessId);
      } else if (entityId === "categories") {
        const bus = db.businesses.find((b) => b.id === activeBusinessId);
        rawData = (bus?.customProductTypes || []).map((c) => ({ name: c }));
      } else if (entityId === "customer_opening") {
        rawData = db.customers.filter((c) => c.business_id === activeBusinessId).map(c => ({
          name: c.name,
          phone: c.phone,
          outstandingBalance: c.outstandingBalance
        }));
      } else if (entityId === "supplier_opening") {
        rawData = db.suppliers.filter((s) => s.business_id === activeBusinessId).map(s => ({
          name: s.name,
          phone: s.phone,
          outstandingBalance: s.outstandingBalance
        }));
      }

      // Filter by Date where applicable
      if (exportFilterRange === "date" && exportStartDate && exportEndDate) {
        rawData = rawData.filter((row) => {
          const rDate = row.date || row.timestamp;
          if (!rDate) return true;
          return rDate >= exportStartDate && rDate <= exportEndDate;
        });
      }

      if (rawData.length === 0) {
        addNotification(`Export halted: No matching tenant records found for ${entityId}.`, "error");
        return;
      }

      // Apply Column Selection filter
      const schema = ENTITY_SCHEMAS[entityId] || [];
      const exportRows = rawData.map(record => {
        const item = {};
        
        // If categories, return name directly
        if (entityId === "categories") {
          return { "Category Name": record.name };
        }
        if (entityId === "inventory") {
          return {
            "SKU Code": record.sku,
            "Product Name": record.name,
            "Category Group": record.category,
            "On Hand Stock": record.stock,
            "Cost Price (₹)": record.valuationPrice,
            "Inventory Value (₹)": record.totalValuation
          };
        }

        schema.forEach(field => {
          if (selectedColumns[field.key] !== false) {
            // Apply csv security sanitation and immunize against triggers
            const value = record[field.key];
            item[field.label] = typeof value === "string" ? immunizeValue(value) : value;
          }
        });

        // Safe Fallback if schema doesn't fit standard fields
        if (Object.keys(item).length === 0) {
          Object.keys(record).forEach(k => {
            if (!["id", "tenant_id", "business_id", "created_by", "updated_by", "password"].includes(k)) {
              item[k] = record[k];
            }
          });
        }
        return item;
      });

      // Write to SheetJS workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(wb, ws, `${entityId.toUpperCase()}_Ledger`);

      const stamp = new Date().toISOString().split('T')[0];
      const filename = `Elevate_${entityId}_Export_${stamp}.${exportFormat}`;

      if (exportFormat === "csv") {
        XLSX.writeFile(wb, filename, { bookType: "csv" });
      } else {
        XLSX.writeFile(wb, filename, { bookType: "xlsx" });
      }

      // Log export operation in the central db Audit Logs
      setDb((prev) => {
        const log = {
          id: "log-audit-" + Date.now(),
          tenant_id: "tenant-main",
          business_id: activeBusinessId,
          action: `Export ${entityId.toUpperCase()}`,
          userId: currentUser?.id || "user-1",
          username: currentUser?.username || "owner",
          details: `Successfully exported ${exportRows.length} rows to ${filename}. Format: ${exportFormat.toUpperCase()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        return {
          ...prev,
          auditLogs: [log, ...prev.auditLogs]
        };
      });

      addNotification(`Export complete! Dispatched "${filename}" with ${exportRows.length} entries.`, "success");

    } catch (e) {
      console.error(e);
      addNotification(`Export failed: ${e.message}`, "error");
    }
  };

  // Generate ZIP of Complete Business Data (Multi-file secure backup)
  const handleExportCompleteBusinessZIP = async () => {
    // Check privilege
    if (!isOwnerOrCoOwner) {
      addNotification("Unauthorized: Complete business export requires Owner or Co-Owner authentication.", "error");
      return;
    }

    try {
      addNotification("Packaging complete business database into standard ZIP backup archive...", "success");
      const zip = new JSZip();

      // Gather collections strictly tenant isolated
      const exports = [
        { id: "customers", data: db.customers.filter((c) => c.business_id === activeBusinessId) },
        { id: "suppliers", data: db.suppliers.filter((s) => s.business_id === activeBusinessId) },
        { id: "products", data: db.products.filter((p) => p.business_id === activeBusinessId) },
        { id: "bills", data: db.bills.filter((b) => b.business_id === activeBusinessId) },
        { id: "khata", data: db.khata.filter((k) => k.business_id === activeBusinessId) },
        { id: "expenses", data: db.journal.filter((j) => j.business_id === activeBusinessId && j.debitAccount.toLowerCase().includes("expense")) },
        { id: "employees", data: db.users.filter((u) => u.businessId === activeBusinessId).map(({ password, ...u }) => u) }, // Strips passwords for maximum compliance
        { id: "attendance", data: (db.attendanceLogs || []).filter((l) => l.businessId === activeBusinessId) }
      ];

      exports.forEach(e => {
        if (e.data.length > 0) {
          const schema = ENTITY_SCHEMAS[e.id] || [];
          const rows = e.data.map((record) => {
            const row = {};
            schema.forEach(field => {
              row[field.label] = record[field.key] !== undefined ? immunizeValue(record[field.key]) : "";
            });
            if (Object.keys(row).length === 0) {
              Object.keys(record).forEach(k => {
                row[k] = record[k];
              });
            }
            return row;
          });

          // Convert to CSV string manually
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, "Backup");
          
          const csvString = XLSX.utils.sheet_to_csv(ws);
          zip.file(`Elevate_${e.id}_data.csv`, csvString);
        }
      });

      // Generate ZIP and trigger standard download
      const content = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().split('T')[0];
      const filename = `Elevate_BusinessBackup_${activeBusiness.name.replace(/\s+/g, '_')}_${stamp}.zip`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save Audit log entry
      setDb((prev) => {
        const log = {
          id: "log-audit-" + Date.now(),
          tenant_id: "tenant-main",
          business_id: activeBusinessId,
          action: "Backup ALL Data",
          userId: currentUser?.id || "user-1",
          username: currentUser?.username || "owner",
          details: `Dispatched complete multi-table encrypted zip backup containing core SME database sheets. Archive name: ${filename}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
        return {
          ...prev,
          auditLogs: [log, ...prev.auditLogs]
        };
      });

      addNotification("Complete business ZIP dispatched successfully. System backup recorded.", "success");

    } catch (e) {
      console.error(e);
      addNotification(`Failed to package ZIP: ${e.message}`, "error");
    }
  };

  // -------------------------------------------------------------
  // RENDER INTERFACES
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROL BAR CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-[#0F172A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="text-[#5C52FB] w-5 h-5" />
            <h2 className="text-lg font-black uppercase tracking-tight text-[#0F172A] font-sans">
              Tenant Import & Export Control Center
            </h2>
          </div>
          <p className="text-xs text-[#64748B] max-w-xl">
            A secure multi-tenant ledger management bridge. Bulk import, audit, migrate, and backup customers, items, inventories, bills, and accounting journal entries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all cursor-pointer shadow-2xs"
            title="Add staff member manually without CSV"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Add Employee Manually</span>
          </button>
          {[
            { id: "wizard", label: "Migration Wizard", icon: RefreshCw },
            { id: "manual", label: "Manual Direct Panel", icon: Settings },
            { id: "history", label: "Audit Trails & Logs", icon: History }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                id={`tab-btn-${t.id}`}
                key={t.id}
                onClick={() => { setActiveTab(t.id); if (t.id === "wizard") resetWizard(); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active 
                    ? "bg-[#5C52FB] text-white shadow-xs" 
                    : "bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTAINER BODY */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 min-h-[32rem] flex flex-col shadow-xs">

        {/* -------------------------------------------------------------
            TAB 1: GUIDED ONBOARDING MIGRATION WIZARD
            ------------------------------------------------------------- */}
        {activeTab === "wizard" && (
          <div className="flex-1 flex flex-col justify-between gap-6">
            
            {/* Steps Indicator Progress line */}
            <div className="flex items-center justify-between bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] max-w-4xl mx-auto w-full">
              {[
                { step: 1, label: "Select Entity" },
                { step: 2, label: "Get Template" },
                { step: 3, label: "Upload & Map" },
                { step: 4, label: "Validate & Resolve" },
                { step: 5, label: "Success Summary" }
              ].map((s, idx, arr) => (
                <React.Fragment key={s.step}>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all border ${
                      wizardStep === s.step 
                        ? "bg-[#5C52FB] text-white border-[#5C52FB] shadow-xs animate-pulse" 
                        : wizardStep > s.step 
                          ? "bg-slate-200 text-[#5C52FB] border-[#5C52FB]/40" 
                          : "bg-slate-100 text-slate-400 border-[#E2E8F0]"
                    }`}>
                      {wizardStep > s.step ? "✓" : s.step}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${wizardStep >= s.step ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 border-t border-dashed ${wizardStep > s.step ? "border-[#5C52FB]/40" : "border-[#E2E8F0]"} mx-4 hidden md:block`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content switches */}
            <div className="flex-1 py-4">

              {/* STEP 1: SELECT SOURCE DATATABLE */}
              {wizardStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center max-w-md mx-auto space-y-1">
                    <h3 className="font-extrabold text-[#0F172A] text-base">Select Target SME Entity</h3>
                    <p className="text-xs text-[#64748B] leading-normal">
                      What operational business data would you like to import into your current workspace?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                    {ENTITIES.map(e => {
                      const selected = wizardEntity === e.id;
                      const roleAllowed = e.requiredRoles.includes(currentUserRole) || isOwnerOrCoOwner;
                      return (
                        <div
                          id={`wizard-entity-${e.id}`}
                          key={e.id}
                          onClick={() => { if (roleAllowed) setWizardEntity(e.id); }}
                          className={`border rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer relative overflow-hidden group ${
                            selected 
                              ? "bg-purple-50/50 border-[#5C52FB] shadow-xs" 
                              : roleAllowed 
                                ? "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100" 
                                : "opacity-40 cursor-not-allowed bg-slate-100 border-[#E2E8F0]"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                            selected ? "bg-[#5C52FB] text-white" : "bg-white border border-[#E2E8F0] text-slate-600 group-hover:text-[#0F172A]"
                          }`}>
                            {e.label.charAt(0)}
                          </div>
                          <div className="space-y-1 overflow-hidden pr-4">
                            <h4 className="font-bold text-[#0F172A] text-xs truncate uppercase tracking-wider">{e.label}</h4>
                            <p className="text-[10px] text-[#64748B] leading-normal line-clamp-2">{e.desc}</p>
                          </div>
                          {!roleAllowed && (
                            <div className="absolute top-2 right-2 bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wide border border-rose-200 px-1.5 py-0.5 rounded-full">
                              Restricted
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: DOWNLOAD STANDARD EXCEL TEMPLATE */}
              {wizardStep === 2 && (() => {
                const entityMatch = ENTITIES.find(e => e.id === wizardEntity);
                const schema = ENTITY_SCHEMAS[wizardEntity];
                return (
                  <div className="max-w-2xl mx-auto space-y-6 text-center animate-fadeIn py-6">
                    <div className="w-16 h-16 bg-purple-50 border border-purple-200 rounded-full flex items-center justify-center mx-auto text-[#5C52FB] shadow-2xs">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#5C52FB] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full uppercase tracking-wider">
                        {entityMatch?.label} Template
                      </span>
                      <h3 className="font-extrabold text-[#0F172A] text-lg">Download Your Structural Template</h3>
                      <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                        To guarantee high-integrity ingestion without column mismatch, prepare your file using our dynamic template loaded with structural sample rows.
                      </p>
                    </div>

                    {wizardEntity === "employees" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-950">Add Employees Manually</p>
                            <p className="text-[11px] text-emerald-800">No need to upload CSV if you just want to add a single employee!</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddEmployeeModal(true)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>+ Add Manually Now</span>
                        </button>
                      </div>
                    )}

                    {/* Columns listing */}
                    <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 text-left space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] border-b border-[#E2E8F0] pb-2 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#5C52FB]" />
                        Mapped Headers Schema ({schema?.length} Columns)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {schema?.map(field => (
                          <div key={field.key} className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[10px] flex flex-col justify-between">
                            <span className="font-bold text-[#0F172A]">{field.label} {field.required && <strong className="text-rose-500">*</strong>}</span>
                            <span className="text-[9px] text-[#64748B] truncate" title={field.desc}>{field.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        id="btn-download-template"
                        onClick={() => generateTemplate(wizardEntity)}
                        className="btn-elevate-primary text-xs px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Excel Template (.xlsx)</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* STEP 3: INTERACTIVE FILE UPLOADER & COLUMN MAPPER */}
              {wizardStep === 3 && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                  
                  {/* Visual columns mapping matrix */}
                  <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                      <div>
                        <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-1.5">
                          <Layers className="text-[#5C52FB] w-4 h-4" />
                          Interactive Schema Mapper
                        </h4>
                        <p className="text-[11px] text-[#64748B] leading-normal mt-0.5">
                          Align your uploaded sheet headers with Elevate's database keys. Columns with matching terms are mapped automatically!
                        </p>
                      </div>
                      <div className="text-[10px] bg-white border border-[#E2E8F0] p-2 rounded-xl flex items-center gap-2 text-[#64748B]">
                        <span>Uploaded headers parsed:</span>
                        <span className="font-mono text-[#0F172A] font-bold">{uploadedFileHeaders.length} columns</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 max-h-[22rem] overflow-y-auto pr-1">
                      {ENTITY_SCHEMAS[wizardEntity].map(field => {
                        const mappedValue = columnMappings[field.key] || "";
                        return (
                          <div key={field.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-[#E2E8F0] hover:border-slate-300 transition-all">
                            {/* DB Key Label */}
                            <div className="md:col-span-5 space-y-1">
                              <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1">
                                {field.label}
                                {field.required && <strong className="text-rose-500 text-xs" title="Required field">*</strong>}
                              </span>
                              <p className="text-[9px] text-[#64748B] leading-normal">{field.desc}</p>
                            </div>

                            <div className="md:col-span-2 text-center text-[#94A3B8] hidden md:block">
                              <ChevronRight className="w-5 h-5 mx-auto text-[#94A3B8]" />
                            </div>

                            {/* Excel Source Field Select */}
                            <div className="md:col-span-5">
                              <select
                                id={`select-map-${field.key}`}
                                value={mappedValue}
                                onChange={(e) => setColumnMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className={`w-full px-3 py-2 border rounded-xl text-xs bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#5C52FB] ${
                                  mappedValue 
                                    ? "border-[#5C52FB] text-[#0F172A] font-semibold" 
                                    : field.required 
                                      ? "border-rose-300 text-rose-700 font-semibold" 
                                      : "border-[#E2E8F0] text-[#64748B]"
                                }`}
                              >
                                <option value="" className="text-slate-500">-- Choose Excel/CSV Column --</option>
                                {uploadedFileHeaders.map(col => (
                                  <option key={col} value={col} className="text-[#0F172A]">{col}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIEW & VALIDATION MATRIX */}
              {wizardStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
                        <ShieldCheck className="text-[#5C52FB] w-4.5 h-4.5" />
                        Preview & Validation Report
                      </h4>
                      <p className="text-[11px] text-[#64748B] leading-normal">
                        Pre-import compliance audit completed. Ensure rows are clear of fatal errors before continuing.
                      </p>
                    </div>

                    {/* Duplicate handling policy selection */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest block">Duplicate Entity Resolution</span>
                      <div className="flex gap-1.5 bg-white p-1.5 rounded-xl border border-[#E2E8F0]">
                        {[
                          { id: "skip", label: "Skip Row" },
                          { id: "overwrite", label: "Overwrite/Update" },
                          { id: "allow", label: "Allow Duplicates" }
                        ].map(p => (
                          <button
                            id={`policy-btn-${p.id}`}
                            key={p.id}
                            type="button"
                            onClick={() => setDuplicatePolicy(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              duplicatePolicy === p.id 
                                ? "bg-[#5C52FB] text-white shadow-2xs" 
                                : "text-slate-600 hover:text-[#0F172A]"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Validation alerts banner */}
                  {validationErrors.length > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Validation Warnings & Errors ({validationErrors.length} detected)
                      </h5>
                      <div className="max-h-[8.5rem] overflow-y-auto space-y-1.5 pr-2">
                        {validationErrors.map((err, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-lg text-[11px] flex justify-between items-start border ${
                              err.level === "error" 
                                ? "bg-white border-rose-200 text-rose-700" 
                                : "bg-white border-amber-200 text-amber-800"
                            }`}
                          >
                            <span>
                              <strong>Row {err.rowIdx}</strong> · <span>Column "{err.field}"</span>: {err.error}
                            </span>
                            <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black border ${
                              err.level === "error" ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}>
                              {err.level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span><strong>Data Structure Compliant:</strong> Zero format warnings or fatal schema issues were identified in this file. Ready to commit.</span>
                    </div>
                  )}

                  {/* Excel preview table mapping values to database fields */}
                  <div className="border border-[#E2E8F0] bg-white rounded-2xl overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-[#94A3B8]">
                      <span>Interactive Import Preview (Showing first 5 rows)</span>
                      <span className="text-[#0F172A] font-mono">Row Isolation: Force tenant_id = {activeBusinessId}</span>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left text-[#0F172A]">
                        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase font-bold text-[#94A3B8]">
                          <tr>
                            <th className="p-3 w-12 text-center">Row</th>
                            {ENTITY_SCHEMAS[wizardEntity].map(field => (
                              <th key={field.key} className="p-3 font-bold">{field.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                          {parsedRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 text-center text-[#94A3B8] font-bold font-sans">{idx + 1}</td>
                              {ENTITY_SCHEMAS[wizardEntity].map(field => {
                                const mappedCol = columnMappings[field.key];
                                const rawVal = mappedCol ? row[mappedCol] : "";
                                return (
                                  <td key={field.key} className="p-3 text-[#0F172A] truncate max-w-[12rem]">
                                    {rawVal !== undefined && rawVal !== null ? String(rawVal) : "-"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS & INGESTION SUMMARY */}
              {wizardStep === 5 && importSummary && (
                <div className="max-w-xl mx-auto text-center space-y-6 animate-fadeIn py-6">
                  <div className="w-16 h-16 bg-purple-50 border border-purple-200 rounded-full flex items-center justify-center mx-auto text-[#5C52FB] shadow-2xs animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#0F172A] text-lg">Ingestion Pipeline Finished!</h3>
                    <p className="text-xs text-[#64748B]">
                      Business data has been successfully mapped, isolated, audited, and committed to local state.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0]">
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-0.5">
                      <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-wide">Total Processed</span>
                      <span className="text-xl font-mono font-bold text-[#0F172A]">{importSummary.total}</span>
                    </div>

                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-0.5">
                      <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-wide">Successfully Loaded</span>
                      <span className="text-xl font-mono font-bold text-[#5C52FB]">{importSummary.success}</span>
                    </div>

                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-0.5">
                      <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-wide">Overwritten/Updated</span>
                      <span className="text-xl font-mono font-bold text-amber-600">{importSummary.updated}</span>
                    </div>

                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl space-y-0.5">
                      <span className="text-[9px] text-[#94A3B8] block font-bold uppercase tracking-wide">Skipped (Duplicate)</span>
                      <span className="text-xl font-mono font-bold text-[#64748B]">{importSummary.skipped}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      id="btn-wizard-restart"
                      onClick={resetWizard}
                      className="bg-[#F8FAFC] hover:bg-slate-200 border border-[#E2E8F0] text-[#0F172A] font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer"
                    >
                      Onboard More Data
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Navigation Footer controls */}
            {wizardStep < 5 && (
              <div className="border-t border-[#E2E8F0] pt-6 flex items-center justify-between gap-3 max-w-4xl mx-auto w-full">
                
                {/* Back / Left button */}
                <button
                  id="btn-wizard-back"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                  className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Direct Drag & Drop Zone if Step 2 is active */}
                {wizardStep === 2 && (
                  <div className="flex-1 max-w-md mx-auto">
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.length > 0) handleFileChange(e.dataTransfer.files[0]); }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isDragOver ? "border-[#5C52FB] bg-purple-50" : "border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100"
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => { if (e.target.files?.length > 0) handleFileChange(e.target.files[0]); }} 
                        className="hidden" 
                        accept=".xlsx,.xls,.csv"
                      />
                      <Upload className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Or drag file here / select to parse</span>
                    </div>
                  </div>
                )}

                {/* Next / Action button */}
                {wizardStep === 1 && (
                  <button
                    id="btn-wizard-next-step"
                    onClick={() => setWizardStep(2)}
                    className="btn-elevate-primary text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next: Get Template</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {wizardStep === 2 && (
                  <button
                    id="btn-wizard-upload-trigger"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-elevate-primary text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload & Map Sheet</span>
                  </button>
                )}

                {wizardStep === 3 && (
                  <button
                    id="btn-wizard-validate-trigger"
                    onClick={validateMappedData}
                    className="btn-elevate-primary text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Run Data Validation</span>
                  </button>
                )}

                {wizardStep === 4 && (
                  <button
                    id="btn-wizard-finalize-trigger"
                    onClick={handleWizardCommit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalize Secure Ingestion</span>
                  </button>
                )}

              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: DIRECT MANUAL IMPORT & EXPORT PANEL
            ------------------------------------------------------------- */}
        {activeTab === "manual" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Split Grid: Left is Import Actions, Right is Export Configurations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* LEFT COLUMN: MANUAL BULK INGESTIONS */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
                <div className="border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-1.5">
                    <Upload className="text-[#5C52FB] w-4.5 h-4.5" />
                    Instant Bulk Import Gateways
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-normal">
                    Directly trigger file uploads to feed databases immediately, bypassing steps. Enforces security isolation rules natively.
                  </p>
                </div>

                <div className="space-y-3">
                  {ENTITIES.map(e => {
                    const allowed = e.requiredRoles.includes(currentUserRole) || isOwnerOrCoOwner;
                    return (
                      <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-slate-300 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#0F172A] block uppercase tracking-wider">{e.label}</span>
                          <span className="text-[9px] text-[#64748B] block leading-normal">{e.desc}</span>
                        </div>

                        {allowed ? (
                          <div className="flex gap-2">
                            {e.id === "employees" && (
                              <button
                                id="manual-add-employee-direct"
                                onClick={() => setShowAddEmployeeModal(true)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[10px] text-emerald-700 font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                title="Add employee manually without file upload"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>+ Add Manually</span>
                              </button>
                            )}
                            <button
                              id={`manual-get-template-${e.id}`}
                              onClick={() => generateTemplate(e.id)}
                              className="px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[10px] text-[#0F172A] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer"
                              title="Download blank excel template with guide row"
                            >
                              <Download className="w-3 h-3" />
                              <span>Template</span>
                            </button>
                            <button
                              id={`manual-import-btn-${e.id}`}
                              onClick={() => { setWizardEntity(e.id); setWizardStep(2); setActiveTab("wizard"); }}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-[#5C52FB] hover:text-white border border-purple-200 text-[10px] text-[#5C52FB] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Import</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase self-start sm:self-center">
                            Restricted
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: MANUAL BULK EXPORTS */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
                <div className="border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-1.5">
                    <Download className="text-[#5C52FB] w-4.5 h-4.5" />
                    Instant SME Export Gateways
                  </h4>
                  <p className="text-[11px] text-[#64748B] leading-normal">
                    Download encrypted CSV or SheetJS Excel reports mapped to local tenant parameters securely.
                  </p>
                </div>

                {/* Global Config Settings */}
                <div className="bg-white rounded-xl p-3 border border-[#E2E8F0] grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label-elevate block">Export Format</label>
                    <select
                      id="select-export-format"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="input-elevate w-full font-bold"
                    >
                      <option value="xlsx">Excel Sheet (.xlsx)</option>
                      <option value="csv">Standard CSV (.csv)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="label-elevate block">Date Filters</label>
                    <select
                      id="select-export-date-range"
                      value={exportFilterRange}
                      onChange={(e) => setExportFilterRange(e.target.value)}
                      className="input-elevate w-full font-bold"
                    >
                      <option value="all">Export All Records</option>
                      <option value="date">Custom Date Range</option>
                    </select>
                  </div>

                  {exportFilterRange === "date" && (
                    <div className="col-span-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="space-y-1">
                        <label className="label-elevate block">Start Date</label>
                        <input
                          id="export-start-date"
                          type="date"
                          value={exportStartDate}
                          onChange={(e) => setExportStartDate(e.target.value)}
                          className="input-elevate w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="label-elevate block">End Date</label>
                        <input
                          id="export-end-date"
                          type="date"
                          value={exportEndDate}
                          onChange={(e) => setExportEndDate(e.target.value)}
                          className="input-elevate w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* COMPLETE SYSTEM ZIP EXPORT */}
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-[#5C52FB] flex items-center gap-1.5 uppercase tracking-wide">
                        <FileArchive className="w-4 h-4 animate-pulse" />
                        Complete Business Data (.ZIP)
                      </span>
                      <span className="text-[9px] text-[#64748B] block leading-normal">
                        Creates an offline-compliant encrypted ZIP file containing CSV tables of customers, items, ledgers, transactions, and user rosters in a single package.
                      </span>
                    </div>

                    <button
                      id="btn-complete-backup-zip"
                      onClick={handleExportCompleteBusinessZIP}
                      className="btn-elevate-primary px-4 py-2 text-[10px] uppercase rounded-xl flex items-center gap-1 cursor-pointer self-start sm:self-center shadow-xs"
                    >
                      <FileArchive className="w-3.5 h-3.5" />
                      <span>Backup All</span>
                    </button>
                  </div>

                  {ENTITIES.map(e => {
                    const allowed = e.requiredRoles.includes(currentUserRole) || isOwnerOrCoOwner;
                    return (
                      <div key={e.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-slate-300 transition-all">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#0F172A] block uppercase tracking-wider">{e.label} Ledger</span>
                          <span className="text-[9px] text-[#64748B] block leading-normal">{e.desc}</span>
                        </div>

                        {allowed ? (
                          <button
                            id={`manual-export-btn-${e.id}`}
                            onClick={() => handleManualExport(e.id)}
                            className="px-4 py-1.5 bg-[#F8FAFC] hover:bg-slate-200 border border-[#E2E8F0] text-[10px] text-[#0F172A] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer self-start sm:self-center transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase self-start sm:self-center">
                            Restricted
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: AUDIT TRAILS & LEDGER LOGS HISTORY
            ------------------------------------------------------------- */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-fadeIn flex-1 flex flex-col justify-between">
            <div className="space-y-3 flex-1">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0F172A]">Import / Export Complete Audit Log</h4>
                  <p className="text-[11px] text-[#64748B]">Every bulk operation and backup execution is cataloged for compliance auditing.</p>
                </div>
                
                <span className="text-[10px] font-bold text-[#5C52FB] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full uppercase font-mono">
                  SME Logs count: {localHistory.length}
                </span>
              </div>

              {/* Logs table list */}
              <div className="border border-[#E2E8F0] bg-white rounded-xl overflow-hidden flex-1 shadow-xs">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left text-[#0F172A]">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[9px] font-bold uppercase text-[#94A3B8]">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Operation Action</th>
                        <th className="p-3">Operator Username</th>
                        <th className="p-3">Outcome details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                      {localHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#94A3B8] font-sans text-xs">
                            No bulk import/export vouchers logged in current SME tenant workspace.
                          </td>
                        </tr>
                      ) : (
                        localHistory.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-[#94A3B8] whitespace-nowrap">{l.timestamp}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border ${
                                l.action.toLowerCase().includes("import") 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}>
                                {l.action}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-[#0F172A]">@{l.username}</td>
                            <td className="p-3 text-[#64748B] font-sans leading-normal truncate max-w-[28rem]" title={l.details}>
                              {l.details}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MANUAL EMPLOYEE ADDITION MODAL */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A]">Add Employee Manually</h3>
                  <p className="text-[11px] text-[#64748B]">Add a single staff member directly without CSV upload</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="label-elevate block">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Subhash Chandra"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-elevate w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="label-elevate block">Username *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. subhash_m"
                    value={employeeForm.username}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, username: e.target.value }))}
                    className="input-elevate w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-elevate block">System Role *</label>
                  <select 
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                    className="input-elevate w-full font-bold"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="label-elevate block">Access Password / PIN *</label>
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="text-[10px] text-[#5C52FB] font-bold hover:underline cursor-pointer"
                  >
                    {showFormPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showFormPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, password: e.target.value }))}
                    className="input-elevate w-full pr-10 font-mono"
                  />
                  <div className="absolute right-3 top-2.5 text-[#94A3B8]">
                    <Key className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B]">Set employee's password for workspace portal authentication</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="label-elevate block">Phone Number *</label>
                  <input 
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-elevate w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="label-elevate block">Monthly Salary (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: e.target.value }))}
                    className="input-elevate w-full font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label-elevate block">Email Address (Optional)</label>
                <input 
                  type="email"
                  placeholder="e.g. subhash@business.com"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-elevate w-full"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#5C52FB] shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <p className="font-extrabold text-[11px] text-[#0F172A] mb-0.5">Workspace Login Enabled</p>
                  <p className="text-[10px] text-[#64748B]">
                    This employee will get instant access to the owner's store workspace <strong>({activeBusiness?.name || activeBusinessId})</strong> with role <strong>{employeeForm.role}</strong> using handle <strong>@{employeeForm.username || "username"}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  disabled={isSubmittingEmployee}
                  className="flex-1 py-2.5 border border-[#E2E8F0] hover:bg-slate-100 text-[#0F172A] font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmployee}
                  className="flex-1 py-2.5 bg-[#5C52FB] hover:bg-[#4F46E5] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingEmployee ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Save Employee</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
