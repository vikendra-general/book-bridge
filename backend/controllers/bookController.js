const Book = require('../models/Book');
const User = require('../models/User');
const Category = require('../models/Category');
const Notification = require('../models/Notification');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      condition,
      originals,
      page = 1, 
      limit = 12 
    } = req.query;

    const query = {
      approvalStatus: 'approved',
      $or: [
        { isAvailable: true },
        { isSold: true }
      ]
    };

    // Category filter
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    // Search filter
    if (search) {
      // Escape special characters for regex
      const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { description: searchRegex }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Condition filter
    if (condition) {
      query.condition = condition;
    }

    if (originals === 'true') {
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminIds = admins.map(u => u._id);
      query.seller = { $in: adminIds };
    }

    const skip = (page - 1) * limit;

    const books = await Book.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'username email role')
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

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('seller', 'username email');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

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

// @desc    Create new book
// @route   POST /api/books
// @access  Private
exports.createBook = async (req, res) => {
  console.log('🚀 createBook controller called');
  try {
    console.log('📝 Request body:', req.body);
    console.log('📁 Request files:', req.files?.length);
    
    req.body.seller = req.user.id;
    
    // Handle images - Cloudinary multer storage returns file.path as the Cloudinary URL
    // First image will be the primary/home image
    const images = [];
    if (req.files && req.files.length > 0) {
      // Process files in order - first file is the primary image
      req.files.forEach((file, index) => {
        // multer-storage-cloudinary stores the Cloudinary URL in file.path
        // It can also be in file.secure_url or file.url
        const imageUrl = file.path || file.secure_url || file.url;
        
        if (imageUrl) {
          images.push(imageUrl);
          if (index === 0) {
            console.log('✅ Primary/Home image uploaded to Cloudinary:', imageUrl);
          } else {
            console.log(`✅ Additional image ${index + 1} uploaded to Cloudinary:`, imageUrl);
          }
        } else {
          console.error('❌ No image URL found in file object:', Object.keys(file));
        }
      });
    }
    
    console.log('📸 Final images array (first image is primary):', images);

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one book image is required'
      });
    }

    // Store images array - first image (index 0) is the primary/home image
    req.body.images = images;
    // Also store primaryImage separately for easy access (optional, for future use)
    req.body.primaryImage = images[0];

    const isAdmin = req.user.role === 'admin';
    if (isAdmin) {
      req.body.approvalStatus = 'approved';
      req.body.isAvailable = true;
      req.body.isOriginal = true;
      const originalPrice = Number(req.body.originalPrice);
      const sellingPrice = Number(req.body.sellingPrice);
      const quantity = Number(req.body.quantity || 1);

      if (!originalPrice || !sellingPrice) {
        return res.status(400).json({
          success: false,
          message: 'Original price and selling price are required for admin listings'
        });
      }

      if (sellingPrice > originalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be less than or equal to original price'
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer'
        });
      }

      req.body.originalPrice = Math.round(originalPrice);
      req.body.sellingPrice = Math.round(sellingPrice);
      req.body.quantity = quantity;
      req.body.discountPercent = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
      req.body.price = req.body.sellingPrice;
      delete req.body.sellerContact;
    } else {
      req.body.approvalStatus = 'pending';
      req.body.isAvailable = false;
      req.body.isOriginal = false;
      const originalPrice = Number(req.body.originalPrice);
      const sellingPrice = Number(req.body.sellingPrice);
      const quantity = Number(req.body.quantity || 1);

      if (!originalPrice || !sellingPrice) {
        return res.status(400).json({
          success: false,
          message: 'Original price and selling price are required'
        });
      }

      if (sellingPrice > originalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Selling price must be less than or equal to original price'
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer'
        });
      }

      req.body.originalPrice = Math.round(originalPrice);
      req.body.sellingPrice = Math.round(sellingPrice);
      req.body.quantity = quantity;
      req.body.discountPercent = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
      req.body.price = req.body.sellingPrice;
    }

    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    // If Cloudinary upload fails, clean up uploaded images
    if (req.files && req.files.length > 0) {
      const cloudinary = require('cloudinary').v2;
      req.files.forEach(file => {
        if (file.public_id) {
          cloudinary.uploader.destroy(file.public_id).catch(console.error);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's books
// @route   GET /api/books/my-books
// @access  Private
exports.getMyBooks = async (req, res) => {
  try {
    const books = await Book.find({ seller: req.user.id })
      .populate('category', 'name slug')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Make sure user is book owner
    if (book.seller.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authorized to delete this book'
      });
    }

    await book.deleteOne();

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

// @desc    Add or update a review for a book
// @route   POST /api/books/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required'
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // If user has already reviewed, update the review; otherwise add new
    const existing = book.reviews.find(r => r.user.toString() === req.user.id);
    if (existing) {
      existing.rating = Number(rating);
      existing.comment = comment;
      existing.createdAt = Date.now();
    } else {
      book.reviews.push({
        user: req.user.id,
        username: req.user.username || 'User',
        rating: Number(rating),
        comment
      });
    }

    // Recalculate rating metrics
    const sum = book.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    book.ratingCount = book.reviews.length;
    book.ratingAverage = book.ratingCount > 0 ? Number((sum / book.ratingCount).toFixed(2)) : 0;

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Review saved successfully',
      data: {
        reviews: book.reviews,
        ratingAverage: book.ratingAverage,
        ratingCount: book.ratingCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get reviews for a book
// @route   GET /api/books/:id/reviews
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).select('reviews ratingAverage ratingCount');
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
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
