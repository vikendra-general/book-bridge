const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Book description is required'],
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  edition: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['new', 'like_new', 'used'],
    required: true,
    default: 'new'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  images: [{
    type: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerContact: {
    type: String,
    required: function () {
      return !this.isOriginal;
    },
    validate: {
      validator: function (v) {
        if (this.isOriginal) return true;
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Seller contact must be a valid 10-digit mobile number starting with 6-9'
    }
  },
  isOriginal: {
    type: Boolean,
    default: false
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price must be positive']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Selling price must be positive']
  },
  discountPercent: {
    type: Number,
    min: [0, 'Discount percent cannot be negative'],
    max: [100, 'Discount percent cannot exceed 100']
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'Quantity cannot be negative']
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionReason: String,
  isAvailable: {
    type: Boolean,
    default: false
  },
  isSold: {
    type: Boolean,
    default: false
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratingAverage: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ approvalStatus: 1 });
bookSchema.index({ isAvailable: 1, isSold: 1 });

module.exports = mongoose.model('Book', bookSchema);
