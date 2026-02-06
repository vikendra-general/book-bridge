const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBook,
  createBook,
  getMyBooks,
  deleteBook,
  addReview,
  getReviews
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getBooks);
router.get('/my-books', protect, getMyBooks);
router.get('/:id', getBook);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, addReview);
router.post('/', protect, upload.array('images', 5), createBook);
router.delete('/:id', protect, deleteBook);

module.exports = router;
