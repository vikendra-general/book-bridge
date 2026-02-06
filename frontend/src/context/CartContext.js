import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);

  // Helper to get cart storage key
  const getCartKey = (currentUser) => {
    return currentUser ? `cart_${currentUser._id || currentUser.id}` : 'cart';
  };

  // Load cart when user changes
  useEffect(() => {
    const key = getCartKey(user);
    try {
      const savedCart = localStorage.getItem(key);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCart([]);
    }
  }, [user]);

  // Helper to save cart state and localStorage
  const saveCart = (newCart) => {
    const key = getCartKey(user);
    setCart(newCart);
    localStorage.setItem(key, JSON.stringify(newCart));
  };

  const addToCart = (book) => {
    const existingItem = cart.find(item => item._id === book._id);
    
    if (existingItem) {
      const stock = Number(book.quantity || 1);
      const currentQty = Number(existingItem.cartQty || 1);
      if (stock > currentQty) {
        const updatedCart = cart.map(item =>
          item._id === book._id ? { ...item, cartQty: currentQty + 1 } : item
        );
        saveCart(updatedCart);
        return { success: true, message: 'Quantity increased' };
      }
      return { success: false, message: 'Maximum quantity reached for this product' };
    }

    const newCart = [...cart, { ...book, cartQty: 1 }];
    saveCart(newCart);
    return { success: true, message: 'book successfully added to cart, continue shopping Have a good day!' };
  };

  const increaseQuantity = (bookId) => {
    const existingItem = cart.find(item => item._id === bookId);
    if (!existingItem) return { success: false, message: 'Item not in cart' };
    const stock = Number(existingItem.quantity || 1);
    const currentQty = Number(existingItem.cartQty || 1);
    if (currentQty >= stock) return { success: false, message: 'Maximum quantity reached' };
    const updatedCart = cart.map(item =>
      item._id === bookId ? { ...item, cartQty: currentQty + 1 } : item
    );
    saveCart(updatedCart);
    return { success: true, message: 'Quantity increased' };
  };

  const decreaseQuantity = (bookId) => {
    const existingItem = cart.find(item => item._id === bookId);
    if (!existingItem) return { success: false, message: 'Item not in cart' };
    const currentQty = Number(existingItem.cartQty || 1);
    if (currentQty > 1) {
      const updatedCart = cart.map(item =>
        item._id === bookId ? { ...item, cartQty: currentQty - 1 } : item
      );
      saveCart(updatedCart);
      return { success: true, message: 'Quantity decreased' };
    }
    const newCart = cart.filter(item => item._id !== bookId);
    saveCart(newCart);
    return { success: true, message: 'book removed from cart, continue shopping Have a good Day!' };
  };

  const addQuantity = (book, qty) => {
    const stock = Number(book.quantity || 1);
    const desired = Math.max(1, Number(qty || 1));
    const existingItem = cart.find(item => item._id === book._id);
    if (existingItem) {
      const currentQty = Number(existingItem.cartQty || 1);
      const newQty = Math.min(stock, currentQty + desired);
      if (newQty === currentQty) return { success: false, message: 'Maximum quantity reached' };
      const updatedCart = cart.map(item =>
        item._id === book._id ? { ...item, cartQty: newQty } : item
      );
      saveCart(updatedCart);
    return { success: true, message: 'Quantity increased' };
  }
    const initialQty = Math.min(stock, desired);
    const newCart = [...cart, { ...book, cartQty: initialQty }];
    saveCart(newCart);
    return { success: true, message: 'book successfully added to cart, continue shopping Have a good day!' };
  };

  const removeFromCart = (bookId) => {
    const newCart = cart.filter(item => item._id !== bookId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + Math.round((item.price || 0) * (item.cartQty || 1)), 0);
  };

  const getCartCount = () => {
    return cart.length;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        addQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
