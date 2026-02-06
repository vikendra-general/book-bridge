# BookBridge Activity Diagram

This document contains the Activity Diagram for the BookBridge application, illustrating the flow of control for key processes like Buying and Selling.

## 1. Buying Process (Flowchart)

```mermaid
flowchart TD
    Start([Start]) --> Browse[Browse/Search Books]
    Browse --> Found{Book Found?}
    
    Found -- No --> Browse
    Found -- Yes --> View[View Book Details]
    
    View --> AddCart{Buy Now?}
    AddCart -- No --> Browse
    AddCart -- Yes --> CheckLogin{Is Logged In?}
    
    CheckLogin -- No --> Login[Login/Register]
    Login --> Checkout[Proceed to Checkout]
    CheckLogin -- Yes --> Checkout
    
    Checkout --> Address[Enter Delivery Address]
    Address --> PayMethod{Select Payment}
    
    PayMethod -- Online --> Razorpay[Initiate Razorpay]
    Razorpay --> Success{Success?}
    Success -- No --> Retry[Retry Payment]
    Retry --> Razorpay
    
    Success -- Yes --> Confirm[Order Confirmed]
    PayMethod -- COD --> Confirm
    
    Confirm --> Notify[Notify Seller]
    Notify --> End([End])
```

## 2. Selling & Approval Process (Swimlanes)

```mermaid
flowchart TD
    subgraph Seller
        StartSell([Start Selling]) --> Fill[Fill Book Details]
        Fill --> Upload[Upload Images]
        Upload --> Submit[Submit Listing]
    end
    
    subgraph System
        Submit --> Validate{Validation OK?}
        Validate -- No --> Error[Show Error]
        Error --> Fill
        Validate -- Yes --> Save[Save as Pending]
    end
    
    subgraph Admin
        Save --> Review[Review Listing]
        Review --> Decision{Approve?}
        Decision -- Yes --> Approve[Mark Approved]
        Decision -- No --> Reject[Mark Rejected]
    end
    
    subgraph SystemAction [System]
        Approve --> Live[Book is Live]
        Reject --> NotifyReject[Notify Rejection]
        Live --> NotifyApprove[Notify Approval]
    end
    
    NotifyApprove --> EndSell([End])
    NotifyReject --> EndSell
```

## PlantUML Code (Swimlane Activity Diagram)

Copy the code below into a [PlantUML Editor](https://www.planttext.com/) for a professional swimlane diagram covering the entire lifecycle.

```plantuml
@startuml
skinparam style strictuml

|User (Buyer)|
start
:Search for Books;
if (Book Found?) then (no)
    :Refine Search;
    stop
else (yes)
    :View Book Details;
endif

if (Want to Buy?) then (no)
    stop
else (yes)
    if (Logged In?) then (no)
        :Login / Register;
    else (yes)
    endif
endif

:Proceed to Checkout;
:Enter Delivery Address;

|System|
:Calculate Total Price;

|User (Buyer)|
if (Payment Method?) then (Online)
    :Initiate Razorpay Payment;
    |System|
    :Verify Payment Signature;
    if (Valid?) then (no)
        :Show Error;
        stop
    else (yes)
    endif
else (COD)
endif

|System|
:Create Order Record;
:Mark Book as Sold;
:Send Confirmation Email;

|User (Seller)|
:Receive Order Notification;
:Prepare for Shipment;

stop
@enduml
```

```plantuml
@startuml
title Selling Process with Admin Approval

|User (Seller)|
start
:Click "Sell Book";
:Fill Title, Author, Price;
:Upload Images;
:Submit Listing;

|System|
if (Validation Passed?) then (no)
    :Show Error Message;
    detach
else (yes)
    :Save Book to DB;
    :Set Status = "Pending";
endif

|Admin|
:View Pending Books;
:Review Details & Images;
if (Approve?) then (yes)
    :Set Status = "Approved";
    :Set isAvailable = True;
    |System|
    :Notify Seller (Approved);
    :Book becomes visible in Search;
else (no)
    |Admin|
    :Set Status = "Rejected";
    :Enter Rejection Reason;
    |System|
    :Notify Seller (Rejected);
endif

stop
@enduml
```
