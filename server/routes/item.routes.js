import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createItem, getItems, getItemById,
  updateItem, deleteItem, getMyItems,
  getMapItems, resolveItem, getSearchSuggestions
} from '../controllers/item.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

const postItemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many items posted, please try again after an hour' }
});

// Public routes
router.get('/', getItems);
router.get('/map', getMapItems);
router.get('/suggestions', getSearchSuggestions);
router.get('/user/my-items', protect, getMyItems);
router.get('/:id', getItemById);

// Protected routes
router.post('/', protect, postItemLimiter, upload.array('images', 5), createItem);
router.put('/:id', protect, upload.array('images', 5), updateItem);
router.delete('/:id', protect, deleteItem);
router.patch('/:id/resolve', protect, resolveItem);

export default router;