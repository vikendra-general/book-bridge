import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaBook, FaSearch, FaFilter, FaShoppingCart, FaPlus, FaMinus, FaStar } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageHelper';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Browse = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart, increaseQuantity, decreaseQuantity, cart } = useContext(CartContext);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    originals: searchParams.get('originals') === 'true'
  });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.originals) params.append('originals', 'true');

      const response = await api.get(`/books?${params.toString()}`);
      setBooks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlOriginals = searchParams.get('originals') === 'true';

    setFilters(prev => {
      if (prev.search === urlSearch && prev.category === urlCategory && prev.originals === urlOriginals) {
        return prev;
      }
      return {
        ...prev,
        search: urlSearch,
        category: urlCategory,
        originals: urlOriginals
      };
    });
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, [fetchCategories, fetchBooks]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: ''
    });
  };

  const handleAddToCart = async (e, book) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is the owner of the book
    const isOwner = book.seller && (book.seller._id === user.id || book.seller === user.id);
    if (isOwner) {
      alert("You cannot add your own book to cart");
      return;
    }

    if (!book.isAvailable || book.isSold) {
      alert('This book is not available');
      return;
    }

    setAddingToCart(book._id);
    const result = addToCart(book);
    
    if (!result.success) {
      alert(result.message);
    } else if (String(result.message || '').toLowerCase().startsWith('book successfully added')) {
      alert(result.message);
    }
    setAddingToCart(null);
  };

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{filters.originals ? 'BookBridge Originals' : 'Browse Books'}</h1>
          <p className="text-gray-600">{filters.originals ? 'BookBridge\'s Choice: Featured Books' : 'Discover your next favorite read'}</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search books by title, author..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2 justify-center"
            >
              <FaFilter />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="input-field"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="₹0"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="₹10000"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  className="input-field"
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                >
                  <option value="">All Conditions</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-gray-600">
            Found {books.filter(book => !book.isSold && book.isAvailable).length} {books.filter(book => !book.isSold && book.isAvailable).length === 1 ? 'book' : 'books'}
          </div>
        )}

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No books found</p>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <Link
              to="/sell"
              className="inline-block btn-primary"
            >
              List Your Book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {books.map((book) => (
              <div
                key={book._id}
                className="card overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
              >
                <Link to={`/books/${book._id}`} className="block flex-grow flex flex-col">
                  {book.images && book.images.length > 0 ? (
                    <div className="relative h-48 overflow-hidden bg-gray-100 p-2">
                      <img
                        src={getImageUrl(book.images[0])}
                        alt={book.title}
                        className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${book.isSold || !book.isAvailable ? 'opacity-50 grayscale' : ''}`}
                      />
                      {(book.isSold || !book.isAvailable) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FaBook className="text-5xl text-gray-400" />
                    </div>
                  )}
                  <div className="p-3 flex-grow flex flex-col">
                    <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      by {book.author}
                    </p>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-bold text-accent-600">
                          ₹{Math.round(book.price)}
                        </p>
                        {book.originalPrice > book.price && (
                          <p className="text-xs text-gray-500 line-through">
                            ₹{Math.round(book.originalPrice)}
                          </p>
                        )}
                        {book.discountPercent > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                            {Math.round(book.discountPercent)}% OFF
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                        {book.condition?.replace('_', ' ')}
                      </span>
                    </div>
                    {book.category && (
                      <p className="text-xs text-gray-500 mb-1">
                        {book.category.name}
                      </p>
                    )}
                    <div className="mt-1 text-xs">
                      {book.ratingCount > 0 ? (
                        <div className="flex items-center space-x-1 text-amber-600">
                          <FaStar className="text-[10px]" />
                          <span className="font-semibold">
                            {Number(book.ratingAverage || 0).toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({book.ratingCount} rating{book.ratingCount > 1 ? 's' : ''})
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-400">No reviews yet</p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  {book.isSold || !book.isAvailable ? (
                    <button
                      disabled
                      className="w-full bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center"
                    >
                      Out of Stock
                    </button>
                  ) : user && book.seller && (book.seller._id === user.id || book.seller === user.id) ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <FaBook className="text-xs" />
                      <span>Your Book</span>
                    </button>
                  ) : (
                    cart.find(item => item._id === book._id) ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const currentQty = (cart.find(it => it._id === book._id)?.cartQty || 1);
                            const result = decreaseQuantity(book._id);
                            if (currentQty === 1) {
                              alert(result.message);
                            }
                          }}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="min-w-[32px] text-center font-semibold">
                          {(cart.find(it => it._id === book._id)?.cartQty || 1)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            increaseQuantity(book._id);
                          }}
                          disabled={!(((cart.find(it => it._id === book._id)?.cartQty || 1) < (book.quantity || 1))) || !book.isAvailable || book.isSold}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                            ((cart.find(it => it._id === book._id)?.cartQty || 1) < (book.quantity || 1)) ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-500 text-white'
                          }`}
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, book)}
                        disabled={addingToCart === book._id || !book.isAvailable || book.isSold}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-primary-600 text-white hover:bg-primary-700"
                      >
                        <FaShoppingCart className="text-xs" />
                        <span>{addingToCart === book._id ? 'Adding...' : 'Add to Cart'}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
