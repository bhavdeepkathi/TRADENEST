// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import authReducer, {
  setCredentials,
  logout,
  logoutAll,
  getRoleScope,
  getPathRoleScope,
  loadStoredAuth,
  SESSION_AUTH_KEY,
  ROLE_AUTH_KEYS,
  type User,
} from './authSlice'

describe('authSlice multi-tab and multi-role storage', () => {
  const customerUser: User = {
    id: 'cust-1',
    email: 'customer@tradenest.local',
    firstName: 'Cust',
    lastName: 'Omer',
    role: 'CUSTOMER',
  }

  const sellerUser: User = {
    id: 'sell-1',
    email: 'seller@tradenest.local',
    firstName: 'Sell',
    lastName: 'Er',
    role: 'SELLER',
  }

  const adminUser: User = {
    id: 'adm-1',
    email: 'admin@tradenest.local',
    firstName: 'Ad',
    lastName: 'Min',
    role: 'ADMIN',
  }

  beforeEach(() => {
    window.sessionStorage.clear()
    window.localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('correctly maps roles to role scopes', () => {
    expect(getRoleScope('CUSTOMER')).toBe('customer')
    expect(getRoleScope('SELLER')).toBe('seller')
    expect(getRoleScope('ADMIN')).toBe('admin')
    expect(getRoleScope('SUPER_ADMIN')).toBe('admin')
    expect(getRoleScope(null)).toBe('customer')
  })

  it('correctly determines role scope from path', () => {
    expect(getPathRoleScope('/admin/dashboard')).toBe('admin')
    expect(getPathRoleScope('/admin/sellers')).toBe('admin')
    expect(getPathRoleScope('/seller/dashboard')).toBe('seller')
    expect(getPathRoleScope('/seller/inventory')).toBe('seller')
    expect(getPathRoleScope('/cart')).toBe('customer')
    expect(getPathRoleScope('/checkout')).toBe('customer')
    expect(getPathRoleScope('/profile')).toBe('customer')
    expect(getPathRoleScope('/orders')).toBe('customer')
    expect(getPathRoleScope('/login')).toBe(null)
    expect(getPathRoleScope('/register')).toBe(null)
    expect(getPathRoleScope('/')).toBe(null)
    expect(getPathRoleScope('/products')).toBe(null)
    expect(getPathRoleScope('/products/laptop-xyz')).toBe(null)
  })

  it('stores customer, seller, and admin without overwriting each other in localStorage', () => {
    const initialState = {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
    }

    // Step 1: Customer logs in
    authReducer(
      initialState,
      setCredentials({ user: customerUser, accessToken: 'token-cust', refreshToken: 'ref-cust' })
    )

    // Verify customer stored in its own key
    const customerStored = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)!)
    expect(customerStored.user.email).toBe('customer@tradenest.local')

    // Step 2: Seller logs in (simulating Tab 2)
    authReducer(
      initialState,
      setCredentials({ user: sellerUser, accessToken: 'token-sell', refreshToken: 'ref-sell' })
    )

    // Verify seller stored in its own key
    const sellerStored = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)!)
    expect(sellerStored.user.email).toBe('seller@tradenest.local')
    // Verify customer storage was NOT overwritten!
    const customerStillExists = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)!)
    expect(customerStillExists.user.email).toBe('customer@tradenest.local')

    // Step 3: Admin logs in (simulating Tab 3)
    authReducer(
      initialState,
      setCredentials({ user: adminUser, accessToken: 'token-adm', refreshToken: 'ref-adm' })
    )

    // Verify all 3 roles coexist in localStorage independently
    const adminStored = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.admin)!)
    expect(adminStored.user.email).toBe('admin@tradenest.local')
    expect(JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)!).user.email).toBe('seller@tradenest.local')
    expect(JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)!).user.email).toBe('customer@tradenest.local')
  })

  it('preserves tab sessionStorage on refresh so tabs do not swap logins', () => {
    // Tab 1 has customer in its isolated sessionStorage
    window.sessionStorage.setItem(
      SESSION_AUTH_KEY,
      JSON.stringify({ user: customerUser, accessToken: 'token-cust', refreshToken: 'ref-cust', isAuthenticated: true })
    )

    // Meanwhile, someone else logged into Admin in another tab, setting admin in localStorage
    window.localStorage.setItem(
      ROLE_AUTH_KEYS.admin,
      JSON.stringify({ user: adminUser, accessToken: 'token-adm', refreshToken: 'ref-adm', isAuthenticated: true })
    )

    // Refreshing Tab 1 on storefront (/)
    window.history.pushState({}, '', '/')
    const loaded = loadStoredAuth()

    // Must still be customer! NOT hijacked by admin!
    expect(loaded.user?.role).toBe('CUSTOMER')
    expect(loaded.user?.email).toBe('customer@tradenest.local')
    expect(loaded.accessToken).toBe('token-cust')
  })

  it('auto-hydrates correct role when opening a dedicated role route in a fresh tab', () => {
    window.sessionStorage.clear()
    window.localStorage.setItem(
      ROLE_AUTH_KEYS.admin,
      JSON.stringify({ user: adminUser, accessToken: 'token-adm', refreshToken: 'ref-adm', isAuthenticated: true })
    )
    window.localStorage.setItem(
      ROLE_AUTH_KEYS.seller,
      JSON.stringify({ user: sellerUser, accessToken: 'token-sell', refreshToken: 'ref-sell', isAuthenticated: true })
    )

    // Fresh tab opens /admin/dashboard
    window.history.pushState({}, '', '/admin/dashboard')
    const adminTabAuth = loadStoredAuth()
    expect(adminTabAuth.user?.role).toBe('ADMIN')

    // Fresh tab opens /seller/dashboard
    window.sessionStorage.clear()
    window.history.pushState({}, '', '/seller/dashboard')
    const sellerTabAuth = loadStoredAuth()
    expect(sellerTabAuth.user?.role).toBe('SELLER')
  })

  it('does not auto-hydrate when opening /login in a fresh tab so user can log in freely', () => {
    window.sessionStorage.clear()
    window.localStorage.setItem(
      ROLE_AUTH_KEYS.customer,
      JSON.stringify({ user: customerUser, accessToken: 'token-cust', refreshToken: 'ref-cust', isAuthenticated: true })
    )

    window.history.pushState({}, '', '/login')
    const loginTabAuth = loadStoredAuth()
    expect(loginTabAuth.user).toBeUndefined()
    expect(loginTabAuth.isAuthenticated).toBeUndefined()
  })

  it('clears only the relevant role from localStorage and tab sessionStorage on role logout', () => {
    const state = {
      user: sellerUser,
      accessToken: 'token-sell',
      refreshToken: 'ref-sell',
      isAuthenticated: true,
      loading: false,
    }

    // Set all 3 roles in localStorage
    window.localStorage.setItem(ROLE_AUTH_KEYS.customer, JSON.stringify({ user: customerUser }))
    window.localStorage.setItem(ROLE_AUTH_KEYS.seller, JSON.stringify({ user: sellerUser }))
    window.localStorage.setItem(ROLE_AUTH_KEYS.admin, JSON.stringify({ user: adminUser }))
    window.sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify({ user: sellerUser }))

    // Logout seller
    const nextState = authReducer(state, logout({ scope: 'seller' }))

    expect(nextState.isAuthenticated).toBe(false)
    expect(nextState.user).toBe(null)
    expect(window.sessionStorage.getItem(SESSION_AUTH_KEY)).toBe(null)
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)).toBe(null)

    // Customer and Admin must remain untouched!
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)).not.toBe(null)
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.admin)).not.toBe(null)
  })

  it('logoutAll clears all role credentials', () => {
    const state = {
      user: adminUser,
      accessToken: 'token-adm',
      refreshToken: 'ref-adm',
      isAuthenticated: true,
      loading: false,
    }

    window.localStorage.setItem(ROLE_AUTH_KEYS.customer, JSON.stringify({ user: customerUser }))
    window.localStorage.setItem(ROLE_AUTH_KEYS.seller, JSON.stringify({ user: sellerUser }))
    window.localStorage.setItem(ROLE_AUTH_KEYS.admin, JSON.stringify({ user: adminUser }))
    window.sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify({ user: adminUser }))

    authReducer(state, logoutAll())

    expect(window.sessionStorage.getItem(SESSION_AUTH_KEY)).toBe(null)
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)).toBe(null)
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)).toBe(null)
    expect(window.localStorage.getItem(ROLE_AUTH_KEYS.admin)).toBe(null)
  })
})
