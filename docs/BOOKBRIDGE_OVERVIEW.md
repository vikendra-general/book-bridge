# BookBridge – Full-Stack Book Marketplace

BookBridge is a C2C (customer-to-customer) marketplace focused on buying and selling books with a clean, reader‑friendly experience. It supports user‑listed books, admin‑curated “BookBridge Originals”, a complete checkout flow, and a rich admin panel for moderation and operations.

This document describes:
- Overall architecture and technologies used
- All user‑facing features (registration → browsing → cart → checkout → orders)
- Selling flow and approval system
- Admin panel capabilities
- Non‑functional aspects and future scope

---

## 1. Tech Stack Overview

### 1.1 Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS (custom theme)
  - Primary (nav, primary CTAs): `#1E3A8A` (Deep Indigo)
  - Secondary background (sections): `#F5F1E8` (Warm Paper Beige)
  - Accent / price / success: `#2F855A` (Forest Green)
  - Highlight / Originals: `#D97706` (Muted Amber)
  - Text: `#1F2937` (primary), `#6B7280` (secondary)
  - Borders: `#E5E7EB`
- **HTTP Client**: Axios
- **Icons**: React Icons (FontAwesome set)
- **State Management**:
  - React Context API for **Auth** and **Cart**
  - LocalStorage for cart persistence

### 1.2 Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express‑validator
- **File Uploads**: Multer + Cloudinary
- **Payments**: Razorpay integration (for online payments)
- **Email**: Nodemailer (for communication / password flows)
- **Environment Management**: dotenv

### 1.3 Project Layout
- **Root**
  - `backend/` – Express API, models, routes, controllers
  - `frontend/` – React SPA (Create React App + Tailwind)
  - `package.json` (root) – convenient scripts
    - `dev:full` – run backend + frontend together
    - `build` – build frontend
- **Backend**
  - `models/` – `User`, `Book`, `Order`, `Category`, `Notification`, `AdminActivityLog`
  - `controllers/` – `authController`, `bookController`, `orderController`, `adminController`
  - `routes/` – `auth`, `books`, `orders`, `users`, `admin`, `categories`
- **Frontend**
  - `src/pages/` – `Home`, `Browse`, `BookDetail`, `SellBook`, `Profile`, `Orders`, `AdminDashboard`, `Login`, `Register`, `Checkout`, `Payment`, `ForgotPassword`
  - `src/components/` – `Navbar`, `PrivateRoute`, etc.
  - `src/context/` – `AuthContext`, `CartContext`
  - `src/services/` – `api` wrapper for Axios

---

## 2. User Roles and Access Model

### 2.1 Guest User (Not Logged In)
- Can view:
  - Homepage and hero section
  - Browse page with search and filters
  - Detailed book pages
  - “BookBridge Originals” section
- Restrictions:
  - Cannot add to cart
  - Cannot sell books
  - Cannot access profile, orders, checkout

### 2.2 Registered User
- Everything a guest can do, plus:
  - **Authentication**
    - Register, login, logout
    - Forgot password flow
  - **Buying**
    - Add books to cart
    - Adjust quantities
    - Place orders via checkout + payment
    - View and track orders (as buyer)
  - **Selling**
    - List books for sale
    - Track listing approval status
    - View and manage listed books
    - View orders where they are the seller
  - **Profile**
    - Saved address management
    - Stats on books and orders

### 2.3 Admin
- All registered user capabilities (for their own account) plus:
  - Access to **Admin Dashboard**
  - Manage books (approve, reject)
  - Manage orders (update statuses)
  - Manage users (block/unblock, promote)
  - View aggregated metrics and recent activity

---

## 3. Authentication & User Management

### 3.1 Registration
- Endpoint: `POST /api/auth/register`
- Frontend: **Register** page
- Flow:
  - User fills in:
    - Username
    - Email
    - Password (with basic validations)
    - Possibly security question/answer (depending on implementation)
  - Data is sent to backend
  - Password is hashed using bcryptjs
  - New user document is stored in MongoDB
  - Returns a JWT for immediate login (or user logs in afterward, depending on implementation)

### 3.2 Login
- Endpoint: `POST /api/auth/login`
- Frontend: **Login** page
- Flow:
  - User enters email and password
  - Backend verifies credentials:
    - Looks up user by email
    - Compares password hash with bcryptjs
  - On success:
    - Returns a JWT
    - Frontend stores token (e.g., in localStorage) via `AuthContext`
    - Sets user state with user info and role

### 3.3 Auth Context & Protected Routes
- **AuthContext**:
  - Holds user object, token, and helper methods (`login`, `logout`, `isAdmin`, etc.)
  - Exposes hooks to check if user is logged in and whether they are admin.
- **Protected Routes**:
  - Implemented via `PrivateRoute` or conditional routing
  - Routes like `/profile`, `/orders`, `/sell`, `/checkout`, `/payment`, `/admin` require auth
  - Admin routes require `role === 'admin'` (enforced via backend middleware and frontend checks).

### 3.4 Forgot Password / Recovery (Where Implemented)
- **ForgotPassword** page:
  - Multi‑step flow with a visual stepper (using primary colors)
  - Typical steps:
    - Enter email / security info
    - Verify OTP or answer
    - Set new password
  - Backend integrates with Nodemailer for sending reset emails or OTPs.

---

## 4. Browsing, Search & Discovery

### 4.1 Home Page
- Hero section:
  - BookBridge branding
  - Search call‑to‑action
  - Primary and secondary buttons:
    - Browse Books
    - Sell a Book
- Sections:
  - **Browse by Category**:
    - Grid of categories with icons and descriptions
  - **Featured Books**:
    - A curated list of books (can include “BookBridge Originals” and other highlighted titles)

### 4.2 Browse Page
- Endpoint: `GET /api/books` with query params
- Features:
  - **Search bar**:
    - Search by title / author
  - **Filters**:
    - Category (dropdown, loaded from `/api/categories`)
    - Price range (min, max)
    - Condition: new / like new / used
    - “BookBridge Originals” toggle (via `originals=true`)
  - **Results**:
    - White book cards with:
      - Cover image
      - Title, author
      - Price (Forest Green)
      - Discount badge
      - Condition badge
      - Category
    - Card hover: subtle shadow / elevation and title color shift to primary
    - Click → navigates to **Book Detail** page
  - **Empty state**:
    - “No books found” with suggestion to adjust filters or list a book.

### 4.3 BookBridge Originals
- Backend:
  - Books created by admin (or flagged in schema) have `isOriginal: true`.
  - Queries can filter by seller role admin or `originals=true`.
- Frontend:
  - “BookBridge Originals” view in Browse
  - Badges and labeling for Originals
  - Seller info:
    - Seller: **BookBridge**
    - Contact: `bookbridge@gmail.com`

---

## 5. Book Detail & Product Experience

### 5.1 Book Detail Page
- Route: `/books/:id`
- Data:
  - Fetched from `GET /api/books/:id`
  - Includes title, author, description, category, condition, edition, quantity, images, pricing, seller info, approval status, isAvailable, isSold, isOriginal.

### 5.2 Layout & Components
- **Image gallery**:
  - Main image with carousel navigation arrows
  - Thumbnail strip to switch images
  - Graceful fallback when image fails.
- **Status badges**:
  - Pending Approval
  - Available
  - Sold
  - Colors driven by Tailwind + palette (accent green for available).
- **Pricing & Meta**:
  - Price: large, Forest Green text
  - Discount: red pill badge (if any)
  - Original price (struck‑through)
  - Condition & Category chips
- **Description**:
  - Full book description in a readable text block.
- **Details section**:
  - Edition
  - Quantity
  - Condition
  - Seller (BookBridge or username)
  - Contact (BookBridge email or seller contact)

### 5.3 Actions
- Depends on user role and state:
  - Owner: sees “This is your listed book” with options to view in profile or delete.
  - Buyer:
    - If not available / sold or not approved → cannot purchase.
    - If available:
      - **Add to Cart** button (if not already in cart).
      - If already in cart:
        - Quantity controls: **- [qty] +** (no duplicate Add to Cart button).
        - “-” removes last unit and shows a friendly message.
  - Guest:
    - Prompt to login to purchase.

---

## 6. Cart & Checkout Flow

### 6.1 Cart Context
- `CartContext` centralizes cart behavior and persists cart in localStorage.
- Main capabilities:
  - `addToCart(book)` – add first unit or increase if already there
    - Respect stock (book quantity)
    - Popups like:
      - “book successfully added to cart, continue shopping Have a good day!”
      - Fails with “Maximum quantity reached for this product” if at stock limit.
  - `increaseQuantity(bookId)` – increase quantity by 1
  - `decreaseQuantity(bookId)`:
    - If quantity > 1: decrements quantity
    - If quantity == 1: removes item entirely and shows
      - “book removed from cart, continue shopping Have a good Day!”
  - `removeFromCart(bookId)` – direct remove (e.g., trash icon)
  - `clearCart()` – used post‑order
  - `getCartTotal()` – returns subtotal
  - `getCartCount()` – number of distinct items

### 6.2 Cart Controls in UI
- **Browse page and Home page**:
  - Card actions:
    - If own book: “Your Book” badge instead of cart controls.
    - If book not available / sold: disabled actions.
    - If not in cart:
      - “Add to Cart” button using `addToCart` and success popup.
    - If in cart:
      - Inline quantity controls:
        - “-” button (removes after 1, with message)
        - Numeric quantity
        - “+” button (respects stock)
- **Book Detail page**:
  - Same quantity logic but more prominent.

### 6.3 Delivery & Fees
- Calculated on **Checkout**:
  - Subtotal from `getCartTotal()`
  - Delivery fee:
    - If subtotal ≥ ₹999 → **Free delivery**
    - Else → ₹49 standard delivery
  - Promo message:
    - If subtotal below ₹999:
      - “Add items worth ₹X to avail free delivery”
    - Encourages upsell.

---

## 7. Checkout & Payment

### 7.1 Checkout Page
- Route: `/checkout`
- Guard:
  - Redirects to `/browse` if cart is empty.
  - Requires authenticated user.

### 7.2 Delivery Address Management
- Profile‑linked address:
  - Fetches user profile from `/api/users/profile`.
  - If a saved address exists:
    - Offers “Use Saved Address”.
  - Else:
    - Shows “Add Another Address” form.
- Address form:
  - Full Name
  - Phone (10‑digit, Indian mobile validation)
  - Address Line 1 (house/flat, building)
  - Address Line 2 (street, area)
  - State (select from predefined Indian states)
  - City (with popular city suggestions based on state)
  - Pincode (6‑digit numeric)
  - Optional landmark
  - Option to “Save this address for future orders”.

### 7.3 Order Summary (On Checkout)
- Shown alongside address form:
  - Thumbnail, title, author
  - Price in accent green
  - Inline quantity controls (`- qty +`)
  - Remove (trash icon)
  - Subtotal, delivery fee, final total
  - Free‑delivery promotion block

### 7.4 Payment Page
- Route: `/payment`
- Guard:
  - Redirects back to `/checkout` if:
    - Cart is empty, or
    - Delivery address is missing from navigation state.
- Payment options:
  - Cash on Delivery (COD)
  - Online payment integration via Razorpay
- After successful payment / confirmation:
  - Order is created in backend
  - Cart is cleared
  - Redirect to **Order Confirmation** page.

### 7.5 Order Confirmation
- Shows:
  - Success icon and messaging
  - Order ID (and payment ID, if available)
  - Payment method info (e.g., COD instructions)
  - Links to:
    - “View My Orders”
    - “Continue Shopping”

---

## 8. Orders & Profile

### 8.1 Profile Page
- Tabs:
  - Personal details
  - My Listings
  - Orders (buyer and seller view)
- Stats:
  - Total listed
  - Available listed (approved & not sold)
  - Pending approval
  - Purchased count
- Personal details:
  - Username, email
  - Address summary
  - Editable address via same form pattern as checkout.

### 8.2 Listings & Sales
- For each listed book:
  - Card with image, title, price (Forest Green), approval status, availability
  - Links to details and actions (e.g., delete)
- Sales:
  - Orders where current user is the seller.
  - Shows buyer details, book info, order status.

### 8.3 Orders Page
- Route: `/orders`
- Buyer & seller views combined or separated via tabs (depending on implementation).
- Table view for orders:
  - Book title
  - Amount
  - Status (with badges)
  - Links to view details

---

## 9. Selling Flow & Book Management

### 9.1 Sell Book Page
- Route: `/sell`
- Requires login.
- Form fields:
  - Title
  - Author
  - Category (select from categories)
  - Description
  - Condition (new / like new / used)
  - Price
  - Edition
  - Quantity/stock for that listing
  - Images:
    - Multiple file uploads
    - Handled via Multer + Cloudinary
  - Seller contact (validated format)
- Submission:
  - Creates a **pending** book listing via `POST /api/books`.
  - Book goes into approval queue for admin.

### 9.2 Approval Workflow
- Book has an `approvalStatus` field:
  - `pending` – submitted by user, waiting for admin.
  - `approved` – visible in main Browse and Book Detail for purchase.
  - `rejected` – hidden from purchase; reason can be communicated via notifications.
- When sold:
  - `isSold` and `isAvailable` fields updated accordingly.

---

## 10. Admin Panel & Operations

### 10.1 Access Control
- All routes under `/api/admin`:
  - Use `protect` middleware (JWT auth).
  - Use `authorize('admin')` to enforce admin role.
- Frontend:
  - `/admin` route guarded by `isAdmin()` check in `AuthContext`.

### 10.2 Admin Dashboard
- Stats:
  - Total users
  - Total books
  - Pending approvals
  - Total orders
  - Active orders (sold/picked_up/in_transit)
- Recent activity:
  - Recent books (with seller and status)
  - Recent orders (with status)

### 10.3 Book Management
- Endpoint: `GET /api/admin/books`
- Features:
  - Data table of all books with search / filters
  - Approve / Reject controls:
    - `PUT /api/admin/books/:id/approve`
    - `PUT /api/admin/books/:id/reject`
  - On approve:
    - `approvalStatus` set to `approved`
    - Book becomes visible for sale
  - On reject:
    - `approvalStatus` set to `rejected`
    - Notifications generated for seller (via `Notification` model)

### 10.4 Order Management
- Endpoint: `GET /api/admin/orders`
- Features:
  - View all orders with buyer, seller, and book details
  - Update status:
    - `sold` → `picked_up` → `in_transit` → `delivered`
    - Also supports `cancelled`
  - Uses `PUT /api/admin/orders/:id/status`
  - Status is reflected in both buyer and seller views.

### 10.5 User Management
- Endpoint: `GET /api/admin/users`
- Features:
  - List all users with email, username, role, and status
  - Block / Unblock user:
    - `PUT /api/admin/users/:id/block`
  - Promote user to admin:
    - `PUT /api/admin/users/:id/promote`

### 10.6 Activity Logging
- `AdminActivityLog` model:
  - Stores:
    - Admin user
    - Action type (approve/reject book, update order, manage users)
    - Target user/book/order
    - Description
    - IP address, timestamp
  - Provides an audit trail for security and compliance.

---

## 11. Non‑Functional Characteristics

### 11.1 UI/UX
- Calm, premium, book‑centric design:
  - Paper‑like backgrounds
  - White cards with soft shadows
  - Forest Green for positive signals and prices
  - Amber for highlights and Originals
  - Deep Indigo for navigation and CTAs
- Minimal gradients, no neon colors, no pure black backgrounds.
- Subtle hover effects:
  - Slight elevation on cards
  - Gentle darkening or opacity changes on buttons and links.

### 11.2 Responsiveness
- Fully responsive layout:
  - Navbar adapts to mobile with hamburger menu and slide‑down links.
  - Grids adjust for 1, 2, 3, 4+ columns based on breakpoints.
  - Forms and tables are scroll‑friendly on small screens.

### 11.3 Accessibility
- Contrast‑aware palette using Tailwind:
  - Dark text on light backgrounds
  - High‑contrast primary buttons
  - Status badges with readable colors
- Focus states:
  - Inputs use visible focus rings.
  - Buttons and controls indicate focus via Tailwind focus classes.
- Semantic structure:
  - Headings, sections, and descriptive labels for inputs.

### 11.4 Security
- JWT-based authentication with proper guards:
  - `protect` middleware ensures valid token for protected routes.
  - `authorize('admin')` enforces admin role separately.
- Passwords stored only as bcrypt hashes.
- Server‑side validation via express‑validator.
- Limited exposure of fields (e.g., `select('-password')` when returning user documents).

---

## 12. Future Scope & Enhancements

### 12.1 Product & UX
- **Recommendations**:
  - “Users who bought this also bought…”
  - Personalized recommendations based on browsing and purchase history.
- **Reviews & Ratings**:
  - Allow buyers to rate books and sellers.
  - Display average ratings and written reviews on book detail and seller profile.
- **Wishlist / Favorites**:
  - Save books for later without adding to cart.
  - Wishlist page under Profile.
- **Advanced Search**:
  - Full‑text search across title, author, description, category.
  - Sort options (price, newest, popularity, rating).

### 12.2 Social & Community
- **Messaging / Chat**:
  - In‑app messaging between buyer and seller (with admin moderation).
- **Follow Authors / Sellers**:
  - Subscribe to updates from favorite authors or sellers.
- **Reading Lists**:
  - Curated lists (e.g., “Best of Fiction”, “Exam Prep Essentials”) by admin.

### 12.3 Operations & Analytics
- **Analytics Dashboard**:
  - Advanced metrics for admin:
    - Conversion funnels
    - Revenue by category
    - Churn and engagement indicators
- **Coupons & Promotions**:
  - Discount codes
  - Time‑bound campaigns (e.g., festival sales).
- **Inventory & Supply Optimization**:
  - Suggestions for acquiring popular books based on search with no results.

### 12.4 Platform & Scalability
- **Microservice Decomposition** (long‑term):
  - Separate services for auth, catalog, orders, payments.
- **Caching Layer**:
  - Redis or similar for frequently accessed data (categories, popular books).
- **Mobile Apps**:
  - React Native or Flutter apps using the existing REST API.

---

## 13. Summary

BookBridge is a full‑featured MERN marketplace tailored for books, covering:
- Complete user journey from registration and login to search, filter, cart, checkout, payment, and order tracking.
- Seller experience from listing creation to approval and sales tracking.
- A robust admin back office for moderation, operations, and analytics groundwork.

The codebase is structured for clarity and extensibility, and the UI is designed to feel like a modern, premium bookstore experience, ready for future expansion and scaling.

