import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_claim',       // someone claimed your item
      'claim_accepted',  // your claim was accepted
      'claim_rejected',  // your claim was rejected
      'item_resolved'    // item marked as resolved
    ]
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);