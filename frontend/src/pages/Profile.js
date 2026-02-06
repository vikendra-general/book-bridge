import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaBook, FaPlus, FaSpinner, FaTrash, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaEdit, FaTimes, FaEye, FaUndo } from 'react-icons/fa';
import { indianStates } from '../utils/indianStates';
import { getImageUrl } from '../utils/imageHelper';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderData, setReturnOrderData] = useState(null);
  const [returnFormData, setReturnFormData] = useState({
    reason: '',
    action: 'refund',
    refundMethod: 'original_source'
  });
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfileData(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        await api.delete(`/books/${bookId}`);
        // Remove book from local state
        setProfileData(prev => ({
          ...prev,
          listedBooks: prev.listedBooks.filter(book => book._id !== bookId),
          stats: {
            ...prev.stats,
            totalListed: prev.stats.totalListed - 1,
            availableListed: prev.listedBooks.find(b => b._id === bookId).isAvailable 
              ? prev.stats.availableListed - 1 
              : prev.stats.availableListed
          }
        }));
        alert('Book deleted successfully');
      } catch (error) {
        console.error('Error deleting book:', error);
        alert(error.response?.data?.message || 'Failed to delete book');
      }
    }
  };

  const openReturnModal = (order) => {
    setReturnOrderData(order);
    setReturnFormData({
      reason: '',
      action: 'refund',
      refundMethod: 'original_source'
    });
    setShowReturnModal(true);
  };

  const submitReturnRequest = async (e) => {
    e.preventDefault();
    if (!returnFormData.reason) {
      alert('Please provide a reason for return');
      return;
    }
    
    try {
      await api.put(`/orders/${returnOrderData._id}/return`, {
        returnReason: returnFormData.reason,
        returnAction: returnFormData.action,
        refundMethod: returnFormData.action === 'refund' ? returnFormData.refundMethod : undefined
      });
      alert('Return request submitted successfully');
      setShowReturnModal(false);
      fetchProfile(); // Refresh to show updated status
    } catch (error) {
      console.error('Error returning order:', error);
      alert(error.response?.data?.message || 'Failed to submit return request');
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number
    if (!/^\d{10}$/.test(addressFormData.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const response = await api.put('/users/profile/address', { address: addressFormData });
      setProfileData(prev => ({
        ...prev,
        user: {
            ...prev.user,
            address: response.data.data.address,
            phoneNumber: response.data.data.phoneNumber
        }
      }));
      setShowAddressModal(false);
      alert('Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      alert(error.response?.data?.message || 'Failed to save address');
    }
  };

  const openAddressModal = () => {
    if (profileData?.user?.address) {
      setAddressFormData({
        fullName: profileData.user.address.fullName || '',
        phone: profileData.user.address.phone || profileData.user.phoneNumber || '',
        addressLine1: profileData.user.address.addressLine1 || '',
        addressLine2: profileData.user.address.addressLine2 || '',
        city: profileData.user.address.city || '',
        state: profileData.user.address.state || '',
        pincode: profileData.user.address.pincode || '',
        landmark: profileData.user.address.landmark || ''
      });
    }
    setShowAddressModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Error loading profile</p>
        </div>
      </div>
    );
  }

  const { user, listedBooks, purchasedOrders, salesOrders, stats } = profileData;

  const tabs = [
    { id: 'details', name: 'Personal Details', count: null },
    { id: 'listed', name: 'My Listed Books', count: listedBooks?.length || 0 },
    { id: 'orders', name: 'My Orders', count: (purchasedOrders?.length || 0) + (salesOrders?.length || 0) },
  ];

  const getStatusBadge = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      sold: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      return_requested: 'bg-orange-100 text-orange-800',
      returned: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Welcome back, {user?.username}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">{stats?.totalListed || 0}</div>
            <p className="text-gray-600">Total Listed</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats?.availableListed || 0}</div>
            <p className="text-gray-600">Available</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats?.pendingApproval || 0}</div>
            <p className="text-gray-600">Pending</p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.purchasedCount || 0}</div>
            <p className="text-gray-600">Purchased</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Personal Details Tab */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* User Info */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <FaUser className="mr-2 text-primary-600" /> User Information
                  </h3>
                  <div className="bg-paper rounded-lg p-6 space-y-4 shadow-sm">
                    <div className="flex items-center p-3 bg-white rounded-md">
                      <FaUser className="text-primary-500 mr-4 w-5 h-5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Username</p>
                        <p className="font-medium text-gray-900">{user?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-md">
                      <FaEnvelope className="text-primary-500 mr-4 w-5 h-5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-white rounded-md">
                      <FaPhone className="text-primary-500 mr-4 w-5 h-5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Mobile Number</p>
                        <p className="font-medium text-gray-900">{user?.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-primary-600" /> My Address
                  </h3>
                  <div className="bg-paper rounded-lg p-6 h-full shadow-sm relative">
                    {user?.address?.addressLine1 ? (
                      <div className="h-full">
                        <button 
                          onClick={openAddressModal}
                          className="absolute top-4 right-4 text-primary-600 hover:text-primary-700 p-2 bg-white rounded-full shadow-sm hover:shadow transition-all"
                          title="Edit Address"
                        >
                          <FaEdit size={16} />
                        </button>
                        <div className="pr-8 h-full flex flex-col">
                          <div className="flex-grow">
                            <p className="font-bold text-lg mb-3 text-gray-900">{user.address.fullName}</p>
                            <div className="text-gray-600 space-y-1">
                              <p>{user.address.addressLine1}</p>
                              {user.address.addressLine2 && <p>{user.address.addressLine2}</p>}
                              <p>
                                {user.address.city}, {user.address.state} - <span className="font-medium text-gray-900">{user.address.pincode}</span>
                              </p>
                              {user.address.landmark && (
                                <p className="text-sm mt-2"><span className="font-medium">Landmark:</span> {user.address.landmark}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-gray-700 flex items-center font-medium">
                              <FaPhone className="mr-2 text-primary-500" size={14} />
                              {user.address.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
                          <FaMapMarkerAlt className="text-3xl text-gray-300" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Address Found</h4>
                        <p className="text-gray-500 mb-6 max-w-xs">Add your delivery address to speed up the checkout process.</p>
                        <button 
                          onClick={openAddressModal}
                          className="btn-primary flex items-center"
                        >
                          <FaPlus className="mr-2" /> Click here to add address
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Listed Books Tab */}
            {activeTab === 'listed' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">My Listed Books</h2>
                  <Link
                    to="/sell"
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FaPlus />
                    <span>List New Book</span>
                  </Link>
                </div>
                {listedBooks?.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">You haven't listed any books yet.</p>
                    <Link to="/sell" className="btn-primary inline-block">
                      List Your First Book
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listedBooks.map(book => (
                      <div key={book._id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                        {book.images && book.images.length > 0 ? (
                          <div className="w-full h-64 overflow-hidden bg-gray-100">
                            <img
                              src={getImageUrl(book.images[0])}
                              alt={book.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                            <FaBook className="text-4xl text-gray-400" />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                          <div className="flex items-center space-x-2 mb-3">
                            <p className="text-xl font-bold text-accent-600">₹{book.price}</p>
                            {book.originalPrice > book.price && (
                              <p className="text-sm text-gray-500 line-through">₹{book.originalPrice}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(book.approvalStatus)}`}>
                              {book.approvalStatus}
                            </span>
                            {book.isSold && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                Sold
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <Link
                              to={`/books/${book._id}`}
                              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            >
                              View Details →
                            </Link>
                            <button
                              onClick={() => handleDeleteBook(book._id)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Book"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Orders Tab - Combined Purchased and Sales */}
            {activeTab === 'orders' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">My Orders</h2>
                  <div className="flex space-x-4 mb-4">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Purchased: </span>
                      <span className="font-semibold text-blue-600">{purchasedOrders?.length || 0}</span>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg">
                      <span className="text-sm text-gray-600">Sales: </span>
                      <span className="font-semibold text-green-600">{salesOrders?.length || 0}</span>
                    </div>
                  </div>
                </div>

                {(purchasedOrders?.length === 0 && salesOrders?.length === 0) ? (
                  <div className="text-center py-12">
                    <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">You don't have any orders yet.</p>
                    <Link to="/browse" className="btn-primary inline-block">
                      Browse Books
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Purchased Orders Section */}
                    {purchasedOrders && purchasedOrders.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-blue-600">Purchased Books</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {purchasedOrders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      {order.book?.images && order.book.images.length > 0 && order.book.images[0] ? (
                                        <img
                                          src={getImageUrl(order.book.images[0])}
                                          alt={order.book.title}
                                          className="h-12 w-8 object-contain rounded mr-3"
                                        />
                                      ) : (
                                        <div className="h-12 w-8 bg-gray-100 rounded mr-3 flex items-center justify-center">
                                          <FaBook className="text-gray-400 text-xs" />
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium text-gray-900">{order.book?.title || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">by {order.book?.author || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {order.book?.isOriginal ? 'BookBridge' : (order.seller?.username || 'N/A')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                                    ₹{Math.round(order.totalAmount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.paymentMethod || 'COD'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusBadge(order.status)}`}>
                                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ') : 'Pending'}
                                    </span>
                                    {order.status === 'return_approved' && order.returnPickupDate && (
                                      <div className="text-xs text-red-600 font-semibold mt-1">
                                        Pickup by {new Date(order.returnPickupDate).toLocaleDateString()}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-3">
                                    <button
                                      onClick={() => openOrderModal(order)}
                                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                                      title="View Order Details"
                                    >
                                      <FaEye className="mr-1" /> View
                                    </button>
                                    {order.status === 'delivered' && (
                                      <button
                                        onClick={() => openReturnModal(order)}
                                        className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
                                        title="Return Order"
                                      >
                                        <FaUndo className="mr-1" /> Return
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sales Orders Section */}
                    {salesOrders && salesOrders.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 text-green-600">My Sales</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {salesOrders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      {order.book?.images && order.book.images.length > 0 && order.book.images[0] ? (
                                        <img
                                          src={getImageUrl(order.book.images[0])}
                                          alt={order.book.title}
                                          className="h-12 w-8 object-contain rounded mr-3"
                                        />
                                      ) : (
                                        <div className="h-12 w-8 bg-gray-100 rounded mr-3 flex items-center justify-center">
                                          <FaBook className="text-gray-400 text-xs" />
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium text-gray-900">{order.book?.title || 'N/A'}</div>
                                        <div className="text-sm text-gray-500">by {order.book?.author || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {order.buyer?.username || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                                    ₹{Math.round(order.totalAmount)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.paymentMethod === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.paymentMethod || 'COD'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusBadge(order.status)}`}>
                                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ') : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {order.book && (
                                      <Link
                                        to={`/books/${order.book._id}`}
                                        className="text-primary-600 hover:text-primary-700 font-medium"
                                      >
                                        View Book
                                      </Link>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {profileData?.user?.address?.addressLine1 ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button 
                onClick={() => setShowAddressModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddressSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addressFormData.fullName}
                    onChange={(e) => setAddressFormData({...addressFormData, fullName: e.target.value})}
                    className="input-field"
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={addressFormData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddressFormData({...addressFormData, phone: val});
                    }}
                    className="input-field"
                    required
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addressFormData.addressLine1}
                  onChange={(e) => setAddressFormData({...addressFormData, addressLine1: e.target.value})}
                  className="input-field"
                  required
                  placeholder="House/Flat No., Building Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={addressFormData.addressLine2}
                  onChange={(e) => setAddressFormData({...addressFormData, addressLine2: e.target.value})}
                  className="input-field"
                  required
                  placeholder="Street, Area, Colony"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                    <select
                      value={addressFormData.state}
                      onChange={(e) => setAddressFormData({...addressFormData, state: e.target.value})}
                      className="input-field appearance-none"
                      required
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={addressFormData.city}
                      onChange={(e) => setAddressFormData({...addressFormData, city: e.target.value})}
                      className="input-field"
                      required
                      placeholder="City"
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={addressFormData.pincode}
                    onChange={(e) => {
                       const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                       setAddressFormData({...addressFormData, pincode: val});
                    }}
                    className="input-field"
                    required
                    maxLength={6}
                    placeholder="6-digit pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={addressFormData.landmark}
                    onChange={(e) => setAddressFormData({...addressFormData, landmark: e.target.value})}
                    className="input-field"
                    placeholder="Near..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex space-x-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary py-3">
                    Save Address
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button 
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              {/* Order Info Header */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order ID</p>
                  <p className="font-mono font-medium text-gray-900 text-sm">{selectedOrder._id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).replace('_', ' ') : 'Pending'}
                  </span>
                  {selectedOrder.status === 'return_approved' && selectedOrder.returnPickupDate && (
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      Pickup expected by {new Date(selectedOrder.returnPickupDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Book Details */}
              <div className="flex gap-4">
                {selectedOrder.book?.images && selectedOrder.book.images.length > 0 ? (
                  <img
                    src={getImageUrl(selectedOrder.book.images[0])}
                    alt={selectedOrder.book.title}
                    className="w-24 h-36 object-cover rounded-md shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-36 bg-gray-100 rounded-md flex items-center justify-center">
                    <FaBook className="text-gray-400 text-3xl" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedOrder.book?.title}</h3>
                  <p className="text-gray-600">by {selectedOrder.book?.author}</p>
                  <p className="text-primary-600 font-bold mt-2">₹{selectedOrder.book?.price}</p>
                  <p className="text-sm text-gray-500 mt-1">Seller: {selectedOrder.book?.isOriginal ? 'BookBridge' : selectedOrder.seller?.username}</p>
                </div>
              </div>

              {/* Payment & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Info</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Method: {selectedOrder.paymentMethod}</p>
                    <p>Amount: ₹{selectedOrder.totalAmount}</p>
                    <p>Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{selectedOrder.shippingAddress?.fullName}</p>
                    <p>{selectedOrder.shippingAddress?.addressLine1}</p>
                    {selectedOrder.shippingAddress?.addressLine2 && <p>{selectedOrder.shippingAddress?.addressLine2}</p>}
                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                    <p>Phone: {selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t flex justify-end space-x-4">
                 <Link
                    to={`/books/${selectedOrder.book?._id}`}
                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    View Book Page
                  </Link>
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => {
                      closeOrderModal();
                      openReturnModal(selectedOrder);
                    }}
                    className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors flex items-center"
                  >
                    <FaUndo className="mr-2" /> Request Return
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Return Request</h2>
                <button 
                  onClick={() => setShowReturnModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>

              <form onSubmit={submitReturnRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
                  <select
                    value={returnFormData.reason}
                    onChange={(e) => setReturnFormData({...returnFormData, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Damaged/Defective">Damaged or Defective</option>
                    <option value="Not as Described">Not as Described</option>
                    <option value="Wrong Item">Wrong Item Sent</option>
                    <option value="Changed Mind">Changed Mind</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Action</label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="refund"
                        checked={returnFormData.action === 'refund'}
                        onChange={(e) => setReturnFormData({...returnFormData, action: e.target.value})}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                      />
                      Refund
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="replace"
                        checked={returnFormData.action === 'replace'}
                        onChange={(e) => setReturnFormData({...returnFormData, action: e.target.value})}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                      />
                      Replacement
                    </label>
                  </div>
                </div>

                {returnFormData.action === 'refund' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
                    <select
                      value={returnFormData.refundMethod}
                      onChange={(e) => setReturnFormData({...returnFormData, refundMethod: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="original_source">Original Payment Source</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="store_credit">Store Credit</option>
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;