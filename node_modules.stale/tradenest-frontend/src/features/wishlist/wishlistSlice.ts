import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface WishlistState {
  productIds: string[]
}

const initialState: WishlistState = { productIds: [] }

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