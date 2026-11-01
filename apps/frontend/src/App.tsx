import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
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

// Critical path public catalog pages (loaded eagerly for instant LCP)
import Home from './features/catalog/pages/Home'
import ProductList from './features/catalog/pages/ProductList'
import ProductDetail from './features/catalog/pages/ProductDetail'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import VerifyEmail from './features/auth/pages/VerifyEmail'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import ResetPassword from './features/auth/pages/ResetPassword'

// Code-split route chunks (loaded on-demand to shrink initial bundle)
const CartPage = lazy(() => import('./features/cart/pages/CartPage'))
const Checkout = lazy(() => import('./features/checkout/pages/Checkout'))
const Profile = lazy(() => import('./features/profile/pages/Profile'))
const Orders = lazy(() => import('./features/orders/pages/Orders'))
const OrderDetail = lazy(() => import('./features/orders/pages/OrderDetail'))
const WishlistPage = lazy(() => import('./features/wishlist/pages/WishlistPage'))

// Public Static & Help Pages
const HelpCenter = lazy(() => import('./features/pages/HelpCenter'))
const ContactUs = lazy(() => import('./features/pages/ContactUs'))
const AboutUs = lazy(() => import('./features/pages/AboutUs'))
const ShippingPolicy = lazy(() => import('./features/pages/ShippingPolicy'))
const ReturnsPolicy = lazy(() => import('./features/pages/ReturnsPolicy'))
const LegalPage = lazy(() => import('./features/pages/LegalPage'))
const DealsPage = lazy(() => import('./features/pages/DealsPage'))

// Admin suite chunks
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'))
const KycApprovals = lazy(() => import('./features/admin/pages/KycApprovals'))
const ProductModeration = lazy(() => import('./features/admin/pages/ProductModeration'))
const UserManagement = lazy(() => import('./features/admin/pages/UserManagement'))
const AlertsManagement = lazy(() => import('./features/admin/pages/AlertsManagement'))

// Seller suite chunks
const SellerDashboard = lazy(() => import('./features/seller/pages/SellerDashboard'))
const Inventory = lazy(() => import('./features/seller/pages/Inventory'))
const SellerOrders = lazy(() => import('./features/seller/pages/Orders'))
const AddProduct = lazy(() => import('./features/seller/pages/AddProduct'))
const Analytics = lazy(() => import('./features/seller/pages/Analytics'))
const SellerSettings = lazy(() => import('./features/seller/pages/Settings'))
const SellerProfile = lazy(() => import('./features/seller/pages/Profile'))
const Payouts = lazy(() => import('./features/seller/pages/Payouts'))
const SellerHelp = lazy(() => import('./features/seller/pages/SellerHelp'))

// Logistics suite chunk
const LogisticsDashboard = lazy(() => import('./features/logistics/pages/LogisticsDashboard'))

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
      <div className="h-8 w-8 rounded-full border-3 border-secondary-200 border-t-primary-600 animate-spin" />
      <span className="mt-3 text-xs font-medium text-secondary-500">Loading...</span>
    </div>
  )
}

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
      <Suspense fallback={<PageLoader />}>
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
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/faqs" element={<HelpCenter />} />
              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/returns" element={<ReturnsPolicy />} />
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/cookies" element={<LegalPage />} />
              <Route path="/deals" element={<DealsPage />} />
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
                <Route path="/seller/payouts" element={<Payouts />} />
                <Route path="/seller/help" element={<SellerHelp />} />
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
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
