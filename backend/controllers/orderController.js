const Order = require('../models/Order');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendOrderConfirmation } = require('../utils/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_S2fnUBXXQtdwub',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'NZ3ZsEVd3C8gQawAJStLAB4g'
});

// @desc    Create Razorpay order
// @route   POST /api/orders/create-razorpay-order
// @access  Private
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, books } = req.body;

    if (!amount || !books || books.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount and books are required'
      });
    }

    // Verify books exist and are available
    const bookCounts = {};
    books.forEach(id => {
      bookCounts[id] = (bookCounts[id] || 0) + 1;
    });
    
    const uniqueBookIds = Object.keys(bookCounts);
    const bookDocs = await Book.find({ _id: { $in: uniqueBookIds } });
    
    if (bookDocs.length !== uniqueBookIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more books not found'
      });
    }

    // Check if books are available
    for (const book of bookDocs) {
      const requiredQty = bookCounts[book._id.toString()];
      
      if (book.isSold || !book.isAvailable || (book.quantity || 0) < requiredQty) {
        return res.status(400).json({
          success: false,
          message: `Book "${book.title}" is not available or insufficient stock (Required: ${requiredQty}, Available: ${book.quantity || 0})`
        });
      }
      if (book.seller.toString() === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot buy your own book'
        });
      }
    }

    // Create Razorpay order
    const options = {
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.user.id,
        books: books.join(',')
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'NZ3ZsEVd3C8gQawAJStLAB4g')
      .update(text.toString())
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { books, deliveryAddress, paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!books || books.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Books are required'
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Verify books exist and are available
    const bookCounts = {};
    books.forEach(id => {
      bookCounts[id] = (bookCounts[id] || 0) + 1;
    });
    
    const uniqueBookIds = Object.keys(bookCounts);
    const bookDocs = await Book.find({ _id: { $in: uniqueBookIds } });
    
    if (bookDocs.length !== uniqueBookIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more books not found'
      });
    }

    const bookMap = new Map(bookDocs.map(b => [b._id.toString(), b]));
    let totalAmount = 0;
    
    // Validate stock and calculate total
    for (const book of bookDocs) {
      const requiredQty = bookCounts[book._id.toString()];
      
      if (book.isSold || !book.isAvailable || (book.quantity || 0) < requiredQty) {
        return res.status(400).json({
          success: false,
          message: `Book "${book.title}" is not available or insufficient stock (Required: ${requiredQty}, Available: ${book.quantity || 0})`
        });
      }

      if (book.seller.toString() === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot buy your own book'
        });
      }
      
      totalAmount += book.price * requiredQty;
    }

    // Verify payment for online orders (once)
    if (paymentMethod === 'online') {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment details are required for online payment'
        });
      }

      // Verify payment signature
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'NZ3ZsEVd3C8gQawAJStLAB4g')
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed'
        });
      }
    }

    const orders = [];

    // Create order records
    for (const bookId of uniqueBookIds) {
      const book = bookMap.get(bookId);
      const quantity = bookCounts[bookId];
      
      // Create order
      const order = await Order.create({
        book: book._id,
        buyer: req.user.id,
        seller: book.seller,
        quantity: quantity,
        totalAmount: book.price * quantity,
        status: 'processing',
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        razorpayOrderId: paymentMethod === 'online' ? razorpayOrderId : undefined,
        razorpayPaymentId: paymentMethod === 'online' ? razorpayPaymentId : undefined,
        razorpaySignature: paymentMethod === 'online' ? razorpaySignature : undefined,
        deliveryAddress: deliveryAddress
      });

      orders.push(order);
    }

    // Update stock and notify sellers
    for (const book of bookDocs) {
      const requiredQty = bookCounts[book._id.toString()];
      const oldQty = book.quantity;
      
      book.quantity = Math.max(0, (book.quantity || 0) - requiredQty);
      console.log(`Updating book ${book.title} (${book._id}): ${oldQty} -> ${book.quantity}`);

      if (book.quantity <= 0) {
        book.isSold = true;
        book.isAvailable = false;
      } else {
        // Only set available if we have stock (and wasn't already false/sold - though validation covers that)
        book.isSold = false;
        book.isAvailable = true;
      }
      await book.save();
      console.log(`Book saved: ${book._id}`);

      // Create notification for seller
      await Notification.create({
        user: book.seller,
        message: `Your book "${book.title}" has been purchased by ${req.user.username} (Qty: ${requiredQty})`,
        notificationType: 'order',
        relatedOrder: orders.find(o => o.book.toString() === book._id.toString())._id, // Link to one of the orders
        relatedBook: book._id
      });
    }

    // Populate orders with book and user details for email
    const populatedOrders = await Order.find({ _id: { $in: orders.map(o => o._id) } })
      .populate('book', 'title author images price')
      .populate('buyer', 'username email')
      .populate('seller', 'username email');

    // Get buyer details
    const buyer = await User.findById(req.user.id);

    // Send order confirmation email
    try {
      await sendOrderConfirmation(
        buyer.email,
        buyer.username,
        populatedOrders,
        totalAmount,
        paymentMethod || 'cod'
      );
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrders,
      totalAmount
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const { type = 'buyer' } = req.query;
    
    const query = type === 'buyer' 
      ? { buyer: req.user.id }
      : { seller: req.user.id };

    const orders = await Order.find(query)
      .populate('book', 'title author images price')
      .populate('buyer', 'username email')
      .populate('seller', 'username email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('book')
      .populate('buyer', 'username email')
      .populate('seller', 'username email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Return order
// @route   PUT /api/orders/:id/return
// @access  Private
exports.returnOrder = async (req, res) => {
  try {
    const { returnReason, returnAction, refundMethod } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ensure user is the buyer
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this order'
      });
    }

    // Check if order is eligible for return (e.g., must be delivered)
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }

    // Check 7-day return window
    const deliveryDate = order.deliveredAt || order.updatedAt; // Fallback to updatedAt if deliveredAt missing
    const daysSinceDelivery = (Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        success: false,
        message: 'Return window closed. Orders can only be returned within 7 days of delivery.'
      });
    }

    if (!returnReason || !returnAction) {
      return res.status(400).json({
        success: false,
        message: 'Please provide return reason and preferred action'
      });
    }

    order.status = 'return_requested';
    order.returnReason = returnReason;
    order.returnAction = returnAction;
    if (returnAction === 'refund') {
      order.refundMethod = refundMethod;
    }
    order.returnDate = Date.now();
    
    await order.save();

    // Notify seller/admin
    await Notification.create({
      user: order.seller,
      message: `Return requested for book order #${order._id} by ${req.user.username}. Reason: ${returnReason}`,
      notificationType: 'order',
      relatedOrder: order._id,
      relatedBook: order.book
    });

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
