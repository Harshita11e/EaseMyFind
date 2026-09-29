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
    primary: { type: String, required: true },
    secondary: { type: String, default: '' },
    tertiary: { type: String, default: '' }
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
  images: [{ type: String }],
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

// Text index for search
itemSchema.index({ title: 'text', description: 'text', category: 'text' });

export default mongoose.model('Item', itemSchema);