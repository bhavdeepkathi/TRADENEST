import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { api } from './app/api'
import {
  getPathRoleScope,
  getRoleScope,
  getStoredAuthForRole,
  setCredentials,
} from './features/auth/authSlice'
import { ProtectedRoute, GuestRoute, AdminRoute, LogisticsRoute } from './components/RoleBasedRoute'
import { RoleFallbackRedirect } from './components/RoleFallbackRedirect'
import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import SellerLayout from './components/SellerLayout'
import AdminLayout from './components/AdminLayout'
import LogisticsLayout from './components/LogisticsLayout'
import LogisticsDashboard from './features/logistics/pages/LogisticsDashboard'
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
import ForgotPassword from './features/auth/pages/ForgotPassword'
import ResetPassword from './features/auth/pages/ResetPassword'
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
  if (user?.role === 'SELLER') {
    return <Navigate to="/seller/dashboard" replace />
  }
  if (user?.role === 'DELIVERY_PARTNER') {
    return <Navigate to="/logistics/dashboard" replace />
  }
  return <Outlet />
}

function SellerRoute() {
  const { user } = useAppSelector((state) => state.auth)
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user?.role === 'DELIVERY_PARTNER') {
    return <Navigate to="/logistics/dashboard" replace />
  }
  return user?.role === 'SELLER' ? <Outlet /> : <Navigate to="/" replace />
}

function RoleSettingsRedirect() {
  const { user } = useAppSelector((state) => state.auth)
  if (user?.role === 'SELLER') {
    return <Navigate to="/seller/settings" replace />
  }
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user?.role === 'DELIVERY_PARTNER') {
    return <Navigate to="/logistics/dashboard" replace />
  }
  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/profile" replace />
  }
  return <Navigate to="/login" replace />
}

function RoleRouteSync() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    const targetScope = getPathRoleScope(location.pathname)
    if (!targetScope) return

    const currentScope = user?.role ? getRoleScope(user.role) : null
    if (currentScope !== targetScope) {
      const stored = getStoredAuthForRole(targetScope)
      if (stored?.accessToken && stored?.user) {
        dispatch(
          setCredentials({
            user: stored.user as any,
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken || '',
          })
        )
        dispatch(api.util.resetApiState())
      }
    }
  }, [location.pathname, user?.role, dispatch])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <RoleRouteSync />
      <Routes>
        {/* Settings generic redirect */}
        <Route path="/settings" element={<RoleSettingsRedirect />} />

        {/* Public Routes (no layout) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

      {/* Logistics & Delivery Partner Routes */}
      <Route element={<LogisticsLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<LogisticsRoute />}>
            <Route path="/logistics" element={<Navigate to="/logistics/dashboard" replace />} />
            <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback - redirect based on role */}
      <Route path="*" element={<RoleFallbackRedirect />} />
    </Routes>
    </ErrorBoundary>
  )
}

export default App