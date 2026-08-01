import { EmployeeRole } from "./types";
import { DEFAULT_CATEGORIES } from "./utils/catalogUtils.js";

export const initialMockDatabase = {
  categories: DEFAULT_CATEGORIES,
  businesses: [
    {
      id: "biz-1",
      name: "",
      gstin: "27AAAAA1111A1Z1",
      address: "102, Shanti Nagar, MG Road, Mumbai, MH - 400001",
      phone: "+91 98765 43210",
      email: "vishwa.retail@gmail.com",
      ownerId: "user-1",
      currency: "INR",
      createdAt: "2026-01-01",
      category: "",
      enabledProductTypes: ["Grocery", "Electronics", "Clothing", "Pharmacy"],
      customProductTypes: [],
      isOnboarded: false
    }
  ],
  warehouses: [
    { id: "wh-1", businessId: "biz-1", name: "Mumbai Central Warehouse", location: "Dharavi, Mumbai" }
  ],
  users: [
    { id: "user-1", username: "vishwa_owner", name: "Vijay Agarwal", role: EmployeeRole.OWNER, businessId: "biz-1", phone: "+91 98765 43210", email: "vijay@vishwa.com", salary: 150000, attendanceRate: 100, incentiveEarned: 0 }
  ],
  products: [],
  customers: [],
  suppliers: [],
  bills: [],
  khata: [],
  journal: [],
  tickets: [],
  auditLogs: [
    { id: "log-1", tenant_id: "tenant-vishwa", business_id: "biz-1", action: "System Init", userId: "user-1", username: "vishwa_owner", details: "Database initialized.", timestamp: "2026-07-13 08:30" }
  ],
  tallyState: {
    lastSyncTime: "Never",
    status: "Success",
    syncedRecords: 0,
    logs: [
      "System initialized. Ready for Tally sync."
    ]
  }
};
