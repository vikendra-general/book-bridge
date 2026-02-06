import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaSearch, FaBook, FaArrowRight, FaShoppingCart, FaPlus, FaMinus, FaStar } from 'react-icons/fa';
import logo from '../assets/bookbridgelogo.jpg';
import academicLogo from '../assets/academiclogo.jpg';
import biographyLogo from '../assets/biographylogo.jpg';
import childrenLogo from '../assets/childrenlogo.jpg';
import crimeLogo from '../assets/crimelogo.jpg';
import fantasyLogo from '../assets/fantasylogo.jpg';
import horrorLogo from '../assets/horrorlogo.jpg';
import mysteryLogo from '../assets/mysterylogo.jpg';
import romanceLogo from '../assets/romancelogo.jpg';
import scienceFictionLogo from '../assets/sciencefictionlogo.jpg';
import selfHelpLogo from '../assets/selfhelplogo.jpg';
import thrillerLogo from '../assets/thrillerlogo.jpg';
import { getImageUrl } from '../utils/imageHelper';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart, increaseQuantity, decreaseQuantity, cart } = useContext(CartContext);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  const categoryLogos = {
    fantasy: fantasyLogo,
    thriller: thrillerLogo,
    crime: crimeLogo,
    mystery: mysteryLogo,
    romance: romanceLogo,
    'science-fiction': scienceFictionLogo,
    horror: horrorLogo,
    biography: biographyLogo,
    'self-help': selfHelpLogo,
    academic: academicLogo,
    children: childrenLogo
  };

  const getCategoryLogo = (category) => {
    if (!category || !category.slug) {
      return null;
    }
    return categoryLogos[category.slug] || null;
  };

  useEffect(() => {
    fetchFeaturedBooks();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeaturedBooks = async () => {
    try {
      const response = await api.get('/books?limit=8');
      setFeaturedBooks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
    }
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
    
    if (result.success) {
      alert('Continue shopping');
    } else {
      alert(result.message);
    }
    setAddingToCart(null);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-4">
              <img src={logo} alt="BookBridge Logo" className="h-16 w-auto" />
              BookBridge
            </h1>
            <p className="text-xl md:text-2xl mb-2 font-light">
              A Home for Readers and Book Lovers
            </p>
            <p className="text-lg mb-8 text-primary-100">
              Connect with book lovers, discover new reads, and give your books a new home
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none text-lg"
                    placeholder="Search for books by title, author, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <FaSearch />
                  <span>Search</span>
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/browse"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 text-lg"
              >
                <FaBook />
                <span>Browse Books</span>
              </Link>
              <Link
                to="/sell"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors flex items-center space-x-2 text-lg"
              >
                <FaShoppingCart />
                <span>Sell a Book</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
              <Link
                to="/browse"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1"
              >
                <span>View All</span>
                <FaArrowRight />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map((category) => (
                <Link
                  key={category._id}
                  to={`/browse?category=${category.slug}`}
                  className="card p-6 text-center hover:shadow-lg transition-shadow group"
                >
                  <div className="mb-3 group-hover:scale-110 transition-transform">
                    {getCategoryLogo(category) ? (
                      <img
                        src={getCategoryLogo(category)}
                        alt={`${category.name} logo`}
                        className="h-20 md:h-24 w-auto mx-auto"
                      />
                    ) : (
                      <span className="text-4xl">📖</span>
                    )}
                  </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {category.name}
              </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Books Section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Books</h2>
            <Link
              to="/browse"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <FaArrowRight />
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading books...</p>
            </div>
          ) : featuredBooks.length === 0 ? (
            <div className="text-center py-12">
              <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No books available yet</p>
              <Link
                to="/sell"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Be the first to list a book!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredBooks.filter(book => !book.isSold && book.isAvailable).map((book) => (
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
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
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
                        <p className="text-xs text-gray-500 mb-2">
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
                    {user && book.seller && (book.seller._id === user.id || book.seller === user.id) ? (
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
                            const result = decreaseQuantity(book._id);
                            alert(result.message);
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
                            // No popup needed for simple increment
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
        </section>
      </div>
    </div>
  );
};

export default Home;
