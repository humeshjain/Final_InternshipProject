import { catalogRepository } from '../repositories/catalogRepository.js';

export const catalogService = {
  getCategories: async ({ activeOnly = false } = {}) => {
    const categories = await catalogRepository.getAll();
    if (activeOnly) {
      return categories.filter(c => (c.status || 'Active').toLowerCase() === 'active');
    }
    return categories;
  },

  createOrUpdateCategory: async (categoryData) => {
    if (!categoryData || !categoryData.name || !categoryData.name.trim()) {
      throw new Error('Category name is required.');
    }
    return await catalogRepository.save(categoryData);
  },

  deleteCategory: async (id) => {
    return await catalogRepository.delete(id);
  }
};
