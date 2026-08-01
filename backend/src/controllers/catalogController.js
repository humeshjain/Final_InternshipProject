import { catalogService } from '../services/catalogService.js';

export const catalogController = {
  getCategories: async (req, res, next) => {
    try {
      const activeOnly = req.query.status === 'active';
      const categories = await catalogService.getCategories({ activeOnly });
      res.json({
        success: true,
        data: categories
      });
    } catch (err) {
      next(err);
    }
  },

  saveCategory: async (req, res, next) => {
    try {
      const categoryData = req.body;
      const savedCategory = await catalogService.createOrUpdateCategory(categoryData);
      const allCategories = await catalogService.getCategories();
      res.status(201).json({
        success: true,
        message: 'Category saved successfully',
        data: savedCategory,
        categories: allCategories
      });
    } catch (err) {
      next(err);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      await catalogService.deleteCategory(id);
      const allCategories = await catalogService.getCategories();
      res.json({
        success: true,
        message: 'Category deleted successfully',
        categories: allCategories
      });
    } catch (err) {
      next(err);
    }
  }
};
