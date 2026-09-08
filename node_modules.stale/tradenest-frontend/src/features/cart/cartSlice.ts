import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  productId: string
  quantity: number
}

interface CartState {
  items: CartItem[]
}

const CART_STORAGE_KEY = 'tradenest-cart'

function loadCartItems(): CartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    const items = stored ? JSON.parse(stored) : []
    return Array.isArray(items) ? items.filter((item) => typeof item?.productId === 'string' && Number.isInteger(item?.quantity) && item.quantity > 0) : []
  } catch {
    return []
  }
}

export function persistCartItems(items: CartItem[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

const initialState: CartState = { items: loadCartItems() }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((i) => i.productId === action.payload.productId)
      if (existing) existing.quantity += action.payload.quantity
      else state.items.push(action.payload)
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.productId !== action.payload)
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.productId === action.payload.productId)
      if (item) item.quantity = action.payload.quantity
    },
    clearCart: (state) => {
      state.items = []
    },
  },
})

export const { setCartItems, addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions
export default cartSlice.reducer