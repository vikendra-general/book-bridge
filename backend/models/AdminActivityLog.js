const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: [
      'book_approve',
      'book_reject',
      'book_update',
      'book_delete',
      'order_update',
      'user_block',
      'user_unblock',
      'user_promote',
      'category_create',
      'category_update',
      'category_delete'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  },
  targetOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  ipAddress: String
}, {
  timestamps: true
});

adminActivityLogSchema.index({ admin: 1, createdAt: -1 });
adminActivityLogSchema.index({ actionType: 1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
