# 📚 Book Bridge - Production-Ready MERN Stack C2C Book Marketplace

A full-stack Consumer-to-Consumer book marketplace built with MongoDB, Express, React, and Node.js. This is a production-ready application with modern UI, complete admin panel, and comprehensive order management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (running on localhost:27017 or MongoDB Atlas)
- npm or yarn

### Installation & Setup

1. **Install all dependencies**
```bash
npm run install:all
```

Or manually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Set up Environment Variables**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookbridge
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Initialize Database**
```bash
cd backend
node scripts/initData.js
```

This creates:
- Admin user: `admin@bookbridge.com` / `Admin123!`
- 11 default categories (Fantasy, Thriller, Crime, Mystery, Romance, Science Fiction, Horror, Biography, Self-Help, Academic, Children)

4. **Start the Application**

**Option 1: Run both servers with one command (Recommended)**
```bash
npm run dev:full
```

This will:
- Start backend server on port 5000
- Start frontend dev server on port 3000
- Automatically open your browser to http://localhost:3000

**Option 2: Run servers separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 📁 Project Structure

```
bookbridge-mern/
├── backend/
│   ├── controllers/        # Route controllers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   └── orderController.js
│   ├── models/            # MongoDB schemas
│   │   ├── Book.js
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── Category.js
│   │   ├── Notification.js
│   │   └── AdminActivityLog.js
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & upload middleware
│   ├── scripts/          # Initialization scripts
│   ├── uploads/          # Book images storage
│   └── server.js         # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── PrivateRoute.js
│   │   ├── pages/        # Page components
│   │   │   ├── Home.js
│   │   │   ├── Browse.js
│   │   │   ├── BookDetail.js
│   │   │   ├── SellBook.js
│   │   │   ├── Profile.js
│   │   │   ├── Orders.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── context/      # React context (Auth)
│   │   ├── services/     # API service
│   │   └── App.js        # Main app component
│   └── public/
└── package.json          # Root package.json with dev:full script
```

## 🔐 Default Admin Credentials

- **Email**: admin@bookbridge.com
- **Password**: Admin123!

⚠️ **Important**: Change these credentials in production!

## 🎯 Features

### 👤 Customer Features

#### Profile Management
- User dashboard with statistics
- View listed books with approval status
- Track purchased books
- View sales history
- Order management

#### Selling Books
- Register books for sale with:
  - Title, Author, Category
  - Description and Condition (New/Like New/Used)
  - Price and Edition
  - Multiple book images
- Submit for admin approval
- Track approval status

#### Buying Books
- Browse books with advanced filters:
  - Search by title/author
  - Filter by category
  - Price range filter
  - Condition filter
- View detailed book information
- Purchase available books
- Track order status

### 👨‍💼 Admin Features

#### Dashboard
- Real-time statistics:
  - Total users, books, orders
  - Pending approvals
  - Active orders
- Recent books and orders overview

#### Book Management
- View all books with filters
- Approve/reject book listings
- View book details and seller information
- Automatic notifications to sellers

#### Order Management
- View all orders
- Update order status:
  - Sold → Picked Up → In Transit → Delivered
- Track order lifecycle
- Manage pickup and drop-off assignments

#### User Management
- View all users
- Search users by username/email
- Block/unblock users
- View user activity

#### Activity Logging
- Complete audit trail of admin actions
- Track all book approvals/rejections
- Monitor order status changes
- User management actions

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Books
- `GET /api/books` - Get all approved books (with filters)
- `GET /api/books/:id` - Get single book details
- `POST /api/books` - Create book listing (protected)
- `GET /api/books/my-books` - Get user's books (protected)

### Orders
- `POST /api/orders` - Create order (protected)
- `GET /api/orders/my-orders?type=buyer|seller` - Get user orders (protected)
- `GET /api/orders/:id` - Get single order (protected)

### Users
- `GET /api/users/profile` - Get user profile with stats (protected)
- `PUT /api/users/notifications/read` - Mark notifications as read (protected)

### Admin (Protected + Admin Role Required)
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/books` - Get all books (with filters)
- `PUT /api/admin/books/:id/approve` - Approve book
- `PUT /api/admin/books/:id/reject` - Reject book
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/block` - Block/unblock user

### Categories
- `GET /api/categories` - Get all categories

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: React Icons
- **State Management**: React Context API

## 📦 Database Schema

### Collections

#### Users
- username, email, password (hashed)
- role (user/admin)
- isActive (for blocking)
- securityQuestion

#### Books
- title, author, description
- category (reference)
- condition, price, edition
- images (array)
- seller (reference)
- approvalStatus (pending/approved/rejected)
- isAvailable, isSold

#### Orders
- book, buyer, seller (references)
- totalAmount
- status (sold/picked_up/in_transit/delivered/cancelled)
- trackingNumber
- pickupAddress, deliveryAddress
- pickupDate, deliveryDate

#### Categories
- name, slug, description
- isActive

#### Notifications
- user, message
- notificationType
- relatedOrder, relatedBook
- isRead

#### AdminActivityLog
- admin, actionType
- description
- targetUser, targetBook, targetOrder
- ipAddress

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface inspired by bookchor.com
- **Responsive**: Fully responsive design for mobile, tablet, and desktop
- **Hero Section**: Eye-catching homepage with search functionality
- **Category Browsing**: Easy navigation by book categories
- **Advanced Filters**: Comprehensive search and filter options
- **Loading States**: Smooth loading indicators throughout
- **Error Handling**: User-friendly error messages
- **Image Upload**: Multiple image support with previews
- **Status Badges**: Visual status indicators for books and orders

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Admin-only endpoints
- Input validation
- Secure file uploads
- CORS configuration

## 📝 Order Lifecycle

1. **Available** - Book is listed and approved
2. **Sold** - Customer purchases the book
3. **Picked Up** - Admin marks book as picked up from seller
4. **In Transit** - Book is being delivered
5. **Delivered** - Book successfully delivered to buyer
6. **Cancelled** - Order cancelled (if applicable)

## 🚀 Deployment Checklist

### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Update MongoDB connection string (use MongoDB Atlas for production)
- [ ] Set secure JWT secret (use environment variable)
- [ ] Configure CORS for production domain
- [ ] Set up file storage (consider cloud storage like AWS S3)
- [ ] Enable HTTPS
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure rate limiting

### Frontend
- [ ] Update API URL in environment variables
- [ ] Build React app: `npm run build`
- [ ] Serve build with Express or deploy to CDN (Vercel, Netlify)
- [ ] Configure environment variables in hosting platform

### Database
- [ ] Set up MongoDB Atlas or production MongoDB instance
- [ ] Configure database backups
- [ ] Set up indexes for performance
- [ ] Review and optimize queries

## 🧪 Testing

To test the application:

1. **Register a new user**
2. **Login as admin** (admin@bookbridge.com / Admin123!)
3. **List a book** as a regular user
4. **Approve the book** as admin
5. **Purchase the book** as another user
6. **Update order status** as admin

## 📊 Missing Features & Future Enhancements

- [ ] Payment integration (Stripe, PayPal)
- [ ] Email notifications
- [ ] Real-time chat between buyers and sellers
- [ ] Book reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced analytics dashboard
- [ ] Export reports (CSV, PDF)
- [ ] Image optimization and CDN
- [ ] Search autocomplete
- [ ] Book recommendations
- [ ] Social sharing
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a production-ready application. For improvements:
1. Follow the existing code structure
2. Maintain code quality and comments
3. Test thoroughly before submitting
4. Update documentation as needed

## 📄 License

This project is built for educational and commercial purposes.

---

**Built with ❤️ for book lovers | Production-Ready MERN Stack Application**
