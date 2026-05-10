import express from 'express';
import {
  submitClaim,
  getClaimsForItem,
  getMyClaims,
  acceptClaim,
  rejectClaim
} from '../controllers/claim.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// All claim routes are protected
router.post('/:itemId', protect, upload.single('proofImage'), submitClaim);
router.get('/item/:itemId', protect, getClaimsForItem);
router.get('/my-claims', protect, getMyClaims);
router.patch('/:claimId/accept', protect, acceptClaim);
router.patch('/:claimId/reject', protect, rejectClaim);

export default router;