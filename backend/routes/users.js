const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    // Get user's books
    const listedBooks = await Book.find({ seller: req.user.id })
      .populate('category', 'name slug')
      .sort('-createdAt');

    // Get purchased orders
    const purchasedOrders = await Order.find({ buyer: req.user.id })
      .populate('book', 'title author images price')
      .populate('seller', 'username')
      .sort('-createdAt');

    // Get sales orders
    const salesOrders = await Order.find({ seller: req.user.id })
      .populate('book', 'title author images price')
      .populate('buyer', 'username')
      .sort('-createdAt');

    // Get notifications
    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(20);

    // Statistics
    const stats = {
      totalListed: listedBooks.length,
      availableListed: listedBooks.filter(b => !b.isSold && b.approvalStatus === 'approved').length,
      pendingApproval: listedBooks.filter(b => b.approvalStatus === 'pending').length,
      soldCount: listedBooks.filter(b => b.isSold).length,
      purchasedCount: purchasedOrders.length,
      salesCount: salesOrders.length,
      unreadNotifications: notifications.filter(n => !n.isRead).length
    };

    res.status(200).json({
      success: true,
      data: {
        user,
        listedBooks,
        purchasedOrders,
        salesOrders,
        notifications,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user address
router.put('/profile/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.address = req.body.address;
    
    // Also update root phone number if provided in address and not set or explicitly requested
    if (req.body.address && req.body.address.phone) {
      user.phoneNumber = req.body.address.phone;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address saved successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark notifications as read
router.put('/notifications/read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
