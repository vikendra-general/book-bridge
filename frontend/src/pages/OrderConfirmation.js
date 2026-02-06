import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaShoppingCart } from 'react-icons/fa';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderId, paymentId, paymentMethod } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <FaCheckCircle className="text-6xl text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-semibold text-gray-900">{orderId}</p>
              {paymentId && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Payment ID</p>
                  <p className="font-semibold text-gray-900">{paymentId}</p>
                </>
              )}
            </div>
          )}

          {paymentMethod === 'cod' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">
                <strong>Cash on Delivery:</strong> Please keep the exact amount ready when the delivery arrives.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/orders"
              className="btn-primary inline-flex items-center space-x-2 px-6 py-3"
            >
              <FaShoppingCart />
              <span>View My Orders</span>
            </Link>
            
            <Link
              to="/"
              className="btn-secondary inline-flex items-center space-x-2 px-6 py-3 ml-4"
            >
              <FaHome />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
