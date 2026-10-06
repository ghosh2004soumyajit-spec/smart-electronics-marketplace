# Project: VoltHaus Smart Electronics Marketplace Full-Stack Audit & Remediation

## Architecture
VoltHaus is a full-stack smart electronics marketplace consisting of:
- **Database Layer**: PostgreSQL (live) and in-memory embedded PGlite (`@electric-sql/pglite`) for development/tests (`backend/config/db.js`). Schemas defined in `database/schema.sql` and seeded via `database/seed.sql`.
- **Backend API Layer**: Node.js & Express REST API with JWT authentication (`CUSTOMER`, `ADMIN` roles), modular routes (`/api/products`, `/api/orders`, `/api/cart`, `/api/delivery`, `/api/reviews`, `/api/admin`, `/api/offers`, `/api/categories`, `/api/brands`), and transactional controllers.
- **Frontend SPA Layer**: React 18, Vite, Tailwind CSS, Lucide icons, Framer Motion, and dual data modes (`VITE_USE_MOCK=true` vs `VITE_USE_MOCK=false`). Global state managed by `ShopContext`, `AuthContext`, and `CompareContext`.
- **Test Infrastructure**: Vitest, React Testing Library, and JSDOM (`frontend/src/test/app.test.jsx`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | PGlite rowCount Fix | Correct `rowCount` calculation on PGlite shim in `db.js` so UPDATE/DELETE without `RETURNING *` return affected rows count instead of 0. | M1 | survey, master_audit_plan |
| 2 | Pincode Schema Alignment | Harmonize delivery controller output with `PincodeCheck.jsx` (`region`, `city`, `charge`, `deliveryCharge`, `freeAbove`, `etaDays`, `etaLabel`, `serviceable`). Support 3-digit prefix matching. | M1 | survey, ORIGINAL_REQUEST R1 |
| 3 | Reviews API Payload Alignment | Format reviews endpoint response to return `{ items: [...], distribution: [...] }` with camelCase fields (`userName`, `createdAt`, `stars`, `title`, `comment`, `verified`). | M1 | survey, ORIGINAL_REQUEST R1 |
| 4 | Product Query Pagination & Range Filters | Accept `limit` alongside `perPage` in `productController.js`. Parse and ingest numeric range filters (`r_*`) for specs (tonnage, capacity, etc.). | M1 | survey, ORIGINAL_REQUEST R1 |
| 5 | Database Schema Indexes | Add missing indexes to `database/schema.sql` on `order_items(order_id)`, `order_items(product_id)`, `reviews(product_id)`, `reviews(user_id)`, `cart_items(cart_id)`, and `cart_items(product_id)`. | M1 | survey, ORIGINAL_REQUEST R1 |
| 6 | Seed & Coupon Data Reconciliation | Reconcile product catalog IDs between `database/seed.sql` and `frontend/src/data/seed.js` (resolve AC vs Fridge ID 8 mismatch). Reconcile coupon codes (`VOLT10`, `WELCOME500`, `FESTIVE10`, `WELCOME5`, `SAVE15`). | M1 | survey, master_audit_plan |
| 7 | Cart Cumulative Stock Validation | Prevent overselling in `cartController.js` by checking `existingQuantity + requestedIncrement <= stock_quantity`. | M2 | survey, ORIGINAL_REQUEST R2 |
| 8 | Order Cancellation Idempotency & Safety | Enforce atomic cancellation (`status IN ('PENDING', 'CONFIRMED', 'PROCESSING')`) to prevent duplicate restock. Support both integer ID and `order_number` string lookup. | M2 | survey, ORIGINAL_REQUEST R2 |
| 9 | Checkout Atomic Inventory Decrement | Enforce atomic inventory deductions in `orderController.js` with `UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE product_id = $2 AND stock_quantity >= $1`. Roll back transaction on deduction failure. | M2 | survey, ORIGINAL_REQUEST R2 |
| 10 | Frontend /admin Route Guard | Implement role-based route guard in `App.jsx` checking `user?.role === 'ADMIN'`. Redirect unauthorized customers with an access denied toast/message. | M2 | survey, ORIGINAL_REQUEST R2 |
| 11 | Dynamic Product Query Sanitization | Whitelist and sanitize dynamic attribute filter parameters in `productController.js` to eliminate SQL injection risks. | M2 | survey, master_audit_plan |
| 12 | Review Submission Modal & Form | Create verified buyer review submission form/modal in `ReviewsSection.jsx` allowing rating (1-5 stars) and comment submission connected to `POST /api/products/:id/reviews`. | M3 | survey, ORIGINAL_REQUEST R3 |
| 13 | Single-Category Compare & Toast Feedback | Restrict product comparison in `CompareContext.jsx` strictly to products within the same category. Replace native browser `alert()` with in-app toast notification. | M3 | survey, ORIGINAL_REQUEST R3 |
| 14 | Dynamic Navbar & Footer Category Links | Render category links in `Navbar.jsx` and `Footer.jsx` dynamically from `ShopContext` / `/api/categories` instead of static seed. | M3 | survey, ORIGINAL_REQUEST R3 |
| 15 | Dynamic Checkout Coupon Validation | Connect `Checkout.jsx` coupon application to `/api/offers` for validation and discount calculation. | M3 | survey, ORIGINAL_REQUEST R3 |
| 16 | Admin Category CRUD | Implement Category management in backend (`POST/PUT/DELETE /api/admin/categories`) and Admin UI tab (list, add, edit, delete categories). | M4 | survey, ORIGINAL_REQUEST R4 |
| 17 | Admin Brand CRUD | Implement Brand management in backend (`POST/PUT/DELETE /api/admin/brands`) and Admin UI tab (list, add, edit, delete brands). | M4 | survey, ORIGINAL_REQUEST R4 |
| 18 | Admin Customer List & Order History | Implement Customer inspection in backend (`GET /api/admin/users`, `GET /api/admin/users/:id/orders`) and Admin UI tab. | M4 | survey, ORIGINAL_REQUEST R4 |
| 19 | Admin Review Moderation | Implement Review moderation in backend (`GET /api/admin/reviews`, `DELETE /api/admin/reviews/:id`) and Admin UI tab. | M4 | survey, ORIGINAL_REQUEST R4 |
| 20 | Admin Offers Status Toggle & Deletion | Extend Offers management in backend (`PUT /api/admin/offers/:id/toggle`, `DELETE /api/admin/offers/:id`) and Admin UI tab. | M4 | survey, ORIGINAL_REQUEST R4 |
| 21 | Hermetic Test Configuration | Configure Vitest / `app.test.jsx` to execute hermetically without requiring an active external backend server (using mock mode / mock adapters). | M5 | survey, ORIGINAL_REQUEST R5 |
| 22 | Test Suite Storage Key Synchronization | Update test setup and assertions to use `volthaus.guest.cart.v2` and `volthaus.guest.wish.v2`. Fix multiple element match and unauthenticated route issues in tests. | M5 | survey, ORIGINAL_REQUEST R5 |
| 23 | Concurrency & Business Rule Regression Tests | Add comprehensive regression tests in Vitest for cart stock limits, order cancellation idempotency, and single-category comparison enforcement. | M5 | survey, ORIGINAL_REQUEST R5 |
| 24 | 100% Test Suite Pass & Adversarial Hardening | Execute `npm test` inside `frontend/` to achieve 100% pass rate with zero network errors. Validate via adversarial Challengers and Forensic Auditor. | M5 | survey, ORIGINAL_REQUEST R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: API & Data Contract Harmonization | Features 1, 2, 3, 4, 5, 6 | none | DONE |
| 2 | M2: Backend Concurrency, Inventory & Security Hardening | Features 7, 8, 9, 10, 11 | M1 | IN_PROGRESS |
| 3 | M3: Frontend Feature Completeness & UX Alignment | Features 12, 13, 14, 15 | M1, M2 | PLANNED |
| 4 | M4: Admin Backoffice Completion | Features 16, 17, 18, 19, 20 | M1, M2 | PLANNED |
| 5 | M5: Hermetic Test Suite & E2E Validation | Features 21, 22, 23, 24 | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Contract 1: Delivery Pincode Check (`/api/delivery/check/:pincode`)
- Request: `GET /api/delivery/check/:pincode`
- Response:
  ```json
  {
    "pincode": "560001",
    "city": "Bengaluru",
    "state": "Karnataka",
    "region": "Bengaluru, Karnataka",
    "serviceable": true,
    "charge": 0,
    "deliveryCharge": 0,
    "freeAbove": 499,
    "etaDays": 3,
    "minDays": 2,
    "maxDays": 4,
    "etaLabel": "3 days",
    "estimatedDelivery": "2026-10-08"
  }
  ```

### Contract 2: Product Reviews (`/api/products/:id/reviews`)
- Request: `GET /api/products/:id/reviews`
- Response:
  ```json
  {
    "items": [
      {
        "id": 1,
        "productId": 1,
        "userId": 2,
        "userName": "Jane Doe",
        "rating": 5,
        "title": "Great sound",
        "comment": "Excellent noise cancelling",
        "verified": true,
        "createdAt": "2026-09-15T10:00:00.000Z"
      }
    ],
    "distribution": [
      { "stars": 5, "count": 12, "percentage": 60 },
      { "stars": 4, "count": 5, "percentage": 25 },
      { "stars": 3, "count": 2, "percentage": 10 },
      { "stars": 2, "count": 1, "percentage": 5 },
      { "stars": 1, "count": 0, "percentage": 0 }
    ],
    "total": 20,
    "average": 4.4
  }
  ```

### Contract 3: Product Filtering & Pagination (`/api/products`)
- Query parameters supported:
  - `page`: integer (default 1)
  - `perPage`: integer (default 12)
  - `limit`: integer (if provided, overrides `perPage` or sets limit)
  - `category`: string (slug)
  - `brand`: string (slug)
  - `minPrice`: number
  - `maxPrice`: number
  - `r_<attr>`: numeric range string `min-max` (e.g. `r_tonnage=1.4-1.7`, `r_capacity_l=240-300`)
  - `f_<attr>`: discrete multi-value filter (e.g. `f_color=Black,Silver`)
  - `search`: string

### Contract 4: Admin Endpoints
- Category CRUD:
  - `POST /api/admin/categories` (body: `{ name, slug, description, image_url }`)
  - `PUT /api/admin/categories/:id` (body: `{ name, slug, description, image_url }`)
  - `DELETE /api/admin/categories/:id`
- Brand CRUD:
  - `POST /api/admin/brands` (body: `{ name, slug, logo_url }`)
  - `PUT /api/admin/brands/:id` (body: `{ name, slug, logo_url }`)
  - `DELETE /api/admin/brands/:id`
- Customer Management:
  - `GET /api/admin/users` -> array of `{ id, name, email, role, created_at, order_count, total_spent }`
  - `GET /api/admin/users/:id/orders` -> user's order history
- Review Moderation:
  - `GET /api/admin/reviews` -> list of all reviews with product & user info
  - `DELETE /api/admin/reviews/:id` -> removes review and recalculates product rating
- Offers Management:
  - `PUT /api/admin/offers/:id/toggle` -> toggles `is_active`
  - `DELETE /api/admin/offers/:id` -> deletes offer

### Contract 5: Order Cancellation
- `PUT /api/orders/:id/cancel`
- Accepts either integer ID (`10`) or string order number (`ORD-2026-10-001`).
- Atomic: only updates when status is cancellable (`PENDING`, `CONFIRMED`, `PROCESSING`). If already `CANCELLED` or `DELIVERED`, returns appropriate status without restocking inventory.

## Code Layout
- `backend/config/`: `db.js` (database connection and PGlite shim)
- `backend/controllers/`: `productController.js`, `orderController.js`, `cartController.js`, `deliveryController.js`, `reviewController.js`, `adminController.js`, `userController.js`
- `backend/routes/`: `adminRoutes.js`, `orderRoutes.js`, `cartRoutes.js`, `deliveryRoutes.js`, `productRoutes.js`, `reviewRoutes.js`, `categoryRoutes.js`, `brandRoutes.js`
- `database/`: `schema.sql` (DDL), `seed.sql` (DML)
- `frontend/src/api/`: `api.js` (API client & mock data handlers)
- `frontend/src/components/`:
  - `product/`: `PincodeCheck.jsx`, `ReviewsSection.jsx`, `ProductCard.jsx`
  - `layout/`: `Navbar.jsx`, `Footer.jsx`
  - `home/`: `FeaturedPicks.jsx`, `RecommendationsSection.jsx`
- `frontend/src/context/`: `ShopContext.jsx`, `AuthContext.jsx`, `CompareContext.jsx`
- `frontend/src/pages/`: `Admin.jsx`, `Checkout.jsx`, `Compare.jsx`, `ProductDetail.jsx`
- `frontend/src/test/`: `app.test.jsx`, `setup.js`
