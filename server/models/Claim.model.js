import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proofDescription: {
    type: String,
    required: true  // answer to secret details
  },
  proofImage: {
    type: String,
    default: ''     // optional old photo with item
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null   // the finder who accepts/rejects
  }
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);