import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../services/api';
import { FaMapMarkerAlt, FaUser, FaPhone, FaHome, FaCity, FaChevronDown, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageHelper';
import { indianStates, popularCities } from '../utils/indianStates';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { cart, getCartTotal, removeFromCart, increaseQuantity, decreaseQuantity } = useContext(CartContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [citySuggestions, setCitySuggestions] = useState([]);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/browse');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const userData = response.data.data.user;
        setProfileData(userData);

        // Load saved address from user profile if exists
        if (userData && userData.address && userData.address.addressLine1) {
          setUseSavedAddress(true);
          setFormData({
            fullName: userData.address.fullName || '',
            phone: userData.address.phone || userData.phoneNumber || '',
            addressLine1: userData.address.addressLine1 || '',
            addressLine2: userData.address.addressLine2 || '',
            city: userData.address.city || '',
            state: userData.address.state || '',
            pincode: userData.address.pincode || '',
            landmark: userData.address.landmark || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setPageLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setPageLoading(false);
    }
  }, [user, cart, navigate]);

  // Handle address type toggle
  const handleAddressTypeChange = (useSaved) => {
    setUseSavedAddress(useSaved);
    if (useSaved && profileData?.address) {
      setFormData({
        fullName: profileData.address.fullName || '',
        phone: profileData.address.phone || profileData.phoneNumber || '',
        addressLine1: profileData.address.addressLine1 || '',
        addressLine2: profileData.address.addressLine2 || '',
        city: profileData.address.city || '',
        state: profileData.address.state || '',
        pincode: profileData.address.pincode || '',
        landmark: profileData.address.landmark || ''
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: ''
      });
      setSavingAddress(true); // Default to saving new address
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Show city suggestions when state is selected
    if (name === 'state' && value) {
      const cities = popularCities[value] || [];
      setCitySuggestions(cities);
    } else if (name === 'state' && !value) {
      setCitySuggestions([]);
    }
  };

  const handleCitySuggestionClick = (city) => {
    setFormData({ ...formData, city });
    setCitySuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.fullName || !formData.phone || !formData.addressLine1 || !formData.addressLine2 ||
        !formData.city || !formData.state || !formData.pincode) {
      alert('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate pincode
    if (!/^\d{6}$/.test(formData.pincode)) {
      alert('Pincode must be exactly 6 digits');
      setLoading(false);
      return;
    }

    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Please enter a valid 10-digit mobile number');
      setLoading(false);
      return;
    }

    try {
      // Save address to user profile
      if (savingAddress) {
        await api.put('/users/profile/address', { address: formData });
      }

      // Proceed to payment page
      navigate('/payment', { state: { deliveryAddress: formData } });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving address');
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal();
  const deliveryFee = total >= 999 ? 0 : 49;
  const finalTotal = total + deliveryFee;
  const promoNeeded = total < 999 ? (999 - total) : 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Address Form */}
          <div className="lg:col-span-2">
            {/* Address Selection Options */}
            {profileData?.address?.addressLine1 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Choose Delivery Address</h2>
                
                <div 
                  className={`border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all flex items-start ${useSavedAddress ? 'border-primary-600 bg-primary-50' : 'border-border hover:border-gray-300'}`}
                  onClick={() => handleAddressTypeChange(true)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 mt-1 flex items-center justify-center ${useSavedAddress ? 'border-primary-600' : 'border-gray-400'}`}>
                    {useSavedAddress && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-gray-900 block mb-1">Use Saved Address</span>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{profileData.address.fullName}</p>
                      <p>{profileData.address.addressLine1}</p>
                      {profileData.address.addressLine2 && <p>{profileData.address.addressLine2}</p>}
                      <p>{profileData.address.city}, {profileData.address.state} - {profileData.address.pincode}</p>
                      <p className="mt-1">Phone: {profileData.address.phone}</p>
                    </div>
                  </div>
                </div>

                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all flex items-center ${!useSavedAddress ? 'border-primary-600 bg-primary-50' : 'border-border hover:border-gray-300'}`}
                  onClick={() => handleAddressTypeChange(false)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${!useSavedAddress ? 'border-primary-600' : 'border-gray-400'}`}>
                    {!useSavedAddress && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                  </div>
                  <span className="font-bold text-gray-900">Add Another Address</span>
                </div>
              </div>
            )}

            {(!profileData?.address?.addressLine1 || !useSavedAddress) ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-primary-600" />
                Delivery Address
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="input-field pl-10"
                        required
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          // Only allow digits, max 10
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: value });
                        }}
                        className="input-field pl-10"
                        required
                        placeholder="9876543210"
                        pattern="[0-9]{10}"
                        maxLength={10}
                      />
                      <p className="mt-1 text-xs text-gray-500">10-digit mobile number</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      className="input-field pl-10"
                      required
                      placeholder="House/Flat No., Building Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="Street, Area, Colony"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="input-field appearance-none pr-10 cursor-pointer"
                        required
                      >
                        <option value="">Select State</option>
                        {indianStates.map((state) => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaCity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="input-field pl-10"
                        required
                        placeholder={formData.state ? `Enter city in ${formData.state}` : "City"}
                        list="city-suggestions"
                      />
                      {citySuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {citySuggestions.map((city, index) => (
                            <div
                              key={index}
                              onClick={() => handleCitySuggestionClick(city)}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({ ...formData, pincode: value });
                      }}
                      className="input-field"
                      required
                      placeholder="6 digit pincode (e.g., 110001)"
                      pattern="[0-9]{6}"
                      maxLength={6}
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter 6-digit Indian pincode</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Nearby landmark"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={savingAddress}
                    onChange={(e) => setSavingAddress(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-700">
                    Save this address for future orders
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                 <h2 className="text-2xl font-semibold mb-6 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-primary-600" />
                    Confirm Delivery
                 </h2>
                 <p className="text-gray-600 mb-6">
                   Your order will be delivered to the selected address above.
                 </p>
                 <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full btn-primary py-3 disabled:opacity-50"
                 >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                 </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    {item.images && item.images.length > 0 && (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-gray-600">by {item.author}</p>
                      <p className="text-accent-600 font-semibold">
                        ₹{Math.round(item.price)} {item.cartQty > 1 ? <span className="text-gray-600 text-xs ml-2">× {item.cartQty}</span> : null}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const wasOne = (item.cartQty || 1) === 1;
                            const result = decreaseQuantity(item._id);
                            if (wasOne) {
                              alert(result.message);
                            }
                          }}
                          className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                          title="Decrease quantity"
                        >
                          <FaMinus />
                        </button>
                        <span className="min-w-[28px] text-center font-semibold">{item.cartQty || 1}</span>
                        <button
                          onClick={() => {
                            increaseQuantity(item._id);
                          }}
                          disabled={(item.cartQty || 1) >= (item.quantity || 1)}
                          className="px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Increase quantity"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="Remove from cart"
                    >
                      <FaTrash className="text-sm" />
                    </button>
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
                  <span className="font-semibold">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                </div>
                {promoNeeded > 0 && (
                  <div className="mb-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                    Add items worth ₹{promoNeeded} to avail free delivery
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-accent-600">₹{Math.round(finalTotal)}</span>
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

export default Checkout;
