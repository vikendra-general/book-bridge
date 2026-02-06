import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../assets/bookbridgelogo.jpg';

const Footer = () => {
  return (
    <footer className="bg-primary-600 text-white mt-12">
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-3">
              <img
                src={logo}
                alt="BookBridge logo"
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm text-white/80 mb-2 font-semibold">
              A Home for Readers and Book Lovers
            </p>
            <p className="text-sm text-white/80 mb-4">
              A curated bridge between book lovers. Buy pre-loved gems, sell your shelf, and discover BookBridge Originals handpicked by our team.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="BookBridge on Facebook"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaFacebook className="text-white text-sm" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="BookBridge on Instagram"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaInstagram className="text-white text-sm" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="BookBridge on Twitter"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaTwitter className="text-white text-sm" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="BookBridge on LinkedIn"
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <FaLinkedin className="text-white text-sm" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4">Explore</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/browse" className="hover:text-amber-200 transition-colors">
                  Browse All Books
                </Link>
              </li>
              <li>
                <Link to="/browse?originals=true" className="hover:text-amber-200 transition-colors">
                  BookBridge Originals
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-amber-200 transition-colors">
                  Sell Your Books
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-200 transition-colors">
                  Track Your Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link to="/profile" className="hover:text-amber-200 transition-colors">
                  Your Account
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <FaEnvelope className="text-xs" />
                <span>support@bookbridge.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <FaPhone className="text-xs" />
                <span>+91-98765-43210</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white uppercase mb-4">Visit Us</h3>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-start space-x-2">
                <FaMapMarkerAlt className="text-xs mt-1" />
                <p>
                  BookBridge HQ<br />
                  Sector 62, Noida<br />
                  Uttar Pradesh, India
                </p>
              </div>
              <p className="text-white/70">
                Open 7 days a week · 9:00 AM – 9:00 PM
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <p className="text-xs text-white/70">
              © {new Date().getFullYear()} BookBridge. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-xs text-white/70">
              <span>Made for readers, by readers.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
