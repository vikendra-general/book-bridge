# BookBridge Sequence Diagrams

This document contains sequence diagrams for the core workflows of the BookBridge application.

## 1. User Registration & Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as React Client
    participant Auth as AuthController
    participant DB as MongoDB
    
    User->>Frontend: Enter Registration Details
    Frontend->>Auth: POST /api/auth/register
    Auth->>DB: Check if User Exists
    DB-->>Auth: User Not Found
    Auth->>DB: Create New User
    DB-->>Auth: User Created
    Auth-->>Frontend: Return JWT Token & User Data
    Frontend-->>User: Redirect to Home/Dashboard

    User->>Frontend: Enter Login Credentials
    Frontend->>Auth: POST /api/auth/login
    Auth->>DB: Find User & Validate Password
    DB-->>Auth: User Validated
    Auth-->>Frontend: Return JWT Token
    Frontend-->>User: Grant Access
```

## 2. Book Purchase Flow (End-to-End)

```mermaid
sequenceDiagram
    actor Buyer
    participant Frontend as React Client
    participant BookCtrl as BookController
    participant OrderCtrl as OrderController
    participant Razorpay as Razorpay Gateway
    participant DB as MongoDB
    participant Email as EmailService
    
    Buyer->>Frontend: Select Book & Click "Buy Now"
    Frontend->>OrderCtrl: POST /api/orders/create-razorpay-order
    OrderCtrl->>DB: Check Book Availability
    DB-->>OrderCtrl: Available
    OrderCtrl->>Razorpay: Create Order (Amount)
    Razorpay-->>OrderCtrl: Order ID Created
    OrderCtrl-->>Frontend: Return Razorpay Order ID
    
    Frontend->>Razorpay: Initiate Payment (UI)
    Buyer->>Razorpay: Enter Payment Details
    Razorpay-->>Frontend: Payment Success (Signature)
    
    Frontend->>OrderCtrl: POST /api/orders (Create Order)
    OrderCtrl->>OrderCtrl: Verify Payment Signature
    OrderCtrl->>DB: Create Order Record
    OrderCtrl->>DB: Update Book (isSold=true)
    OrderCtrl->>DB: Create Notification (for Seller)
    OrderCtrl->>Email: Send Confirmation Email
    Email-->>OrderCtrl: Email Sent
    OrderCtrl-->>Frontend: Order Placed Successfully
    Frontend-->>Buyer: Show Success Page
```

## 3. Selling & Admin Approval Flow

```mermaid
sequenceDiagram
    actor Seller
    actor Admin
    participant Frontend as React Client
    participant BookCtrl as BookController
    participant AdminCtrl as AdminController
    participant DB as MongoDB
    
    Seller->>Frontend: Fill Book Details & Upload Images
    Frontend->>BookCtrl: POST /api/books (Multipart)
    BookCtrl->>DB: Create Book (Status: Pending/Approved)
    Note right of DB: C2C books are auto-approved<br/>by default in current logic
    DB-->>BookCtrl: Book Created
    BookCtrl-->>Frontend: Success Message
    
    par Admin Review Process
        Admin->>Frontend: View Admin Dashboard
        Frontend->>AdminCtrl: GET /api/admin/books?status=pending
        AdminCtrl->>DB: Fetch Pending Books
        DB-->>Frontend: List of Books
        
        Admin->>Frontend: Approve Book
        Frontend->>AdminCtrl: PUT /api/admin/books/:id/approve
        AdminCtrl->>DB: Update Status = Approved
        AdminCtrl->>DB: Create Notification (for Seller)
        DB-->>AdminCtrl: Success
        AdminCtrl-->>Frontend: Book Approved
    end
```

## PlantUML Version (For Visual Style)

Copy the code below into a [PlantUML Editor](https://www.planttext.com/) to generate a diagram matching your example style.

```plantuml
@startuml
!theme plain
autonumber

actor "User (Buyer)" as Buyer
actor "User (Seller)" as Seller
participant "Frontend UI" as UI
participant "Backend API" as API
database "Database" as DB
participant "Razorpay" as PG
actor "Admin" as Admin

box "BookBridge System" #White
    participant UI
    participant API
    participant DB
end box

== Authentication ==
Buyer -> UI: Login
UI -> API: Auth Request
API -> DB: Validate Credentials
DB --> API: User Data
API --> UI: JWT Token

== Selling Process ==
Seller -> UI: Upload Book Details
UI -> API: Create Book Request
API -> DB: Save Book (Status: Approved)
DB --> API: Confirmation
API --> UI: "Book Listed"

== Buying Process ==
Buyer -> UI: Browse & Select Book
UI -> API: Request Payment Order
API -> DB: Check Availability
DB --> API: Available
API -> PG: Create Order
PG --> API: Order ID
API --> UI: Payment Init Details

Buyer -> PG: Complete Payment
PG --> UI: Payment Success

UI -> API: Confirm Order
API -> API: Verify Signature
API -> DB: Save Order
API -> DB: Update Book (Sold)
API -> DB: Create Notification
API --> UI: Order Success

== Admin Operations ==
Admin -> UI: Access Dashboard
UI -> API: Get System Stats
API -> DB: Aggregate Data
DB --> API: Stats
API --> UI: Display Dashboard

@enduml
```
