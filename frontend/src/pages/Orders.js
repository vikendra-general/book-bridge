import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaBook, FaSpinner } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageHelper';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [type, setType] = useState('buyer');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/orders/my-orders?type=${type}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status) => {
    const colors = {
      processing: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your purchases and sales</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex space-x-4">
          <button
            onClick={() => setType('buyer')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                type === 'buyer'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
              Purchased ({orders.filter(o => type === 'buyer').length})
          </button>
          <button
            onClick={() => setType('seller')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                type === 'seller'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
              Sales ({orders.filter(o => type === 'seller').length})
          </button>
        </div>
      </div>

        {/* Orders List */}
      {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No orders found</p>
            <Link to="/browse" className="btn-primary inline-block">
              Browse Books
            </Link>
        </div>
      ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-paper">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {type === 'buyer' ? 'Seller' : 'Buyer'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {order.book?.images && order.book.images.length > 0 && order.book.images[0] ? (
                            <img
                              src={getImageUrl(order.book.images[0])}
                              alt={order.book.title}
                              className="h-16 w-12 object-cover rounded mr-4"
                            />
                          ) : (
                            <div className="h-16 w-12 bg-gray-100 rounded mr-4 flex items-center justify-center">
                              <FaBook className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{order.book?.title || 'N/A'}</div>
                            <div className="text-sm text-gray-500">by {order.book?.author || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {type === 'buyer' ? (order.book?.isOriginal ? 'BookBridge' : (order.seller?.username || 'N/A')) : (order.buyer?.username || 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                        ₹{Math.round(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status?.replace('_', ' ')}
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
    </div>
  );
};

export default Orders;
