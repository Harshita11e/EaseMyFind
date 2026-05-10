import express from 'express';
import {
  getStats,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getAllItems,
  toggleFlagItem,
  deleteItem,
  getAllClaims,
  getAllNotifications
} from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes are protected + admin only
router.use(protect, adminOnly);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/block', toggleBlockUser);
router.delete('/users/:id', deleteUser);

// Items
router.get('/items', getAllItems);
router.patch('/items/:id/flag', toggleFlagItem);
router.delete('/items/:id', deleteItem);

// Claims
router.get('/claims', getAllClaims);

// Notifications
router.get('/notifications', getAllNotifications);

export default router;