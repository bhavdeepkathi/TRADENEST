import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppSelector } from './app/hooks'
import { ProtectedRoute, GuestRoute, AdminRoute } from './components/RoleBasedRoute'
import { RoleFallbackRedirect } from './components/RoleFallbackRedirect'
import Layout from './components/Layout'
import SellerLayout from './components/SellerLayout'
import AdminLayout from './components/AdminLayout'
import Home from './features/catalog/pages/Home'
import ProductList from './features/catalog/pages/ProductList'
import ProductDetail from './features/catalog/pages/ProductDetail'
import AdminDashboard from './features/admin/pages/AdminDashboard'
import KycApprovals from './features/admin/pages/KycApprovals'
import ProductModeration from './features/admin/pages/ProductModeration'
import UserManagement from './features/admin/pages/UserManagement'
import AlertsManagement from './features/admin/pages/AlertsManagement'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import VerifyEmail from './features/auth/pages/VerifyEmail'
import CartPage from './features/cart/pages/CartPage'
import Checkout from './features/checkout/pages/Checkout'
import Profile from './features/profile/pages/Profile'
import Orders from './features/orders/pages/Orders'
import OrderDetail from './features/orders/pages/OrderDetail'
import WishlistPage from './features/wishlist/pages/WishlistPage'
import SellerDashboard from './features/seller/pages/SellerDashboard'
import Inventory from './features/seller/pages/Inventory'
import SellerOrders from './features/seller/pages/Orders'
import AddProduct from './features/seller/pages/AddProduct'
import Analytics from './features/seller/pages/Analytics'
import SellerSettings from './features/seller/pages/Settings'
import SellerProfile from './features/seller/pages/Profile'

function PageTransition() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }}
      className="min-h-screen"
    >
      <Outlet />
    </motion.div>
  )
}

function CustomerRoute() {
  const { user } = useAppSelector((state) => state.auth)
  const isCustomer = user?.role === 'CUSTOMER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  return isCustomer ? <Outlet /> : <Navigate to="/seller/dashboard" replace />
}

function SellerRoute() {
  const { user } = useAppSelector((state) => state.auth)
  const isSeller = user?.role === 'SELLER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  return isSeller ? <Outlet /> : <Navigate to="/" replace />
}

function App() {
  return (
    <Routes>
      {/* Public Routes (no layout) */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Catalog & Customer Routes */}
      <Route element={<Layout />}>
        <Route element={<PageTransition />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Seller Routes */}
      <Route element={<SellerLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<SellerRoute />}>
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/inventory" element={<Inventory />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/orders/:id" element={<SellerOrders />} />
            <Route path="/seller/products/add" element={<AddProduct />} />
            <Route path="/seller/products/:id/edit" element={<AddProduct />} />
            <Route path="/seller/analytics" element={<Analytics />} />
            <Route path="/seller/settings" element={<SellerSettings />} />
            <Route path="/seller/profile" element={<SellerProfile />} />
            <Route path="/seller/help" element={<div className="p-8">Help Center</div>} />
          </Route>
        </Route>
      </Route>

      {/* Admin & Super-Admin Routes */}
      <Route element={<AdminLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/sellers" element={<KycApprovals />} />
            <Route path="/admin/products" element={<ProductModeration />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/alerts" element={<AlertsManagement />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback - redirect based on role */}
      <Route path="*" element={<RoleFallbackRedirect />} />
    </Routes>
  )
}

export default App