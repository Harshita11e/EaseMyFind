import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

export default router;