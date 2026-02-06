import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  FaBook, FaUsers, FaShoppingCart, 
  FaSpinner, FaCheck, FaTimes, FaSearch, FaEnvelope, FaTrash, FaRupeeSign, FaPaperPlane 
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookNotes, setBookNotes] = useState('');
  const [bookModalLoading, setBookModalLoading] = useState(false);
  
  // Reply Modal States
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Order Management States
  const [orderTab, setOrderTab] = useState('new'); // new, active, completed

  const [filters, setFilters] = useState({
    bookStatus: 'pending',
    orderStatus: '',
    userSearch: ''
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.bookStatus) params.append('status', filters.bookStatus);
      const response = await api.get(`/admin/books?${params.toString()}`);
      setBooks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.bookStatus]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Derive status directly from orderTab
      let status = '';
      if (orderTab === 'new') status = 'processing';
      else if (orderTab === 'active') status = 'in_transit,picked_up';
      else if (orderTab === 'completed') status = 'delivered';
      else if (orderTab === 'returned') status = 'return_requested,return_approved,return_rejected,returned';
      
      if (status) params.append('status', status);
      const response = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [orderTab]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.userSearch) params.append('search', filters.userSearch);
      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.userSearch]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/contact');
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'books') {
      fetchBooks();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab, filters, fetchDashboard, fetchBooks, fetchOrders, fetchUsers, fetchMessages]);

  const handleApproveBook = async (bookId) => {
    setActionLoading(bookId);
    try {
      await api.put(`/admin/books/${bookId}/approve`);
      await fetchBooks();
      await fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Error approving book');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBook = async (bookId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setActionLoading(bookId);
    try {
      await api.put(`/admin/books/${bookId}/reject`, { rejectionReason: reason });
      await fetchBooks();
      await fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Error rejecting book');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      let returnPickupDate = null;
      if (status === 'return_approved') {
        const dateStr = prompt('Please enter expected pickup date (YYYY-MM-DD):');
        if (!dateStr) {
          setActionLoading(null);
          return; // Cancel update if no date provided
        }
        // Basic validation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          alert('Invalid date format. Please use YYYY-MM-DD.');
          setActionLoading(null);
          return;
        }
        returnPickupDate = dateStr;
      }

      await api.put(`/admin/orders/${orderId}/status`, { 
        status,
        returnPickupDate 
      });
      await fetchOrders();
      await fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/block`, { action });
      await fetchUsers();
      await fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating user');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to admin?')) return;
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/promote`);
      await fetchUsers();
      await fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Error promoting user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setActionLoading(messageId);
    try {
      await api.delete(`/contact/${messageId}`);
      await fetchMessages();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting message');
    } finally {
      setActionLoading(null);
    }
  };

  const openBookModal = (book) => {
    setSelectedBook(book);
    setBookNotes(book.adminNotes || '');
    setShowBookModal(true);
  };

  const closeBookModal = () => {
    if (bookModalLoading) return;
    setShowBookModal(false);
    setSelectedBook(null);
    setBookNotes('');
  };

  const handleSaveBookInfo = async () => {
    if (!selectedBook) return;
    setBookModalLoading(true);
    try {
      await api.put(`/admin/books/${selectedBook._id}`, { adminNotes: bookNotes });
      await fetchBooks();
      await fetchDashboard();
      setShowBookModal(false);
      setSelectedBook(null);
      setBookNotes('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving book information');
    } finally {
      setBookModalLoading(false);
    }
  };

  const openReplyModal = (message) => {
    setSelectedMessage(message);
    setReplyText(message.reply || '');
    setShowReplyModal(true);
  };

  const closeReplyModal = () => {
    if (replyLoading) return;
    setShowReplyModal(false);
    setSelectedMessage(null);
    setReplyText('');
  };

  const handleReplyMessage = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      await api.put(`/contact/${selectedMessage._id}/reply`, { reply: replyText });
      await fetchMessages();
      closeReplyModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteBookAdmin = async () => {
    if (!selectedBook) return;
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) return;
    setBookModalLoading(true);
    try {
      await api.delete(`/admin/books/${selectedBook._id}`);
      await fetchBooks();
      await fetchDashboard();
      setShowBookModal(false);
      setSelectedBook(null);
      setBookNotes('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting book');
    } finally {
      setBookModalLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FaBook },
    { id: 'books', name: 'Books', icon: FaBook },
    { id: 'orders', name: 'Orders', icon: FaShoppingCart },
    { id: 'users', name: 'Users', icon: FaUsers },
    { id: 'messages', name: 'Messages', icon: FaEnvelope },
  ];

  if (loading && activeTab === 'dashboard' && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage books, orders, and users</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && dashboardData && (
              <div>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                      </div>
                      <FaUsers className="text-4xl text-primary-600" />
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Books</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalBooks || 0}</p>
                      </div>
                      <FaBook className="text-4xl text-blue-600" />
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending Approval</p>
                        <p className="text-3xl font-bold text-yellow-600">{stats.pendingBooks || 0}</p>
                      </div>
                      <FaSpinner className="text-4xl text-yellow-600" />
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Orders</p>
                        <p className="text-3xl font-bold text-green-600">{stats.activeOrders || 0}</p>
                      </div>
                      <FaShoppingCart className="text-4xl text-green-600" />
                    </div>
                  </div>
                  <div className="card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
                      </div>
                      <FaRupeeSign className="text-4xl text-indigo-600" />
                    </div>
                  </div>
                </div>

      {/* Recent Books */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="text-xl font-bold mb-4">Recent Books</h3>
                    {dashboardData.recentBooks?.length === 0 ? (
                      <p className="text-gray-500">No recent books</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData.recentBooks?.slice(0, 5).map(book => (
                          <div key={book._id} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                            <div>
                              <p className="font-medium">{book.title}</p>
                              <p className="text-sm text-gray-600">by {book.author}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              book.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              book.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {book.approvalStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
            </div>

                  <div className="card p-6">
                    <h3 className="text-xl font-bold mb-4">Recent Orders</h3>
                    {dashboardData.recentOrders?.length === 0 ? (
                      <p className="text-gray-500">No recent orders</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData.recentOrders?.slice(0, 5).map(order => (
                          <div key={order._id} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                            <div>
                              <p className="font-medium">{order.book?.title || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{order.status}</p>
                            </div>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
              )}
            </div>
                </div>
              </div>
            )}

            {/* Books Tab */}
            {activeTab === 'books' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Book Management</h2>
                  <select
                    className="input-field w-48"
                    value={filters.bookStatus}
                    onChange={(e) => setFilters({ ...filters, bookStatus: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading books...</p>
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No books found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-paper">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {books.map(book => (
                          <tr key={book._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium">{book.title}</div>
                              <div className="text-sm text-gray-500">by {book.author}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{book.quantity || 0}</td>
                            <td className="px-6 py-4 text-sm">{book.isOriginal ? 'BookBridge' : (book.seller?.username || 'N/A')}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{Math.round(book.price)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                book.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                book.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {book.approvalStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {book.approvalStatus === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveBook(book._id)}
                                      disabled={actionLoading === book._id}
                                      className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                    >
                                      {actionLoading === book._id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                    </button>
                                    <button
                                      onClick={() => handleRejectBook(book._id)}
                                      disabled={actionLoading === book._id}
                                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                    >
                                      {actionLoading === book._id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => openBookModal(book)}
                                  className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  Manage
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">Order Management</h2>
                  
                  {/* Order Status Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                      <button
                        onClick={() => setOrderTab('new')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          orderTab === 'new'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        New Orders (Processing)
                      </button>
                      <button
                        onClick={() => setOrderTab('active')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          orderTab === 'active'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Active Orders (In Transit)
                      </button>
                      <button
                        onClick={() => setOrderTab('completed')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          orderTab === 'completed'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Completed Orders
                      </button>
                      <button
                        onClick={() => setOrderTab('returned')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                          orderTab === 'returned'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Returned Orders
                      </button>
                    </nav>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-paper">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium">{order.book?.title || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm">{order.quantity || 1}</td>
                            <td className="px-6 py-4 text-sm">{order.buyer?.username || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm">{order.book?.isOriginal ? 'BookBridge' : (order.seller?.username || 'N/A')}</td>
                            <td className="px-6 py-4 text-sm font-semibold">₹{Math.round(order.totalAmount)}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {order.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {orderTab === 'new' && (
                                <div className="relative">
                                  {actionLoading === order._id ? (
                                    <div className="px-3 py-1"><FaSpinner className="animate-spin text-blue-600" /></div>
                                  ) : (
                                    <select
                                      className="block w-full pl-2 pr-8 py-1 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white border shadow-sm"
                                      value="processing"
                                      onChange={(e) => {
                                        if (e.target.value === 'in_transit') {
                                          handleUpdateOrderStatus(order._id, 'in_transit');
                                        }
                                      }}
                                    >
                                      <option value="processing">New</option>
                                      <option value="in_transit">Processed</option>
                                    </select>
                                  )}
                                </div>
                              )}
                              
                              {orderTab === 'active' && (
                                <div className="relative">
                                  {actionLoading === order._id ? (
                                    <div className="px-3 py-1"><FaSpinner className="animate-spin text-blue-600" /></div>
                                  ) : (
                                    <select
                                      className="block w-full pl-2 pr-8 py-1 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white border shadow-sm"
                                      value={order.status === 'in_transit' || order.status === 'picked_up' ? order.status : 'in_transit'}
                                      onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                    >
                                      <option value="in_transit">In Transit</option>
                                      <option value="picked_up">Picked Up</option>
                                      <option value="delivered">Delivered</option>
                                    </select>
                                  )}
                                </div>
                              )}

                              {orderTab === 'completed' && (
                                <span className="flex items-center text-green-600 font-medium text-sm">
                                  <FaCheck className="mr-1" /> Completed
                                </span>
                              )}

                              {orderTab === 'returned' && (
                                <div className="flex flex-col">
                                  <div className="relative">
                                    {actionLoading === order._id ? (
                                      <div className="px-3 py-1"><FaSpinner className="animate-spin text-blue-600" /></div>
                                    ) : (
                                      <select
                                        className="block w-full pl-2 pr-8 py-1 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-white border shadow-sm"
                                        value={order.status}
                                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                        disabled={order.status === 'returned' || order.status === 'return_rejected'}
                                      >
                                        <option value="return_requested">Requested</option>
                                        <option value="return_approved">Approve Return</option>
                                        <option value="return_rejected">Reject Return</option>
                                        <option value="returned">Mark Refunded</option>
                                      </select>
                                    )}
                                  </div>
                                  {order.returnReason && (
                                    <span className="text-xs text-red-600 mt-1 font-medium">
                                      Reason: {order.returnReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <div className="relative w-64">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="input-field pl-10"
                      placeholder="Search users..."
                      value={filters.userSearch}
                      onChange={(e) => setFilters({ ...filters, userSearch: e.target.value })}
                    />
          </div>
        </div>

                {loading ? (
                  <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
            </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-paper">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{user.username}</td>
                            <td className="px-6 py-4 text-sm">{user.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Blocked'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {user.role !== 'admin' && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleBlockUser(user._id, user.isActive ? 'block' : 'unblock')}
                                    disabled={actionLoading === user._id}
                                    className={`px-3 py-1 rounded text-sm font-medium ${
                                      user.isActive
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    } disabled:opacity-50`}
                                  >
                                    {actionLoading === user._id ? (
                                      <FaSpinner className="animate-spin" />
                                    ) : (
                                      user.isActive ? 'Block' : 'Unblock'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handlePromoteUser(user._id)}
                                    disabled={actionLoading === user._id}
                                    className="px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50"
                                  >
                                    {actionLoading === user._id ? <FaSpinner className="animate-spin" /> : 'Promote to Admin'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Messages</h2>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <FaEnvelope className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No messages found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-paper">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {messages.map(msg => (
                          <tr key={msg._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium">{msg.name}</td>
                            <td className="px-6 py-4 text-sm">{msg.email}</td>
                            <td className="px-6 py-4 text-sm font-medium">{msg.subject}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={msg.message}>
                              {msg.message}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openReplyModal(msg)}
                                  className={`p-2 rounded ${msg.reply ? 'text-green-600 hover:bg-green-100' : 'text-blue-600 hover:bg-blue-100'}`}
                                  title={msg.reply ? "View/Edit Reply" : "Reply"}
                                >
                                  {msg.reply ? <FaCheck /> : <FaEnvelope />}
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  disabled={actionLoading === msg._id}
                                  className="p-2 rounded text-red-600 hover:bg-red-100 disabled:opacity-50"
                                  title="Delete Message"
                                >
                                  {actionLoading === msg._id ? (
                                    <FaSpinner className="animate-spin" />
                                  ) : (
                                    <FaTrash />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showBookModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Manage Book</h2>
              <button
                onClick={closeBookModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-medium text-gray-900">{selectedBook.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Author</p>
                <p className="font-medium text-gray-900">{selectedBook.author}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium text-gray-900">
                    {selectedBook.isOriginal ? 'BookBridge' : (selectedBook.seller?.username || 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-gray-900 capitalize">{selectedBook.approvalStatus}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium text-gray-900">₹{Math.round(selectedBook.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-medium text-gray-900">{selectedBook.quantity || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                <textarea
                  className="input-field h-32"
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Add extra information about this book..."
                />
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={handleDeleteBookAdmin}
                  disabled={bookModalLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  {bookModalLoading ? 'Processing...' : 'Delete Book'}
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={closeBookModal}
                    disabled={bookModalLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBookInfo}
                    disabled={bookModalLoading}
                    className="btn-primary py-2 disabled:opacity-50"
                  >
                    {bookModalLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Reply to Message</h2>
              <button
                onClick={closeReplyModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium text-gray-900">{selectedMessage.name} ({selectedMessage.email})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Message</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">{selectedMessage.message}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Reply</label>
                <textarea
                  className="input-field h-32 w-full p-2 border rounded-lg"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={closeReplyModal}
                  disabled={replyLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReplyMessage}
                  disabled={replyLoading || !replyText.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {replyLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
