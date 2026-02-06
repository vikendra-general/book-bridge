import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../services/api';
import { FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageHelper';

const Payment = () => {
  const { user } = useContext(AuthContext);
  const { cart, getCartTotal, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const deliveryAddress = location.state?.deliveryAddress;

  useEffect(() => {
    if (cart.length === 0 || !deliveryAddress) {
      navigate('/checkout');
    }
  }, [cart, deliveryAddress, navigate]);

  const total = getCartTotal();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    try {
      // Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        setError('Failed to load payment gateway. Please try again.');
        return;
      }

      // Create Razorpay order
      const bookIds = cart.flatMap(item => Array(item.cartQty || 1).fill(item._id));
      const response = await api.post('/orders/create-razorpay-order', {
        amount: Math.round(total) * 100, // Convert to paise
        books: bookIds
      });

      const { orderId, amount, currency } = response.data;

      const options = {
        key: 'rzp_test_S2fnUBXXQtdwub',
        amount: amount,
        currency: currency || 'INR',
        name: 'Book Bridge',
        description: `Order for ${cart.length} book(s)`,
        order_id: orderId,
        handler: async function (response) {
          // Payment successful
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: deliveryAddress.fullName,
          email: user.email,
          contact: deliveryAddress.phone
        },
        theme: {
          color: '#0ea5e9'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(true);
    } catch (error) {
      console.error('Razorpay error:', error);
      setError(error.response?.data?.message || 'Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse) => {
    try {
      // Create order with payment details
      const bookIds = cart.flatMap(item => Array(item.cartQty || 1).fill(item._id));
      const orderData = {
        books: bookIds,
        deliveryAddress,
        paymentMethod: 'online',
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      };

      const response = await api.post('/orders', orderData);
      
      // Show success message
      alert('✅ Order placed successfully! A confirmation email has been sent to your email address.');
      
      // Clear cart
      clearCart();
      
      // Redirect to confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderId: razorpayResponse.razorpay_order_id,
          paymentId: razorpayResponse.razorpay_payment_id,
          orders: response.data.data
        } 
      });
    } catch (error) {
      console.error('Order creation error:', error);
      setError('Payment successful but order creation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCODOrder = async () => {
    setProcessing(true);
    setError('');

    try {
      const bookIds = cart.flatMap(item => Array(item.cartQty || 1).fill(item._id));
      const orderData = {
        books: bookIds,
        deliveryAddress,
        paymentMethod: 'cod'
      };

      const response = await api.post('/orders', orderData);
      
      // Show success message
      alert('✅ Order placed successfully! A confirmation email has been sent to your email address.');
      
      // Clear cart
      clearCart();
      
      // Redirect to confirmation
      navigate('/order-confirmation', { 
        state: { 
          paymentMethod: 'cod',
          orders: response.data.data
        } 
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'cod') {
      handleCODOrder();
    } else {
      handleRazorpayPayment();
    }
  };

  if (!deliveryAddress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Select Payment Method</h2>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <FaMoneyBillWave className="ml-3 text-2xl text-green-600" />
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-lg">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when you receive the book</p>
                    </div>
                  </div>
                </div>

                {/* Online Payment */}
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <FaCreditCard className="ml-3 text-2xl text-blue-600" />
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-lg">Online Payment</h3>
                      <p className="text-sm text-gray-600">Pay securely with Razorpay</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full btn-primary py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
              </button>
            </div>

            {/* Delivery Address Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
              <div className="text-gray-700">
                <p className="font-medium">{deliveryAddress.fullName}</p>
                <p>{deliveryAddress.addressLine1}</p>
                {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
                <p>{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}</p>
                {deliveryAddress.landmark && <p>Landmark: {deliveryAddress.landmark}</p>}
                <p className="mt-2">Phone: {deliveryAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center space-x-3">
                    {item.images && item.images.length > 0 && (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-gray-600">by {item.author}</p>
                      <p className="text-primary-600 font-semibold">₹{Math.round(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{Math.round(total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-semibold">Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary-600">₹{Math.round(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
