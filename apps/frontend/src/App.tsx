import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from './components/Layout'
import Home from './features/catalog/pages/Home'
import ProductList from './features/catalog/pages/ProductList'
import ProductDetail from './features/catalog/pages/ProductDetail'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import CartPage from './features/cart/pages/CartPage'
import Checkout from './features/checkout/pages/Checkout'
import Profile from './features/profile/pages/Profile'
import Orders from './features/orders/pages/Orders'
import WishlistPage from './features/wishlist/pages/WishlistPage'
import NotFound from './components/NotFound'

function App() {
  return (
    <Layout>
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </Layout>
  )
}

export default App