const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getBooks,
  approveBook,
  rejectBook,
  updateBookInfo,
  deleteBook,
  getOrders,
  updateOrderStatus,
  getUsers,
  blockUser,
  promoteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/books', getBooks);
router.put('/books/:id/approve', approveBook);
router.put('/books/:id/reject', rejectBook);
router.put('/books/:id', updateBookInfo);
router.delete('/books/:id', deleteBook);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', getUsers);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/promote', promoteUser);

module.exports = router;
