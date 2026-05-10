import express from 'express';
import {
  createItem, getItems, getItemById,
  updateItem, deleteItem, getMyItems,
  getMapItems, resolveItem, getSearchSuggestions
} from '../controllers/item.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/', getItems);
router.get('/map', getMapItems);
router.get('/suggestions', getSearchSuggestions);
router.get('/:id', getItemById);

// Protected routes
router.post('/', protect, upload.array('images', 5), createItem);
router.put('/:id', protect, upload.array('images', 5), updateItem);
router.delete('/:id', protect, deleteItem);
router.get('/user/my-items', protect, getMyItems);
router.patch('/:id/resolve', protect, resolveItem);

export default router;