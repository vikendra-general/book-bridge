import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaBook, FaShoppingCart, FaCheckCircle, FaTimesCircle, FaClock, FaChevronLeft, FaChevronRight, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageHelper';

const BookDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { increaseQuantity, decreaseQuantity, addQuantity, cart } = useContext(CartContext);
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchBook = useCallback(async () => {
    try {
      const response = await api.get(`/books/${id}`);
      setBook(response.data.data);
      const rv = response.data.data.reviews || [];
      setReviews(rv);
      setRatingCount(response.data.data.ratingCount || rv.length);
      setRatingAverage(response.data.data.ratingAverage || 0);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const nextImage = () => {
    if (book?.images) {
      setCurrentImageIndex((prev) => (prev === book.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (book?.images) {
      setCurrentImageIndex((prev) => (prev === 0 ? book.images.length - 1 : prev - 1));
    }
  };


  const handleDeleteBook = async () => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        await api.delete(`/books/${id}`);
        alert('Book deleted successfully');
        navigate('/profile');
      } catch (error) {
        console.error('Error deleting book:', error);
        alert(error.response?.data?.message || 'Failed to delete book');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Book not found</p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-4 btn-primary"
          >
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user && (user.id === book.seller?._id || user.id === book.seller);
  const canPurchase = user && !isOwner && book.isAvailable && !book.isSold && book.approvalStatus === 'approved';
  const isInCart = cart.some(item => item._id === book._id);

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Book Image */}
            <div className="md:w-1/3 bg-gray-100 p-8 flex flex-col items-center justify-center min-h-[400px]">
              {book.images && book.images.length > 0 ? (
                <div className="w-full">
                  <div className="relative h-96 mb-4 group">
                    <img
                      src={getImageUrl(book.images[currentImageIndex])}
                      alt={`${book.title} - View ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'block';
                        }
                      }}
                    />
                    
                    {/* Navigation Arrows */}
                    {book.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-r-lg hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100 focus:outline-none"
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-l-lg hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100 focus:outline-none"
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {book.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2 justify-center scrollbar-hide">
                      {book.images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 border-2 rounded-md overflow-hidden transition-all ${
                            currentImageIndex === index ? 'border-primary-600 scale-105 shadow-md' : 'border-gray-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <FaBook className="text-9xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No image available</p>
                </div>
              )}
            </div>

            {/* Book Details */}
            <div className="md:w-2/3 p-8">
              {/* Status Badge */}
              <div className="mb-4">
                {book.approvalStatus === 'pending' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <FaClock className="mr-2" />
                    Pending Approval
                  </span>
                )}
                {book.approvalStatus === 'approved' && book.isAvailable && !book.isSold && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent-100 text-accent-800">
                    <FaCheckCircle className="mr-2" />
                    Available
                  </span>
                )}
                {book.isSold && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <FaTimesCircle className="mr-2" />
                    Out of Stock
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-3">
                  <p className="text-4xl font-bold text-accent-600">₹{Math.round(book.price)}</p>
                  {book.discountPercent > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {Math.round(book.discountPercent)}% OFF
                    </span>
                  )}
                </div>
                {book.originalPrice && (
                  <p className="text-gray-500 line-through">₹{Math.round(book.originalPrice)}</p>
                )}
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                  {book.condition?.replace('_', ' ')}
                </span>
                {book.category && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    {book.category.name}
                  </span>
                )}
              </div>

              {/* Return Policy */}
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
                <div className="flex items-center">
                  <FaCheckCircle className="text-blue-500 mr-2" />
                  <p className="text-sm text-blue-700 font-medium">
                    7 Days Return Policy: This book can be returned within 7 days of delivery.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
              {book.adminNotes && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.adminNotes}</p>
                </div>
              )}

              {/* Details */}
              <div className="mb-6 bg-paper rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Book Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  {book.edition && (
                    <div>
                      <p className="text-sm text-gray-600">Edition</p>
                      <p className="font-medium">{book.edition}</p>
                    </div>
                  )}
                  {book.quantity && book.quantity > 1 && (
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-medium">{book.quantity}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="font-medium capitalize">{book.condition?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seller</p>
                    <p className="font-medium">{book.isOriginal ? 'BookBridge' : (book.seller?.username || 'N/A')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{book.isOriginal ? 'bookbridge@gmail.com' : (book.sellerContact || 'N/A')}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {canPurchase && (
                  <>
                    {!isInCart && (
                      <button
                        onClick={() => {
                          const result = addQuantity(book, 1);
                          if (result.success) {
                            alert(result.message);
                          } else {
                            alert(result.message);
                          }
                        }}
                        className="flex items-center space-x-2 text-lg px-8 py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaShoppingCart />
                        <span>Add to Cart</span>
                      </button>
                    )}
                    {isInCart && (
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const currentQty = (cart.find(it => it._id === book._id)?.cartQty || 1);
                            const result = decreaseQuantity(book._id);
                            if (currentQty === 1) {
                              alert(result.message);
                            }
                          }}
                          className="flex items-center text-lg px-6 py-3 bg-gray-200 text-gray-800 rounded"
                        >
                          <FaMinus />
                        </button>
                        <span className="min-w-[40px] text-center text-2xl font-bold">
                          {(cart.find(it => it._id === book._id)?.cartQty || 1)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const cartQty = (cart.find(it => it._id === book._id)?.cartQty || 1);
                            const stockQty = (book.quantity || 1);
                            const canIncrease = cartQty < stockQty;
                            if (!canIncrease) return;
                            increaseQuantity(book._id);
                          }}
                          disabled={!(((cart.find(it => it._id === book._id)?.cartQty || 1) < (book.quantity || 1)))}
                          className={`flex items-center text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                            ((cart.find(it => it._id === book._id)?.cartQty || 1) < (book.quantity || 1)) ? 'btn-primary' : 'bg-gray-500 text-white rounded-lg'
                          }`}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    )}
                  </>
                )}
                {isOwner && (
                  <div className="w-full p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 font-medium mb-2">This is your listed book</p>
                    <div className="flex space-x-4">
                      <Link
                        to="/profile"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        View in your profile
                      </Link>
                      <button
                        onClick={handleDeleteBook}
                        className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                      >
                        <FaTrash className="text-sm" />
                        <span>Delete Book</span>
                      </button>
                    </div>
                  </div>
                )}
                {!user && (
                  <div className="w-full">
                    <p className="text-gray-600 mb-2">Please login to purchase this book</p>
                    <Link
                      to="/login"
                      className="btn-primary inline-block"
                    >
                      Login to Buy
                    </Link>
                  </div>
                )}
              </div>

              <div id="reviews" className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  <div className="text-sm text-gray-600">
                    {ratingCount > 0 ? (
                      <span>{ratingAverage} / 5 · {ratingCount} review{ratingCount > 1 ? 's' : ''}</span>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </div>
                </div>

                {reviews.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {reviews.map((r, idx) => (
                      <div key={idx} className="bg-paper rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{r.username || 'User'}</p>
                          <p className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <p className="text-amber-600 font-medium mb-2">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </p>
                        <p className="text-gray-700">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
                  {!user ? (
                    <div className="text-gray-600">
                      Please <Link to="/login" className="text-primary-600 underline">login</Link> to write a review.
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setReviewSubmitting(true);
                        try {
                          const resp = await api.post(`/books/${id}/reviews`, {
                            rating: reviewForm.rating,
                            comment: reviewForm.comment
                          });
                          const data = resp.data.data;
                          setReviews(data.reviews || []);
                          setRatingAverage(data.ratingAverage || 0);
                          setRatingCount(data.ratingCount || 0);
                          setReviewForm({ rating: 5, comment: '' });
                          alert('Review submitted');
                        } catch (error) {
                          alert(error.response?.data?.message || 'Failed to submit review');
                        } finally {
                          setReviewSubmitting(false);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <select
                          className="input-field max-w-[160px]"
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                        >
                          {[5,4,3,2,1].map(val => (
                            <option key={val} value={val}>
                              {val} - {val === 5 ? 'Excellent' : val === 4 ? 'Good' : val === 3 ? 'Average' : val === 2 ? 'Fair' : 'Poor'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                        <textarea
                          className="input-field"
                          rows="4"
                          placeholder="Share your experience with this book..."
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={reviewSubmitting || !reviewForm.comment.trim()}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
