import express from 'express';
import {
  listCategories,
  listBrands,
  listProducts,
  getProduct,
  searchSuggest,
  listOffers,
} from '../controllers/productController.js';
import { listProductReviews, createReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', listCategories);
router.get('/brands', listBrands);
router.get('/products', listProducts);
router.get('/products/suggest', searchSuggest);
router.get('/offers', listOffers);
router.get('/products/:idOrSlug', getProduct);

// Reviews routes on products
router.get('/products/:productId/reviews', listProductReviews);
router.post('/products/:productId/reviews', authenticateToken, createReview);

export default router;
