import express from 'express';
import {
  getAdminStats,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  getAllOrdersAdmin,
  updateOrderStatus,
  getOffersAdmin,
  createOfferAdmin,
  updateOfferAdmin,
  deleteOfferAdmin,
  getCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
  getBrandsAdmin,
  createBrandAdmin,
  updateBrandAdmin,
  deleteBrandAdmin,
  getUsersAdmin,
  getUserDetailsAdmin,
  getReviewsAdmin,
  deleteReviewAdmin,
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

/* Dashboard Stats */
router.get('/stats', getAdminStats);

/* Product Management */
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id/inventory', updateInventory);

/* Order Fulfillment */
router.get('/orders', getAllOrdersAdmin);
router.put('/orders/:id/status', updateOrderStatus);

/* Offers & Coupons Management */
router.get('/offers', getOffersAdmin);
router.post('/offers', createOfferAdmin);
router.put('/offers/:id', updateOfferAdmin);
router.delete('/offers/:id', deleteOfferAdmin);

/* Categories CRUD */
router.get('/categories', getCategoriesAdmin);
router.post('/categories', createCategoryAdmin);
router.put('/categories/:id', updateCategoryAdmin);
router.delete('/categories/:id', deleteCategoryAdmin);

/* Brands CRUD */
router.get('/brands', getBrandsAdmin);
router.post('/brands', createBrandAdmin);
router.put('/brands/:id', updateBrandAdmin);
router.delete('/brands/:id', deleteBrandAdmin);

/* Users / Customer Management */
router.get('/users', getUsersAdmin);
router.get('/users/:id', getUserDetailsAdmin);

/* Reviews Moderation */
router.get('/reviews', getReviewsAdmin);
router.delete('/reviews/:id', deleteReviewAdmin);

export default router;
