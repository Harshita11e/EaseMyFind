import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  secretDetails: {
    type: String,
    required: true   // hidden from public, only poster sees it
  },
  category: {
    type: String,
    enum: [
      'Electronics', 'Documents', 'Keys',
      'Bags & Wallets', 'Pets', 'Jewellery',
      'Clothes', 'Books', 'Sports', 'Other'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['lost', 'found', 'claimed', 'resolved'],
    required: true
  },
  images: [{ type: String }],  // Cloudinary URLs
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  dateLostOrFound: {
    type: Date,
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// For efficient full-text search
itemSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Item', itemSchema);