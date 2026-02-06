const express = require('express');
const router = express.Router();
const {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  returnOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.put('/:id/return', protect, returnOrder);
router.get('/:id', protect, getOrder);

module.exports = router;
