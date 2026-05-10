import express from 'express';
import {
  getMyNotifications,
  markAllRead,
  markOneRead
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);

export default router;