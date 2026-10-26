import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface WishlistState {
  productIds: string[]
}

const WISHLIST_STORAGE_KEY = 'tradenest-wishlist'

function loadWishlistProductIds(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const session = window.sessionStorage.getItem(WISHLIST_STORAGE_KEY)
    if (session) {
      const productIds: unknown = JSON.parse(session)
      if (Array.isArray(productIds)) {
        return productIds.filter((id): id is string => typeof id === 'string')
      }
    }
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
    const productIds: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(productIds) ? productIds.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function persistWishlistProductIds(productIds: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds))
    const sessionRaw = window.sessionStorage.getItem('tradenest-auth')
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw)
      const role = parsed?.user?.role
      if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SELLER') {
        return
      }
    }
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds))
  } catch {}
}

const initialState: WishlistState = { productIds: loadWishlistProductIds() }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggle: (state, action: PayloadAction<string>) => {
      const idx = state.productIds.indexOf(action.payload)
      if (idx === -1) state.productIds.push(action.payload)
      else state.productIds.splice(idx, 1)
    },
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.productIds = action.payload
    },
    clearWishlist: (state) => {
      state.productIds = []
    },
  },
})

export const { toggle, setWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
