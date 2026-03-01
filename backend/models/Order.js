const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'sold', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'return_requested', 'return_approved', 'return_rejected', 'returned'],
    default: 'processing'
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true,
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  deliveryAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  pickupAddress: String,
  pickupDate: Date,
  deliveryDate: Date,
  expectedDeliveryDate: Date,
  pickupAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveryAssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveredAt: Date,
  returnReason: String,
  returnAction: {
    type: String,
    enum: ['refund', 'replace']
  },
  refundMethod: {
    type: String,
    enum: ['original_source', 'bank_transfer', 'store_credit']
  },
  returnDate: Date,
  returnPickupDate: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ buyer: 1 });
orderSchema.index({ seller: 1 });
orderSchema.index({ status: 1 });
// trackingNumber index is automatically created by unique: true constraint

module.exports = mongoose.model('Order', orderSchema);
