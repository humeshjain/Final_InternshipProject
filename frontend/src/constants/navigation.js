import { 
  LayoutDashboard, Receipt, Package, Users, BookOpen, 
  UserCheck, HelpCircle, TrendingUp, Settings, Layers,
  UserPlus, Database
} from "lucide-react";

export const NAVIGATION_TABS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
  { id: "billing", icon: Receipt, label: "Billing" },
  { id: "catalog", icon: Layers, label: "Product Catalog" },
  { id: "inventory", icon: Package, label: "Stock & SKU" },
  { id: "crm", icon: Users, label: "Customer Accounts" },
  { id: "onboard-customer", icon: UserPlus, label: "Onboard Customer" },
  { id: "accounting", icon: BookOpen, label: "Ledgers & P&L" },
  { id: "hr", icon: UserCheck, label: "HR Rosters" },
  { id: "import-export", icon: Database, label: "Import & Export" },
  { id: "tickets", icon: HelpCircle, label: "SLA Tickets" },
  { id: "ai", icon: TrendingUp, label: "AI Intellect" },
  { id: "settings", icon: Settings, label: "System Config" }
];
