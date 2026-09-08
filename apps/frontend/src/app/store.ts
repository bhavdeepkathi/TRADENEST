import { configureStore } from '@reduxjs/toolkit'
import { api } from './api'
import authReducer from '../features/auth/authSlice'
import cartReducer from '../features/cart/cartSlice'
import wishlistReducer from '../features/wishlist/wishlistSlice'
import cartReducer, { persistCartItems } from '../features/cart/cartSlice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

store.subscribe(() => persistCartItems(store.getState().cart.items))

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch