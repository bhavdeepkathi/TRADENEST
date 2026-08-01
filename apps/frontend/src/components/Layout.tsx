import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks'
import { logout } from '../../features/auth/authSlice'
import { useAppDispatch } from '../../app/hooks'
import { Menu, X, ShoppingCart, Heart, User, LogOut, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export default function Layout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const cartCount = useAppSelector((s) => s.cart.items.reduce((a, i) => a + i.quantity, 0))
  const wishlistCount = useAppSelector((s) => s.wishlist.productIds.length)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const handleLogout = () => dispatch(logout())

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
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400" aria-label="TRADENEST home">
                TRADENEST
              </Link>
            </div>

            <div className="hidden md:flex md:items-center md:gap-6">
              <Link to="/products" className={clsx('text-sm font-medium transition-colors hover:text-primary-600', location.pathname.startsWith('/products') ? 'text-primary-600' : 'text-secondary-600 dark:text-secondary-300')}>
                Products
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/cart" className="relative text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">{cartCount}</span>}
                  </Link>
                  <Link to="/wishlist" className="relative text-sm font-medium text-secondary-600 dark:text-secondary-300 hover:text-primary-600">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{wishlistCount}</span>}
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleDark} className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800" aria-label={dark ? 'Light mode' : 'Dark mode'}>
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-3">
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
                {isAuthenticated && (
                  <>
                    <Link to="/cart" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Cart ({cartCount})</Link>
                    <Link to="/wishlist" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Wishlist ({wishlistCount})</Link>
                    <Link to="/profile" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Profile</Link>
                    <Link to="/orders" className="text-sm font-medium text-secondary-600 dark:text-secondary-300">Orders</Link>
                    <button onClick={handleLogout} className="text-left text-sm font-medium text-secondary-600 dark:text-secondary-300">Logout</button>
                  </>
                )}
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-secondary-500 dark:text-secondary-400">
            © {new Date().getFullYear()} TRADENEST. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}