import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import AiSearchBar from './AiSearchBar'
import { logout } from '../features/auth/authSlice'
import { clearCart } from '../features/cart/cartSlice'
import { useAppDispatch } from '../app/hooks'
import { Menu, X, ShoppingCart, Heart, User, LogOut, Sun, Moon, Facebook, Twitter, Instagram, Youtube as YouTube, Mail, Phone, MapPin, Truck, Shield, RefreshCw, Star, Bell } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import NotificationDrawer from './NotificationDrawer'
import { useGetUnreadNotificationCountQuery } from '../app/api'

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press & Media', href: '/press' },
    { label: 'Blog', href: '/blog' },
    { label: 'Investor Relations', href: '/investors' },
    { label: 'Sustainability', href: '/sustainability' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Track Order', href: '/track' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'FAQs', href: '/faqs' },
  ],
  shop: [
    { label: 'All Categories', href: '/products' },
    { label: 'Best Sellers', href: '/products?sort=best-selling' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Deals & Offers', href: '/deals' },
    { label: 'Gift Cards', href: '/gift-cards' },
    { label: 'Store Locator', href: '/stores' },
  ],
  seller: [
    { label: 'Sell on TRADENEST', href: '/seller/register' },
    { label: 'Seller Center', href: '/seller/dashboard' },
    { label: 'Seller University', href: '/seller/learn' },
    { label: 'Advertising', href: '/seller/ads' },
    { label: 'Fulfillment Services', href: '/seller/fulfillment' },
    { label: 'Seller Policies', href: '/seller/policies' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Intellectual Property', href: '/ip-policy' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/tradenest', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/tradenest', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/tradenest', label: 'Instagram' },
  { icon: YouTube, href: 'https://youtube.com/tradenest', label: 'YouTube' },
]

const trustFeatures = [
  { icon: Shield, title: 'Secure Payments', desc: 'PCI-DSS certified, 256-bit encryption' },
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹499' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: Star, title: 'Best Price Guarantee', desc: 'Price match promise' },
]

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'support@tradenest.in' },
  { icon: Phone, label: 'Phone', value: '1800-123-4567' },
  { icon: MapPin, label: 'Address', value: 'TRADENEST Tower, Bangalore, KA 560001' },
]

export default function Layout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const cartCount = useAppSelector((s) => s.cart.items.reduce((a, i) => a + i.quantity, 0))
  const wishlistCount = useAppSelector((s) => s.wishlist.productIds.length)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 5000,
  })

  const handleLogout = () => {
    dispatch(logout({ scope: 'customer' }))
    dispatch(clearCart())
  }

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-secondary-900">
      <header className="sticky top-0 z-50 w-full border-b border-secondary-200 dark:border-secondary-700 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400" aria-label="TRADENEST home">
                TRADENEST
              </Link>
            </div>

            {/* AI Search Bar in Header */}
            <div className="hidden sm:block flex-1 max-w-md mx-4">
              <AiSearchBar placeholder="Search 'smartp', 'laptop'..." />
            </div>

            <div className="hidden md:flex md:items-center md:gap-6">
              <Link to="/products" className={clsx('text-sm font-medium transition-colors hover:text-primary-600', location.pathname.startsWith('/products') ? 'text-primary-600' : 'text-secondary-600 dark:text-secondary-300')}>
                Products
              </Link>
              {isAuthenticated && (
                <Link to="/orders" className={clsx('text-sm font-medium transition-colors hover:text-primary-600', location.pathname.startsWith('/orders') ? 'text-primary-600' : 'text-secondary-600 dark:text-secondary-300')}>
                  Orders
                </Link>
              )}
              <Link to="/cart" className="relative text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">{cartCount}</span>}
              </Link>
              <Link to="/wishlist" className="relative text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{wishlistCount}</span>}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleDark} className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" aria-label={dark ? 'Light mode' : 'Dark mode'}>
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => setNotificationOpen(true)}
                  className="relative p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {(unreadData?.count ?? 0) > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                      {unreadData!.count > 9 ? '9+' : unreadData!.count}
                    </span>
                  )}
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <Link
                      to="/admin/dashboard"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
                    >
                      Admin Portal
                    </Link>
                  )}
                  {user?.role === 'SELLER' && (
                    <Link
                      to="/seller/dashboard"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-xs transition-colors"
                    >
                      Seller Center
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:inline">{user?.firstName}</span>
                  </Link>
                  <button onClick={handleLogout} className="btn btn-outline text-sm">
                    <LogOut className="mr-1 h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="btn btn-outline text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary text-sm">
                    Sign Up
                  </Link>
                </div>
              )}

              <button
                className="md:hidden p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div id="mobile-menu" className="md:hidden py-4 border-t border-secondary-200 dark:border-secondary-700">
              <div className="flex flex-col gap-4">
                <Link to="/products" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Products</Link>
                <>
                  <Link to="/cart" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Cart ({cartCount})</Link>
                  <Link to="/wishlist" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Wishlist ({wishlistCount})</Link>
                  {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <Link to="/admin/dashboard" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Admin Portal</Link>
                  )}
                  {isAuthenticated && user?.role === 'SELLER' && (
                    <Link to="/seller/dashboard" className="text-sm font-semibold text-primary-600 dark:text-primary-400">Seller Center</Link>
                  )}
                  {isAuthenticated && (
                    <Link to="/profile" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Profile</Link>
                  )}
                  {isAuthenticated && (
                    <Link to="/orders" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Orders</Link>
                  )}
                  {isAuthenticated && (
                    <button onClick={handleLogout} className="text-left text-sm font-medium text-secondary-600 dark:text-secondary-300">Logout</button>
                  )}
                </>
                {!isAuthenticated && (
                  <>
                    <Link to="/login" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Login</Link>
                    <Link to="/register" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
        {/* Trust Bar */}
        <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-secondary-200 dark:border-secondary-800 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trustFeatures.map((feature) => (
                <div key={feature.title} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-secondary-50 text-sm">{feature.title}</p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7">
              {/* Brand Column */}
              <div className="lg:col-span-2 xl:col-span-2">
                <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4 block">
                  TRADENEST
                </Link>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-6 max-w-xs">
                  India&apos;s smartest AI-powered digital marketplace. 
                  Discover, buy, and sell with confidence. 
                  2.5M+ users trust us for quality products at unbeatable prices.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  {contactInfo.map((info) => (
                    <div key={info.label} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 shrink-0">
                        <info.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400">{info.label}</p>
                        <p className="text-sm text-secondary-700 dark:text-secondary-300">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 hover:bg-primary-100 hover:text-primary-600 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Company */}
              <nav>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Company</h4>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Support */}
              <nav>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Support</h4>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Shop */}
              <nav>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Shop</h4>
                <ul className="space-y-3">
                  {footerLinks.shop.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Seller */}
              <nav>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Sell with Us</h4>
                <ul className="space-y-3">
                  {footerLinks.seller.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Legal */}
              <nav>
                <h4 className="font-semibold text-secondary-900 dark:text-secondary-50 mb-4">Legal</h4>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.label}>
                      <Link to={link.href} className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-secondary-50 dark:bg-secondary-950 border-t border-secondary-200 dark:border-secondary-800 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                © {new Date().getFullYear()} TRADENEST. All rights reserved.
              </p>

              <div className="flex items-center gap-6 text-sm text-secondary-500 dark:text-secondary-400">
                <span>Made with ❤️ in India</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-sm overflow-hidden text-[11px] font-medium leading-none">
                  <span className="bg-slate-700 text-white px-2 py-1">UPI</span>
                  <span className="bg-emerald-600 text-white px-2 py-1">Accepted</span>
                </span>
                <span className="inline-flex items-center rounded-sm overflow-hidden text-[11px] font-medium leading-none">
                  <span className="bg-slate-700 text-white px-2 py-1">Razorpay</span>
                  <span className="bg-blue-600 text-white px-2 py-1">Secured</span>
                </span>
                <span className="inline-flex items-center rounded-sm overflow-hidden text-[11px] font-medium leading-none">
                  <span className="bg-slate-700 text-white px-2 py-1">SSL</span>
                  <span className="bg-emerald-600 text-white px-2 py-1">256-Bit</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <NotificationDrawer isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
    </div>
  )
}