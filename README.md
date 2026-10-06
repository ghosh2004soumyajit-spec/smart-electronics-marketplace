<div align="center">

# ⚡ VoltHaus — Smart Electronics Marketplace
### *Spec-First, High-Precision E-Commerce Platform for Smart Consumer Electronics*

[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F5A623?style=for-the-badge)](LICENSE)

[Explore Catalog](http://localhost:5173/shop) • [Admin Suite](http://localhost:5173/admin) • [API Documentation](#-api-endpoints) • [Deployment Guide](#-production-deployment-guide)

</div>

---

## 📖 Overview

**VoltHaus** is a production-grade, full-stack e-commerce marketplace crafted specifically for high-ticket smart electronics (smartphones, 4K/OLED TVs, inverter ACs, smart refrigerators, and washing machines). 

Unlike generic e-commerce templates, VoltHaus treats consumer electronics like technical hardware:
* **Datasheet-First Shopping**: Parametric specification filtering (tonnage, star rating, inverter tech, display panel type, storage).
* **Single-Category Hardware Compare**: Side-by-side spec sheet comparison matrix to compare fine technical differences before buying.
* **Concurrency-Safe Atomic Checkout**: Real-time stock reservation, pincode delivery zone validation, coupon logic, and instant order generation.
* **Complete Administrative Backoffice**: Live KPI revenue dashboards, order lifecycle management, catalog CRUD, review moderation, and promotional engine.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (Vercel SPA)"]
        UI["React 18 + Tailwind CSS"]
        Motion["Framer Motion Engine"]
        Context["Shop & Auth Context"]
        Query["Axios HTTP Layer"]
    end

    subgraph Server ["Backend (Render / Node.js)"]
        Express["Express REST API"]
        JWT["JWT Auth & Role Guards"]
        Router["Controllers & Business Rules"]
        Pool["pg.Pool Connection Handler"]
    end

    subgraph Data ["Database Tier"]
        Embedded["PGlite Local Embedded Engine"]
        CloudDB["Supabase Managed PostgreSQL 17"]
    end

    UI --> Context --> Query
    Query -->|HTTPS / REST| Express
    Express --> JWT --> Router --> Pool
    Pool -->|Dev Mode| Embedded
    Pool -->|Production Mode| CloudDB
```

---

## ✨ Key Features

### 🛍️ Customer Experience
- **Interactive Technical Visuals**: Dynamic, procedural vector line-art hardware representations alongside high-resolution photography.
- **Precision Parametric Search & Filters**: Filter by brand, price range, stock availability, star ratings, and category-specific technical attributes.
- **Side-by-Side Product Comparison**: Lock up to 4 items in the persistent bottom comparison dock for detailed attribute diffing.
- **Real-Time Pincode Logistics Check**: Instant delivery estimates and serviceability checks via postal code prefix matching.
- **Dynamic Promotional Offers**: Real-time coupon validator supporting percentage discounts, caps, and minimum spend requirements (`VOLT10`, `FESTIVE10`).
- **Verified Buyer Reviews**: Star ratings, breakdown distributions, and verified buyer badges.
- **Customer Portal**: Order tracking with timeline status (`PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`), saved address book, and wishlist.

### 🛡️ Admin Management Suite (`/admin`)
- **Real-Time Store Metrics**: Total revenue, fulfilled orders, active catalog count, and customer growth analytics.
- **Order Lifecycle Controls**: Update tracking statuses, inspect shipping datasheets, and execute atomic order cancellations with automatic stock rollback.
- **Catalog Management**: Add, modify, or archive categories and brands on the fly.
- **Review Moderation**: Approve or delete customer product reviews.
- **Promotions & Offers Center**: Create, toggle, or retire promotional voucher codes.

### ⚙️ Technical Highlights
- **Zero-Config Dual-Mode Database**:
  - **Local Development**: Runs out-of-the-box using `@electric-sql/pglite` embedded in `./database/pgdata` without installing local PostgreSQL servers.
  - **Cloud Production**: Switches seamlessly to hosted **Supabase PostgreSQL** via `DATABASE_URL` with SSL pooling.
- **Transactional Inventory Safety**: Concurrency-safe atomic decrements (`UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE product_id = $2 AND stock_quantity >= $1`) prevent overselling under high concurrency.
- **Hermetic Testing**: Comprehensive unit and concurrency test suite powered by **Vitest** and **React Testing Library**.

---

## 📂 Project Structure

```text
smart-electronics-marketplace/
├── backend/
│   ├── config/             # Database connection pool (pg & pglite adapter)
│   ├── controllers/        # Business logic (admin, auth, cart, order, product, etc.)
│   ├── middleware/         # JWT authentication & admin authorization guards
│   ├── routes/             # RESTful API route declarations
│   ├── scripts/            # Database initialization & catalog seed scripts
│   ├── server.js           # Express app bootstrap & middleware chain
│   └── package.json
│
├── frontend/
│   ├── public/             # Static assets & favicons
│   ├── src/
│   │   ├── components/     # UI building blocks, filters, navbar, and layouts
│   │   ├── context/        # AuthContext, ShopContext, CompareContext
│   │   ├── hooks/          # Custom hooks (useDebounce, useDocumentTitle)
│   │   ├── pages/          # Storefront & Admin page routes
│   │   ├── services/       # Axios API client & mock database fallback
│   │   ├── test/           # Vitest unit & integration test suites
│   │   ├── index.css       # Design tokens & Tailwind utilities
│   │   └── main.jsx        # React application entry point
│   ├── tailwind.config.js  # Custom technical color palette & typographic tokens
│   ├── vite.config.js      # Vite build setup & dev proxy
│   └── vercel.json         # SPA routing rewrites for Vercel
│
├── database/
│   ├── schema.sql          # PostgreSQL DDL with indexes, foreign keys, & checks
│   └── seed.sql            # Expanded electronics catalog seed data
│
└── PROJECT.md              # Architectural audit & milestone tracker
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or higher)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/ghosh2004soumyajit-spec/smart-electronics-marketplace.git
cd smart-electronics-marketplace
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Initialize the Database
Run the seed script from the `backend/` directory to automatically build tables and insert seed data:
```bash
cd ../backend
npm run db:init
```

### 4. Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server running at: http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# App available at: http://localhost:5173
```

---

## 🔐 Demo Credentials

Use these seeded test accounts to test user roles out of the box:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@electronics.com` | `Password123!` | Full Access (`/admin` Dashboard, Orders, Catalog) |
| **Customer** | `john.doe@example.com` | `Password123!` | Storefront, Cart, Checkout, Order History |

---

## 🌐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
USE_EMBEDDED_PG=false

# PostgreSQL Connection (Supabase / Render / Neon)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Security & CORS
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT |
| `GET` | `/api/auth/me` | Fetch authenticated session profile |

### 📦 Products & Catalog (`/api/products`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Paginated product search with spec filters |
| `GET` | `/api/products/:slug` | Retrieve complete product datasheet |
| `GET` | `/api/products/:id/reviews`| Get verified ratings & star distribution |
| `POST`| `/api/products/:id/reviews`| Submit product review *(Authenticated)* |
| `GET` | `/api/categories` | List product categories with item count |
| `GET` | `/api/brands` | List manufacturer brands |

### 🛒 Cart & Checkout (`/api/cart`, `/api/orders`, `/api/delivery`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cart` | Get current user's active cart |
| `POST` | `/api/cart` | Add product with cumulative stock check |
| `DELETE`| `/api/cart/:id` | Remove item from cart |
| `POST` | `/api/orders` | Place atomic order & deduct inventory |
| `GET` | `/api/orders` | Retrieve authenticated order history |
| `POST` | `/api/orders/:id/cancel` | Cancel order & restore inventory atomically |
| `GET` | `/api/delivery/check/:pincode`| Check pincode shipping fee & ETA |
| `GET` | `/api/offers` | Fetch active promotional discount codes |

### 👑 Admin Backoffice (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Store revenue & sales KPI metrics |
| `GET` | `/api/admin/orders` | Full order management view |
| `PUT` | `/api/admin/orders/:id/status`| Update delivery status |
| `POST`| `/api/admin/categories` | Create new category |
| `POST`| `/api/admin/brands` | Create new brand |
| `DELETE`| `/api/admin/reviews/:id`| Moderate / delete product review |

---

## 🚢 Production Deployment Guide

### Deploy Backend $\rightarrow$ [Render](https://render.com)
1. Create a **New Web Service** pointing to this repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Node`, **Build Command** to `npm install`, **Start Command** to `npm start`.
4. Add environment variables:
   - `NODE_ENV` = `production`
   - `USE_EMBEDDED_PG` = `false`
   - `DATABASE_URL` = *(Your Supabase connection string)*
   - `JWT_SECRET` = *(Your random 64-character secret key)*
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`

### Deploy Frontend $\rightarrow$ [Vercel](https://vercel.com)
1. Create a **New Project** pointing to this repository.
2. Select **Root Directory** as `frontend`.
3. Framework Preset: **Vite**.
4. Add environment variables:
   - `VITE_USE_MOCK` = `false`
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Click **Deploy**.

---

## 🧪 Testing

Execute the comprehensive automated test suite:
```bash
cd frontend
npm test
```
Runs hermetic tests for cart limits, checkout atomicity, role guards, and single-category comparison rules.

---

## 📄 License
This project is licensed under the **MIT License** — feel free to use, modify, and distribute for personal or commercial projects.

<div align="center">
  <sub>Built with ⚡ by <a href="https://github.com/ghosh2004soumyajit-spec">ghosh2004soumyajit-spec</a></sub>
</div>
