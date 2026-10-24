import { describe, it, expect, beforeEach } from 'vitest'
import cartReducer, { addItem, removeItem, updateQuantity, clearCart, setCartItems } from './cartSlice'

describe('cartSlice reducer', () => {
  it('should initialize with empty or loaded state', () => {
    const state = cartReducer(undefined, { type: 'unknown' })
    expect(Array.isArray(state.items)).toBe(true)
  })

  it('should handle addItem for a new product', () => {
    const prevState = { items: [] }
    const nextState = cartReducer(prevState, addItem({ productId: 'prod-1', quantity: 2 }))
    expect(nextState.items).toEqual([{ productId: 'prod-1', quantity: 2 }])
  })

  it('should increment quantity when addItem is called for existing product', () => {
    const prevState = { items: [{ productId: 'prod-1', quantity: 2 }] }
    const nextState = cartReducer(prevState, addItem({ productId: 'prod-1', quantity: 3 }))
    expect(nextState.items).toEqual([{ productId: 'prod-1', quantity: 5 }])
  })

  it('should update item quantity', () => {
    const prevState = { items: [{ productId: 'prod-1', quantity: 2 }] }
    const nextState = cartReducer(prevState, updateQuantity({ productId: 'prod-1', quantity: 10 }))
    expect(nextState.items[0].quantity).toBe(10)
  })

  it('should remove item from cart', () => {
    const prevState = { items: [{ productId: 'prod-1', quantity: 2 }, { productId: 'prod-2', quantity: 1 }] }
    const nextState = cartReducer(prevState, removeItem('prod-1'))
    expect(nextState.items).toEqual([{ productId: 'prod-2', quantity: 1 }])
  })

  it('should clear all cart items', () => {
    const prevState = { items: [{ productId: 'prod-1', quantity: 2 }] }
    const nextState = cartReducer(prevState, clearCart())
    expect(nextState.items).toEqual([])
  })
})
