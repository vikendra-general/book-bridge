const Book = require('../models/Book');
const Order = require('../models/Order');
const User = require('../models/User');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const AdminActivityLog = require('../models/AdminActivityLog');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res) => {
  try {
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const stats = {
      totalUsers: await User.countDocuments(),
      totalBooks: await Book.countDocuments(),
      pendingBooks: await Book.countDocuments({ approvalStatus: 'pending' }),
      totalOrders: await Order.countDocuments(),
      activeOrders: await Order.countDocuments({ 
        status: { $in: ['processing', 'sold', 'picked_up', 'in_transit'] } 
      }),
      totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0
    };

    const recentBooks = await Book.find()
      .populate('seller', 'username')
      .sort('-createdAt')
      .limit(10);

    const recentOrders = await Order.find()
      .populate('book', 'title')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentBooks,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all books for admin
// @route   GET /api/admin/books
// @access  Private/Admin
exports.getBooks = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.approvalStatus = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const books = await Book.find(query)
      .populate('category', 'name')
      .populate('seller', 'username email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve book
// @route   PUT /api/admin/books/:id/approve
// @access  Private/Admin
exports.approveBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    book.approvalStatus = 'approved';
    book.approvedBy = req.user.id;
    book.approvalDate = Date.now();
    book.isAvailable = true;
    await book.save();

    // Log activity
    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'book_approve',
      description: `Approved book: ${book.title}`,
      targetBook: book._id,
      ipAddress: req.ip
    });

    // Notify seller
    await Notification.create({
      user: book.seller,
      message: `Your book "${book.title}" has been approved and is now available for sale!`,
      notificationType: 'approval',
      relatedBook: book._id
    });

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject book
// @route   PUT /api/admin/books/:id/reject
// @access  Private/Admin
exports.rejectBook = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    book.approvalStatus = 'rejected';
    book.approvedBy = req.user.id;
    book.approvalDate = Date.now();
    book.rejectionReason = rejectionReason;
    book.isAvailable = false;
    await book.save();

    // Log activity
    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'book_reject',
      description: `Rejected book: ${book.title}. Reason: ${rejectionReason}`,
      targetBook: book._id,
      ipAddress: req.ip
    });

    // Notify seller
    await Notification.create({
      user: book.seller,
      message: `Your book "${book.title}" was rejected. Reason: ${rejectionReason}`,
      notificationType: 'approval',
      relatedBook: book._id
    });

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update book admin information
// @route   PUT /api/admin/books/:id
// @access  Private/Admin
exports.updateBookInfo = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    book.adminNotes = adminNotes;
    await book.save();

    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'book_update',
      description: `Updated admin notes for book: ${book.title}`,
      targetBook: book._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete book as admin
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await book.deleteOne();

    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'book_delete',
      description: `Deleted book: ${book.title}`,
      targetBook: book._id,
      ipAddress: req.ip
    });

    await Notification.create({
      user: book.seller,
      message: `Your book "${book.title}" has been removed by the admin.`,
      notificationType: 'approval',
      relatedBook: book._id
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders for admin
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 1) {
        query.status = { $in: statuses };
      } else {
        query.status = status;
      }
    }
    if (search) {
      query.trackingNumber = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('book', 'title author')
      .populate('buyer', 'username email')
      .populate('seller', 'username email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, notes, returnPickupDate, expectedDeliveryDate } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = Date.now();
    }
    const shippingStatuses = ['processing', 'in_transit', 'picked_up', 'delivered'];
    if (shippingStatuses.includes(status) && !expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected delivery date is required in DD/MM/YYYY format'
      });
    }
    if (expectedDeliveryDate) {
      // Accept DD/MM/YYYY from admin panel and persist as a Date.
      const ddmmyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = expectedDeliveryDate.match(ddmmyyyyPattern);

      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Expected delivery date must be in DD/MM/YYYY format'
        });
      }

      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      const parsedExpectedDate = new Date(year, month - 1, day);

      if (
        Number.isNaN(parsedExpectedDate.getTime()) ||
        parsedExpectedDate.getDate() !== day ||
        parsedExpectedDate.getMonth() !== month - 1 ||
        parsedExpectedDate.getFullYear() !== year
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expected delivery date'
        });
      }

      order.expectedDeliveryDate = parsedExpectedDate;
    }
    if (status === 'return_approved' && returnPickupDate) {
      order.returnPickupDate = returnPickupDate;
    }
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;
    await order.save();

    // Log activity
    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'order_update',
      description: `Updated order status to ${status}`,
      targetOrder: order._id,
      ipAddress: req.ip
    });

    // Notify buyer
    await Notification.create({
      user: order.buyer,
      message: `Your order status has been updated to ${status}${order.expectedDeliveryDate ? ` (Expected delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB')})` : ''}`,
      notificationType: 'order',
      relatedOrder: order._id
    });

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

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res) => {
  try {
    const { action } = req.body; // 'block' or 'unblock'
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = action === 'unblock';
    await user.save();

    // Log activity
    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: action === 'block' ? 'user_block' : 'user_unblock',
      description: `${action === 'block' ? 'Blocked' : 'Unblocked'} user: ${user.username}`,
      targetUser: user._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Promote user to admin
// @route   PUT /api/admin/users/:id/promote
// @access  Private/Admin
exports.promoteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Set role to admin
    user.role = 'admin';
    await user.save();

    // Log activity
    await AdminActivityLog.create({
      admin: req.user.id,
      actionType: 'user_promote',
      description: `Promoted user to admin: ${user.username}`,
      targetUser: user._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
