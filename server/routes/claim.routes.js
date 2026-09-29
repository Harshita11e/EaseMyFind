import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitClaim, getClaimsForItem,
  getMyClaims, acceptClaim, rejectClaim
} from '../controllers/claim.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: 'Too many claims submitted, please try again after an hour' }
});

router.post('/:itemId', protect, claimLimiter, upload.single('proofImage'), submitClaim);
router.get('/item/:itemId', protect, getClaimsForItem);
router.get('/my-claims', protect, getMyClaims);
router.patch('/:claimId/accept', protect, acceptClaim);
router.patch('/:claimId/reject', protect, rejectClaim);

export default router;