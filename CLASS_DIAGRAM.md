# BookBridge Class Diagram

This document contains the class diagram for the BookBridge application, representing the MongoDB schemas and their associated operations (controllers).

## Mermaid Diagram (Rendered in Viewer)

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String username
        +String email
        +String password
        +String role
        +Boolean isActive
        +Number age
        +String phoneNumber
        +Address address
        +register()
        +login()
        +getMe()
        +forgotPassword()
        +verifyResetCode()
        +resetPassword()
        +comparePassword()
    }

    class Book {
        +ObjectId _id
        +String title
        +String author
        +String description
        +ObjectId category
        +String edition
        +String condition
        +Number price
        +String[] images
        +ObjectId seller
        +Boolean isOriginal
        +Boolean isAvailable
        +Boolean isSold
        +String approvalStatus
        +getBooks()
        +getBook()
        +createBook()
        +getMyBooks()
        +deleteBook()
    }

    class Order {
        +ObjectId _id
        +ObjectId book
        +ObjectId buyer
        +ObjectId seller
        +String status
        +Number totalAmount
        +String paymentMethod
        +String paymentStatus
        +String razorpayOrderId
        +String trackingNumber
        +createOrder()
        +createRazorpayOrder()
        +verifyPayment()
        +getMyOrders()
        +getOrder()
    }

    class Admin {
        +getDashboard()
        +getBooks()
        +approveBook()
        +rejectBook()
        +getOrders()
        +updateOrderStatus()
        +getUsers()
        +blockUser()
        +promoteUser()
    }

    class Category {
        +ObjectId _id
        +String name
        +String slug
        +String description
        +Boolean isActive
        +getCategories()
        +createCategory()
        +updateCategory()
        +deleteCategory()
    }

    class Notification {
        +ObjectId _id
        +ObjectId user
        +String message
        +Boolean isRead
        +String notificationType
    }

    class AdminActivityLog {
        +ObjectId _id
        +ObjectId admin
        +String actionType
        +String description
    }

    %% Relationships
    User "1" -- "0..*" Book : sells
    User "1" -- "0..*" Order : buys/sells
    User "1" -- "0..*" Notification : receives
    
    Book "1" -- "1" Order : item
    Category "1" -- "0..*" Book : classifies
    
    Admin ..> Book : manages
    Admin ..> Order : manages
    Admin ..> User : manages
    Admin "1" -- "0..*" AdminActivityLog : generates
```

## PlantUML Code

If you prefer a standard UML visualizer, you can copy the code below into a [PlantUML Editor](https://www.planttext.com/).

```plantuml
@startuml

package "Authentication" {
    class User {
        +ObjectId _id
        +String username
        +String email
        +String password
        +String role
        +Boolean isActive
        +Number age
        +String phoneNumber
        +Address address
        __ Operations __
        +register()
        +login()
        +getMe()
        +forgotPassword()
        +verifyResetCode()
        +resetPassword()
        +comparePassword()
    }
}

package "Catalog" {
    class Book {
        +ObjectId _id
        +String title
        +String author
        +String description
        +ObjectId category
        +String edition
        +String condition
        +Number price
        +String[] images
        +ObjectId seller
        +Boolean isOriginal
        +Boolean isAvailable
        +Boolean isSold
        +String approvalStatus
        __ Operations __
        +getBooks()
        +getBook()
        +createBook()
        +getMyBooks()
        +deleteBook()
    }

    class Category {
        +ObjectId _id
        +String name
        +String slug
        +String description
        +Boolean isActive
        __ Operations __
        +getCategories()
        +createCategory()
        +updateCategory()
        +deleteCategory()
    }
}

package "Transactions" {
    class Order {
        +ObjectId _id
        +ObjectId book
        +ObjectId buyer
        +ObjectId seller
        +String status
        +Number totalAmount
        +String paymentMethod
        +String paymentStatus
        +String razorpayOrderId
        +String trackingNumber
        __ Operations __
        +createOrder()
        +createRazorpayOrder()
        +verifyPayment()
        +getMyOrders()
        +getOrder()
    }
}

package "Administration" {
    class Admin {
        __ Operations __
        +getDashboard()
        +getBooks()
        +approveBook()
        +rejectBook()
        +getOrders()
        +updateOrderStatus()
        +getUsers()
        +blockUser()
        +promoteUser()
    }

    class AdminActivityLog {
        +ObjectId _id
        +ObjectId admin
        +String actionType
        +String description
    }
}

package "System" {
    class Notification {
        +ObjectId _id
        +ObjectId user
        +String message
        +Boolean isRead
        +String notificationType
    }
}

User "1" -- "0..*" Book : sells >
User "1" -- "0..*" Order : buys >
User "1" -- "0..*" Order : sells >
User "1" -- "0..*" Notification : receives >

Book "1" -- "1" Order : item >
Category "1" -- "0..*" Book : classifies >

Admin ..> Book : manages
Admin ..> Order : manages
Admin ..> User : manages
Admin "1" -- "0..*" AdminActivityLog : generates >

@enduml
```

## Schema Details

### User
Represents a registered user of the platform.
- **role**: Can be 'user' or 'admin'.
- **address**: Embedded delivery address details.

### Book
Represents a book listed for sale.
- **condition**: 'new', 'like_new', 'used'.
- **approvalStatus**: 'pending', 'approved', 'rejected'.
- **isOriginal**: Flag for admin-listed original books.

### Order
Represents a transaction between a buyer and a seller for a specific book.
- **status**: 'available', 'sold', 'picked_up', 'in_transit', 'delivered', 'cancelled'.
- **paymentMethod**: 'cod', 'online'.

### Category
Represents book categories (e.g., Fiction, Academic).

### Notification
System notifications for users regarding orders, approvals, etc.

### AdminActivityLog
Audit log for administrative actions.
