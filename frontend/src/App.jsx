import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Listing from './pages/Listing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import { useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useShop } from './context/ShopContext';

/**
 * ProtectedRoute — redirects unauthenticated users to /login,
 * preserving the intended destination in location.state.from so
 * the login page can redirect back after successful authentication.
 * Optional `requireAdmin` enforces administrator privileges.
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuth();
  const shop = useShop();
  const toast = shop?.toast;
  const location = useLocation();
  const isUnauthorized = isAuthenticated && requireAdmin && (!user || user.role !== 'ADMIN');
  const toastedRef = useRef(false);

  useEffect(() => {
    if (isUnauthorized && toast && !toastedRef.current) {
      toastedRef.current = true;
      toast('Access denied: Administrator privileges required.', 'error');
    }
  }, [isUnauthorized, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isUnauthorized) {
    return (
      <Navigate
        to="/"
        state={{ unauthorized: true, message: 'Access denied: Administrator privileges required.' }}
        replace
      />
    );
  }

  return children;
}

/**
 * AdminRoute — dedicated route guard for /admin
 */
function AdminRoute({ children }) {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}

/**
 * Route map — Login/Register render standalone (no Layout shell so
 * the auth pages are full-screen focused experiences). All other
 * pages use the Layout shell with Navbar + Footer.
 */
export default function App() {
  return (
    <Routes>
      {/* Standalone auth pages — no navbar/footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main app shell */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Listing />} />
        <Route path="c/:categorySlug" element={<Listing />} />
        <Route path="b/:brandSlug" element={<Listing />} />
        <Route path="search" element={<Listing />} />
        <Route path="p/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="order/success/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="compare" element={<Compare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
