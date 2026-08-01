import { supabase } from './supabaseClient.js';
import { fetchCatalogCategories, saveCatalogCategory, deleteCatalogCategory } from '../api/catalogApi.js';

export { fetchCatalogCategories, saveCatalogCategory, deleteCatalogCategory };

// Map Supabase product record to app product model
export function mapSupabaseProductToApp(p) {
  return {
    id: p.id,
    tenant_id: p.business_id === 'biz-1' ? 'tenant-vishwa' : 'tenant-bharat',
    business_id: p.business_id || 'biz-1',
    name: p.name || 'Unnamed Item',
    sku: p.sku || `SKU-${p.id}`,
    category: p.category || 'General',
    purchasePrice: p.cost !== undefined ? Number(p.cost) : Number(p.price || 0) * 0.7,
    salePrice: Number(p.price || 0),
    gstPercent: Number(p.gst_rate || 18),
    stock: Number(p.stock || 0),
    minStockLevel: Number(p.min_stock_level || 10),
    unit: p.unit || 'pcs',
    barcode: p.barcode || '',
    hsn_sac: p.hsn_sac || '',
    qrCode: p.sku ? `QR-${p.sku}` : ''
  };
}

// Map app product model to Supabase product record
export function mapAppProductToSupabase(p) {
  return {
    id: p.id,
    business_id: p.business_id || 'biz-1',
    name: p.name,
    sku: p.sku || `SKU-${Date.now()}`,
    hsn_sac: p.hsn_sac || '',
    price: Number(p.salePrice || p.price || 0),
    cost: Number(p.purchasePrice || p.cost || 0),
    stock: Number(p.stock || 0),
    gst_rate: Number(p.gstPercent || p.gst_rate || 18),
    unit: p.unit || 'pcs'
  };
}

// Map Supabase customer record to app customer model
export function mapSupabaseCustomerToApp(c) {
  return {
    id: c.id,
    tenant_id: c.business_id === 'biz-1' ? 'tenant-vishwa' : 'tenant-bharat',
    business_id: c.business_id || 'biz-1',
    name: c.name || 'Customer',
    phone: c.phone || '',
    email: c.email || '',
    outstandingBalance: Number(c.khata_balance || 0),
    creditLimit: Number(c.credit_limit || 15000),
    membershipTier: c.loyalty_tier || 'Regular',
    gstin: c.gstin || '',
    address: c.address || '',
    contactPreference: 'WhatsApp'
  };
}

// Map app customer model to Supabase customer record
export function mapAppCustomerToSupabase(c) {
  return {
    id: c.id,
    business_id: c.business_id || 'biz-1',
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    khata_balance: Number(c.outstandingBalance || 0),
    credit_limit: Number(c.creditLimit || 15000),
    loyalty_tier: c.membershipTier || 'Regular'
  };
}

// Map Supabase transaction record to app bill model
export function mapSupabaseTransactionToApp(t) {
  let items = [];
  try {
    items = typeof t.items_json === 'string' ? JSON.parse(t.items_json) : (t.items_json || []);
  } catch (e) {
    items = [];
  }
  return {
    id: t.id,
    tenant_id: t.business_id === 'biz-1' ? 'tenant-vishwa' : 'tenant-bharat',
    business_id: t.business_id || 'biz-1',
    invoiceNumber: t.invoice_number || `INV-${t.id.slice(-6).toUpperCase()}`,
    date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    customerId: t.customer_id || 'walk-in',
    customerName: t.customer_name || 'Customer',
    customerPhone: t.customer_phone || '',
    items: items,
    totalAmount: Number(t.total_amount || 0),
    paidAmount: Number(t.paid_amount !== undefined ? t.paid_amount : t.total_amount || 0),
    paymentMethod: t.payment_method || 'UPI',
    paymentStatus: t.payment_status || 'Paid',
    subTotal: Number(t.total_amount || 0),
    discount: 0,
    gstAmount: 0
  };
}

// Map app bill model to Supabase transaction record
export function mapAppBillToSupabase(b) {
  return {
    id: b.id,
    business_id: b.business_id || 'biz-1',
    customer_id: b.customerId || 'walk-in',
    total_amount: Number(b.totalAmount || 0),
    payment_method: b.paymentMethod || 'UPI',
    payment_status: b.paymentStatus || 'Paid',
    items_json: JSON.stringify(b.items || []),
    created_at: b.date ? new Date(b.date).toISOString() : new Date().toISOString()
  };
}

// Map Supabase expense record to app journal/expense model
export function mapSupabaseExpenseToApp(e) {
  return {
    id: e.id,
    tenant_id: e.business_id === 'biz-1' ? 'tenant-vishwa' : 'tenant-bharat',
    business_id: e.business_id || 'biz-1',
    date: e.date || new Date().toISOString().split('T')[0],
    description: e.description || 'Expense',
    debitAccount: e.category || 'Utilities',
    creditAccount: 'Cash',
    amount: Number(e.amount || 0)
  };
}

// Map app expense/journal to Supabase expense record
export function mapAppExpenseToSupabase(e) {
  return {
    id: e.id,
    business_id: e.business_id || 'biz-1',
    category: e.debitAccount || e.category || 'Utilities',
    amount: Number(e.amount || 0),
    description: e.description || '',
    date: e.date || new Date().toISOString().split('T')[0]
  };
}

// Supabase API Operations

export async function fetchProducts(businessId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;
  return (data || []).map(mapSupabaseProductToApp);
}

export async function fetchCustomers(businessId) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;
  return (data || []).map(mapSupabaseCustomerToApp);
}

export async function fetchTransactions(businessId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;
  return (data || []).map(mapSupabaseTransactionToApp);
}

export async function fetchExpenses(businessId) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;
  return (data || []).map(mapSupabaseExpenseToApp);
}

export async function saveProduct(product) {
  const row = mapAppProductToSupabase(product);
  const { data, error } = await supabase.from('products').upsert(row);
  if (error) throw error;
  return data;
}

export async function upsertProducts(productsArray) {
  const rows = productsArray.map(mapAppProductToSupabase);
  const { data, error } = await supabase.from('products').upsert(rows);
  if (error) throw error;
  return data;
}

export async function saveCustomer(customer) {
  const row = mapAppCustomerToSupabase(customer);
  const { data, error } = await supabase.from('customers').upsert(row);
  if (error) throw error;
  return data;
}

export async function upsertCustomers(customersArray) {
  const rows = customersArray.map(mapAppCustomerToSupabase);
  const { data, error } = await supabase.from('customers').upsert(rows);
  if (error) throw error;
  return data;
}

export async function saveTransaction(bill) {
  const row = mapAppBillToSupabase(bill);
  const { data, error } = await supabase.from('transactions').insert(row);
  if (error) throw error;
  return data;
}

export async function upsertTransactions(billsArray) {
  const rows = billsArray.map(mapAppBillToSupabase);
  const { data, error } = await supabase.from('transactions').upsert(rows);
  if (error) throw error;
  return data;
}

export async function saveExpense(expense) {
  const row = mapAppExpenseToSupabase(expense);
  const { data, error } = await supabase.from('expenses').insert(row);
  if (error) throw error;
  return data;
}

export async function upsertExpenses(expensesArray) {
  const rows = expensesArray.map(mapAppExpenseToSupabase);
  const { data, error } = await supabase.from('expenses').upsert(rows);
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { data, error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id) {
  const { data, error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
  return data;
}

// Real-time PostgreSQL subscription hook
export function subscribeToDatabaseChanges(onTableChange) {
  const channel = supabase
    .channel('db-realtime-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (onTableChange) {
        onTableChange(payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
