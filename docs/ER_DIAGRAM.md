# BookBridge ER Diagram

This document contains the Entity-Relationship (ER) diagram for the BookBridge application, representing the database schema structure and relationships between entities.

## Mermaid ER Diagram

```mermaid
erDiagram
    User ||--o{ Book : "sells"
    User ||--o{ Order : "places (buyer)"
    User ||--o{ Order : "fulfills (seller)"
    User ||--o{ Notification : "receives"
    User ||--o{ AdminActivityLog : "performs actions"
    User ||--o{ PasswordReset : "requests"
    
    Category ||--o{ Book : "classifies"
    
    Book ||--o{ Order : "is item in"
    Book ||--o{ Notification : "triggers"
    Book ||--o{ AdminActivityLog : "target of"
    
    Order ||--o{ Notification : "triggers"
    Order ||--o{ AdminActivityLog : "target of"

    User {
        ObjectId _id PK
        String username
        String email
        String password
        String role "user/admin"
        Boolean isActive
        Number age
        String phoneNumber
        Object address
        Date createdAt
    }

    Book {
        ObjectId _id PK
        String title
        String author
        ObjectId category FK
        Number price
        ObjectId seller FK
        String condition "new/used"
        String approvalStatus "pending/approved"
        Boolean isAvailable
        Boolean isSold
        Boolean isOriginal
    }

    Order {
        ObjectId _id PK
        ObjectId book FK
        ObjectId buyer FK
        ObjectId seller FK
        Number totalAmount
        String status
        String paymentMethod
        String razorpayOrderId
        Object deliveryAddress
        String trackingNumber
    }

    Category {
        ObjectId _id PK
        String name
        String slug
        Boolean isActive
    }

    Notification {
        ObjectId _id PK
        ObjectId user FK
        String message
        Boolean isRead
        String type
        ObjectId relatedOrder FK
        ObjectId relatedBook FK
    }

    AdminActivityLog {
        ObjectId _id PK
        ObjectId admin FK
        String actionType
        String description
        ObjectId targetUser FK
        ObjectId targetBook FK
        ObjectId targetOrder FK
    }

    PasswordReset {
        ObjectId _id PK
        String email
        String code
        Date expiresAt
        Boolean verified
    }
```

## PlantUML Code (Crow's Foot Notation)

Copy the code below into a [PlantUML Editor](https://www.planttext.com/) to generate a professional Entity-Relationship diagram.

```plantuml
@startuml
skinparam linetype ortho

entity "User" as user {
  * _id : ObjectId <<PK>>
  --
  * username : String
  * email : String
  * password : String
  * role : String
  * isActive : Boolean
  age : Number
  phoneNumber : String
  address : Object
}

entity "Book" as book {
  * _id : ObjectId <<PK>>
  --
  * title : String
  * author : String
  * category : ObjectId <<FK>>
  * price : Number
  * seller : ObjectId <<FK>>
  * condition : String
  * approvalStatus : String
  * isAvailable : Boolean
  * isSold : Boolean
  isOriginal : Boolean
}

entity "Order" as order {
  * _id : ObjectId <<PK>>
  --
  * book : ObjectId <<FK>>
  * buyer : ObjectId <<FK>>
  * seller : ObjectId <<FK>>
  * totalAmount : Number
  * status : String
  * paymentMethod : String
  razorpayOrderId : String
  trackingNumber : String
}

entity "Category" as category {
  * _id : ObjectId <<PK>>
  --
  * name : String
  * slug : String
  isActive : Boolean
}

entity "Notification" as notification {
  * _id : ObjectId <<PK>>
  --
  * user : ObjectId <<FK>>
  * message : String
  isRead : Boolean
  type : String
  relatedOrder : ObjectId <<FK>>
  relatedBook : ObjectId <<FK>>
}

entity "AdminActivityLog" as log {
  * _id : ObjectId <<PK>>
  --
  * admin : ObjectId <<FK>>
  * actionType : String
  description : String
  targetUser : ObjectId <<FK>>
  targetBook : ObjectId <<FK>>
  targetOrder : ObjectId <<FK>>
}

' Relationships
user ||..o{ book : "lists"
user ||..o{ order : "buys"
user ||..o{ order : "sells"
user ||..o{ notification : "receives"
user ||..o{ log : "performs"

category ||..o{ book : "contains"

book ||..|| order : "contained in"
book ||..o{ notification : "referenced by"
book ||..o{ log : "referenced by"

order ||..o{ notification : "referenced by"
order ||..o{ log : "referenced by"

@enduml
```

## Entity Descriptions

1.  **User**: Central entity. Can be a standard user (buyer/seller) or an admin.
2.  **Book**: Product entity. Linked to a `Category` and a `Seller` (User).
3.  **Order**: Transaction entity. Connects a `Buyer`, `Seller`, and a specific `Book`.
    *   *Note*: Each order document corresponds to a single book item to simplify status tracking per item.
4.  **Category**: Classification for books (e.g., Fiction, Education).
5.  **Notification**: Alerts for users about order updates or approvals.
6.  **AdminActivityLog**: Audit trail for admin actions.
