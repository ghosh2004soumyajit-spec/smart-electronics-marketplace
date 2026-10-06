# Smart Electronics Marketplace — Development Plan

## 1. Project Scope

Build a **single-store Smart Electronics Marketplace** using the stack specified in the project PDF and only the selected features below.

### Stack

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT/session authentication + bcrypt
- **Images:** Cloudinary or object storage
- **Tools:** Git/GitHub, Postman, Figma
- **Deployment:** Vercel + suitable backend/database host

> **Important:** Payment gateway integration is NOT part of this selected project scope.

---

# 2. Final Feature Scope

## Customer

- Registration / Login
- Browse Categories & Brands
- Search / Filter / Sort / Pagination
- Product Details
- Ratings & Reviews
- Wishlist
- Cart
- Checkout
- Address Management
- Pincode-based Delivery Check
- Order History & Tracking

## Admin

- Dashboard
- Product / Category / Brand Management
- Price & Discount Updates
- Offers
- Inventory
- Orders
- Customers
- Reviews

## Advanced

- Product Comparison
- Rule-based Recommendations

---

# 3. Explicitly Excluded

Do NOT implement these features:

- Multi-vendor / Seller System
- External Price Scraping
- Price History
- Notifications
- Advanced ML Recommendations
- External Marketplace Pricing
- Payment Gateway Integration

---

# 4. High-Level Architecture

```text
                    React + Tailwind
                           |
                           | REST API
                           v
                    Node + Express
                           |
                           v
                       PostgreSQL
                           |
          +----------------+----------------+
          |                |                |
       Products         Customers         Orders
          |                |                |
       Prices          Wishlist/Cart     Reviews
       Inventory       Addresses         Tracking
       Offers
```

---

# 5. Project Structure

```text
smart-electronics-marketplace/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── admin/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── server.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
└── README.md
```

---

# 6. Phase 0 — Requirements & Design

Before coding:

1. Finalize the selected features.
2. Create page wireframes in Figma.
3. Design the PostgreSQL database.
4. Define table relationships.
5. Define REST API endpoints.
6. Decide the product categories and brands to seed.

---

# 7. Phase 1 — PostgreSQL Database

Create the tables required by the selected features.

### Core

```text
users
categories
brands
products
product_images
product_specifications
prices
inventory
```

### Customer

```text
addresses
wishlists
wishlist_items
carts
cart_items
```

### Orders

```text
orders
order_items
```

### Reviews

```text
reviews
```

### Offers & Delivery

```text
offers
delivery_zones
```

### Database principles

- Store common product information in `products`.
- Store category-specific specifications in `product_specifications`.
- Keep the purchase-time price in `order_items`.
- Use relationships/foreign keys between related tables.

---

# 8. Phase 2 — Node.js + Express Backend

Set up:

- Node.js
- Express.js
- PostgreSQL connection
- Environment variables
- REST API structure
- Error handling
- Input validation
- CORS

### API groups

```text
/api/auth
/api/users
/api/products
/api/categories
/api/brands
/api/prices
/api/offers
/api/inventory
/api/cart
/api/wishlist
/api/orders
/api/reviews
/api/admin
```

---

# 9. Phase 3 — Authentication & Authorization

### Registration

```text
Register
   ↓
Validate input
   ↓
Hash password with bcrypt
   ↓
Save user
```

### Login

```text
Login
   ↓
Verify credentials
   ↓
JWT / session
   ↓
Authenticated requests
```

Roles:

```text
CUSTOMER
ADMIN
```

Admin routes must be protected so customers cannot modify products, prices, inventory or orders.

---

# 10. Phase 4 — Product System

### Customer APIs

```text
GET /api/products
GET /api/products/:id
```

Support:

- Search
- Category filtering
- Brand filtering
- Price filtering
- Product-specific filters
- Sorting
- Pagination

### Admin APIs

```text
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
PUT    /api/admin/products/:id/price
PUT    /api/admin/products/:id/inventory
```

---

# 11. Phase 5 — React Customer Website

Build the pages in this order:

```text
Home
  ↓
Products / Category Listing
  ↓
Search Results
  ↓
Product Details
  ↓
Wishlist
  ↓
Cart
  ↓
Checkout
  ↓
Order Confirmation
  ↓
My Orders
  ↓
Order Details
  ↓
Profile
```

### Main components

```text
Navbar
Footer
ProductCard
ProductGrid
SearchBar
FilterSidebar
```

---

# 12. Phase 6 — Admin Dashboard

```text
Admin Dashboard
├── Products
├── Categories
├── Brands
├── Prices
├── Inventory
├── Offers
├── Orders
├── Customers
└── Reviews
```

Admin capabilities:

- Add/edit/delete products
- Manage categories
- Manage brands
- Update prices
- Update discounts
- Update inventory
- Manage offers
- Manage orders
- Manage customers
- Manage reviews
- View basic sales analytics

---

# 13. Phase 7 — Wishlist

```text
Product
   ↓
Add to Wishlist
   ↓
wishlist_items
   ↓
Wishlist Page
   ↓
Remove / Move to Cart
```

The wishlist belongs to the authenticated customer.

---

# 14. Phase 8 — Cart

```text
Product
   ↓
Add to Cart
   ↓
cart_items
   ↓
Change Quantity
   ↓
Calculate Total
   ↓
Checkout
```

The backend must validate product availability and stock.

---

# 15. Phase 9 — Reviews & Ratings

Customers can submit:

```text
Rating: 1–5
Comment
```

APIs:

```text
POST /api/reviews
GET  /api/products/:id/reviews
```

Product details should display:

- Average rating
- Review count
- Individual reviews

Admin can manage reviews.

---

# 16. Phase 10 — Address & Pincode Delivery

This is a **pincode-based delivery system**, not live GPS tracking.

Customer enters:

```text
Name
Phone
Address
City
State
Pincode
```

Backend checks the pincode against `delivery_zones`.

Example response:

```text
Available: YES
Delivery Charge: ₹XX
Estimated Delivery: X days
```

---

# 17. Phase 11 — Checkout & Orders

```text
Cart
  ↓
Address
  ↓
Pincode / Delivery Check
  ↓
Offer
  ↓
Final Order Amount
  ↓
Place Order
  ↓
Order Confirmation
  ↓
Order Tracking
```

Order statuses:

```text
PENDING
   ↓
CONFIRMED
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
OUT_FOR_DELIVERY
   ↓
DELIVERED

CANCELLED
```

No payment gateway is implemented in this scope.

---

# 18. Phase 12 — Product Comparison

Allow multiple products from the **same category** to be compared.

Example:

```text
                 LG       Samsung
Price            ₹XX        ₹XX
Capacity         XXX L      XXX L
Energy Rating    X Star     X Star
Inverter         Yes        Yes
Rating           X.X        X.X
Warranty         X Years    X Years
```

Use existing product and specification data rather than creating a separate complex comparison system.

---

# 19. Phase 13 — Rule-Based Recommendations

Start without machine learning.

Use rules based on:

```text
Category
Budget
Room Size
Capacity
Energy Rating
Inverter Requirement
Stock
```

Example:

```text
User Requirements
       ↓
Apply recommendation rules
       ↓
Find matching products
       ↓
Rank matches
       ↓
Recommended Products
```

This remains a **rule-based feature**. Do not build an ML recommendation model.

---

# 20. Phase 14 — Testing

### Authentication

- Registration
- Login
- Invalid credentials
- Customer/admin authorization

### Products

- Search
- Filters
- Sorting
- Pagination
- Product details

### Customer features

- Wishlist
- Cart
- Reviews
- Ratings
- Checkout

### Delivery

- Valid pincode
- Invalid pincode
- Delivery charge
- Estimated delivery

### Orders

- Order creation
- Order history
- Order tracking
- Order cancellation

### Admin

- Product management
- Price updates
- Inventory updates
- Order management
- Review management
- Admin authorization

### UI

- Mobile responsiveness
- Desktop responsiveness

---

# 21. Phase 15 — Security

Implement:

- bcrypt password hashing
- Backend authorization
- Input validation
- Parameterized queries / safe database access
- Correct CORS configuration
- HTTPS in deployment
- Environment variables for secrets
- Rate limiting
- Never commit secrets to GitHub

---

# 22. Phase 16 — Deployment

```text
React + Tailwind
       ↓
     Vercel

Node + Express
       ↓
Backend Host

PostgreSQL
       ↓
Database Host

Product Images
       ↓
Cloudinary / Object Storage
```

Test the deployed flow:

```text
Register
   ↓
Login
   ↓
Browse
   ↓
Search / Filter
   ↓
Product Details
   ↓
Wishlist / Cart
   ↓
Checkout
   ↓
Place Order
   ↓
Track Order
   ↓
Admin Management
```

---

# 23. Final Build Order

```text
1. Requirements + Figma
        ↓
2. PostgreSQL database design
        ↓
3. Node + Express setup
        ↓
4. Product APIs
        ↓
5. React product pages
        ↓
6. Connect React ↔ API
        ↓
7. Authentication + roles
        ↓
8. Admin dashboard
        ↓
9. Wishlist
        ↓
10. Cart
        ↓
11. Address + pincode delivery
        ↓
12. Checkout + orders
        ↓
13. Reviews + ratings
        ↓
14. Offers
        ↓
15. Product comparison
        ↓
16. Rule-based recommendations
        ↓
17. Testing + security
        ↓
18. Deployment
        ↓
19. README + demo
```

# 24. Final Scope

```text
SMART ELECTRONICS MARKETPLACE
            │
            ├── CUSTOMER
            │   ├── Registration / Login
            │   ├── Categories & Brands
            │   ├── Search / Filter / Sort / Pagination
            │   ├── Product Details
            │   ├── Ratings & Reviews
            │   ├── Wishlist
            │   ├── Cart
            │   ├── Checkout
            │   ├── Address + Pincode Delivery
            │   └── Orders & Tracking
            │
            ├── ADMIN
            │   ├── Dashboard
            │   ├── Products / Categories / Brands
            │   ├── Prices & Discounts
            │   ├── Offers
            │   ├── Inventory
            │   ├── Orders
            │   ├── Customers
            │   └── Reviews
            │
            └── ADVANCED
                ├── Product Comparison
                └── Rule-based Recommendations
```
