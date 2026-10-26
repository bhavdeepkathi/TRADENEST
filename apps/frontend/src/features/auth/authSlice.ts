import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN' | 'DELIVERY_PARTNER'
  avatarUrl?: string
  phone?: string
}

export type RoleScope = 'admin' | 'seller' | 'customer' | 'logistics'

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
}

export const SESSION_AUTH_KEY = 'tradenest-auth'
export const ROLE_AUTH_KEYS: Record<RoleScope, string> = {
  admin: 'tradenest-auth:admin',
  seller: 'tradenest-auth:seller',
  customer: 'tradenest-auth:customer',
  logistics: 'tradenest-auth:logistics',
}

export function getRoleScope(role?: string | null): RoleScope {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'admin'
  if (role === 'SELLER') return 'seller'
  if (role === 'DELIVERY_PARTNER') return 'logistics'
  return 'customer'
}

export function getPathRoleScope(pathname: string): RoleScope | null {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/seller')) return 'seller'
  if (pathname.startsWith('/logistics')) return 'logistics'
  if (
    pathname.startsWith('/cart') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/orders')
  ) {
    return 'customer'
  }
  return null
}

export function getStoredAuthForRole(scope: RoleScope): Partial<AuthState> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ROLE_AUTH_KEYS[scope])
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (parsed?.accessToken && parsed?.user) {
      return parsed
    }
  } catch {}
  return null
}

export function loadStoredAuth(): Partial<AuthState> {
  if (typeof window === 'undefined') return {}

  const pathname = window.location?.pathname || '/'
  const targetScope = getPathRoleScope(pathname)

  // 1. Try tab-isolated sessionStorage first
  try {
    const sessionRaw = window.sessionStorage.getItem(SESSION_AUTH_KEY)
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as Partial<AuthState>
      if (parsed?.accessToken && parsed?.user) {
        const sessionScope = getRoleScope(parsed.user.role)
        // If this tab is explicitly on a dedicated role route (e.g. /admin or /seller)
        // and doesn't match the current sessionStorage, switch to that role's stored session if available.
        if (targetScope && sessionScope !== targetScope) {
          const roleStored = getStoredAuthForRole(targetScope)
          if (roleStored?.accessToken && roleStored?.user) {
            try {
              window.sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(roleStored))
            } catch {}
            return roleStored
          }
        }
        return parsed
      }
    }
  } catch {
    try {
      window.sessionStorage.removeItem(SESSION_AUTH_KEY)
    } catch {}
  }

  // 2. On auth pages (/login, /register, /verify-email, /forgot-password, /reset-password) when sessionStorage is empty,
  // do NOT auto-hydrate so user can freely log into any account on this new tab.
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password'
  ) {
    return {}
  }

  // 3. Check role-specific localStorage for the current route scope
  if (targetScope) {
    const roleStored = getStoredAuthForRole(targetScope)
    if (roleStored?.accessToken && roleStored?.user) {
      try {
        window.sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(roleStored))
      } catch {}
      return roleStored
    }
  }

  // 4. For root or general catalog routes, check for stored customer auth
  if (pathname === '/' || pathname.startsWith('/products')) {
    const customerStored = getStoredAuthForRole('customer')
    if (customerStored?.accessToken && customerStored?.user) {
      try {
        window.sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(customerStored))
      } catch {}
      return customerStored
    }
  }

  // 5. Migration fallback for existing localStorage['tradenest-auth']
  try {
    const legacyRaw = window.localStorage.getItem('tradenest-auth')
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as Partial<AuthState>
      if (parsed?.accessToken && parsed?.user) {
        const legacyScope = getRoleScope(parsed.user.role)
        window.localStorage.setItem(ROLE_AUTH_KEYS[legacyScope], legacyRaw)
        window.sessionStorage.setItem(SESSION_AUTH_KEY, legacyRaw)
        window.localStorage.removeItem('tradenest-auth')
        if (!targetScope || targetScope === legacyScope) {
          return parsed
        }
      } else {
        window.localStorage.removeItem('tradenest-auth')
      }
    }
  } catch {}

  return {}
}

const persistedAuth = loadStoredAuth()

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  ...persistedAuth,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true

      const payloadToSave = JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })

      if (typeof window !== 'undefined') {
        try {
          // Save to this tab's isolated sessionStorage
          window.sessionStorage.setItem(SESSION_AUTH_KEY, payloadToSave)

          // Save to role-partitioned localStorage so different roles never overwrite each other
          const scope = getRoleScope(state.user.role)
          window.localStorage.setItem(ROLE_AUTH_KEYS[scope], payloadToSave)
          // Clean legacy shared key to avoid stale state
          window.localStorage.removeItem('tradenest-auth')
        } catch {}
      }
    },
    logout: {
      reducer: (state, action: PayloadAction<{ scope?: RoleScope } | undefined>) => {
        const scope = action.payload?.scope || (state.user?.role ? getRoleScope(state.user.role) : null)

        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false

        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem(SESSION_AUTH_KEY)
            window.localStorage.removeItem('tradenest-auth')
            if (scope) {
              window.localStorage.removeItem(ROLE_AUTH_KEYS[scope])
            }
          } catch {}
        }
      },
      prepare: (payload?: { scope?: RoleScope }) => ({ payload }),
    },
    logoutAll: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false

      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem(SESSION_AUTH_KEY)
          window.localStorage.removeItem('tradenest-auth')
          window.localStorage.removeItem(ROLE_AUTH_KEYS.admin)
          window.localStorage.removeItem(ROLE_AUTH_KEYS.seller)
          window.localStorage.removeItem(ROLE_AUTH_KEYS.customer)
        } catch {}
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setCredentials, logout, logoutAll, setLoading } = authSlice.actions
export default authSlice.reducer
