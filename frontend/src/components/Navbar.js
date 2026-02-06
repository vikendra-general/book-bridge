import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { FaUser, FaShoppingCart, FaCog, FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/bookbridgelogo.jpg';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { getCartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-primary-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-90">
            <img
              src={logo}
              alt="BookBridge logo"
              className="h-10 w-auto md:h-11"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:opacity-90 font-medium transition-colors">
              Home
            </Link>
            <Link to="/browse" className="text-white hover:opacity-90 font-medium transition-colors">
              Browse Books
            </Link>
            <Link to="/browse?originals=true" className="text-white hover:opacity-90 font-medium transition-colors">
              BookBridge Originals
            </Link>
            <Link to="/contact" className="text-white hover:opacity-90 font-medium transition-colors">
              Contact
            </Link>
            {user && (
              <>
                <Link to="/sell" className="text-white hover:opacity-90 font-medium transition-colors">
                  Sell Book
                </Link>
                <Link to="/profile" className="text-white hover:opacity-90 font-medium transition-colors flex items-center space-x-1">
                  <FaUser className="text-sm" />
                  <span>Profile</span>
                </Link>
                <Link to="/checkout" className="relative text-white hover:opacity-90 font-medium transition-colors flex items-center space-x-1">
                  <FaShoppingCart className="text-sm" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {isAdmin() && (
                  <Link to="/admin" className="text-white hover:opacity-90 font-medium transition-colors flex items-center space-x-1">
                    <FaCog className="text-sm" />
                    <span>Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>

                <button
                  onClick={handleLogout}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:opacity-90 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white hover:opacity-90"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-white hover:opacity-90 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/browse"
                className="text-white hover:opacity-90 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Books
              </Link>
              <Link
                to="/browse?originals=true"
                className="text-white hover:opacity-90 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                BookBridge Originals
              </Link>
              {user && (
                <>
                  <Link
                    to="/sell"
                    className="text-white hover:opacity-90 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sell Book
                  </Link>
                  <Link
                    to="/profile"
                    className="text-white hover:opacity-90 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={() => setMobileMenuOpen(false)}
                    className="relative block px-4 py-2 text-white hover:bg-primary-700/30 flex items-center space-x-2 rounded"
                  >
                    <FaShoppingCart />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/admin"
                      className="text-white hover:opacity-90 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
              <div className="pt-3 border-t">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <Link
                      to="/login"
                      className="flex-1 text-center text-white hover:opacity-90 font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
