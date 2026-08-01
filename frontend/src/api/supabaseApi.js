export { 
  fetchProducts, fetchCustomers, fetchTransactions, fetchExpenses,
  saveProduct, saveCustomer, saveTransaction, saveExpense,
  deleteProduct, deleteCustomer, subscribeToDatabaseChanges,
  fetchCatalogCategories, saveCatalogCategory, deleteCatalogCategory
} from '../lib/supabaseService.js';
