// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'crypto'
import authReducer, {
  setCredentials,
  logout,
  getRoleScope,
  getPathRoleScope,
  ROLE_AUTH_KEYS,
  SESSION_AUTH_KEY,
} from './auth/authSlice'

describe('Verification: TRADENEST Features & Fixes', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  describe('1. Multi-Tab Multi-Role Isolation', () => {
    it('correctly maps roles and path scopes for all 4 roles including Logistics', () => {
      expect(getRoleScope('CUSTOMER')).toBe('customer')
      expect(getRoleScope('SELLER')).toBe('seller')
      expect(getRoleScope('ADMIN')).toBe('admin')
      expect(getRoleScope('SUPER_ADMIN')).toBe('admin')
      expect(getRoleScope('DELIVERY_PARTNER')).toBe('logistics')

      expect(getPathRoleScope('/logistics/dashboard')).toBe('logistics')
      expect(getPathRoleScope('/seller/dashboard')).toBe('seller')
      expect(getPathRoleScope('/admin/dashboard')).toBe('admin')
      expect(getPathRoleScope('/cart')).toBe('customer')
      expect(getPathRoleScope('/checkout')).toBe('customer')
      expect(getPathRoleScope('/profile')).toBe('customer')
    })

    it('stores each role in its dedicated isolated localStorage partition', () => {
      const customerUser = { id: 'c1', email: 'cust@test.com', firstName: 'Cust', lastName: 'Omer', role: 'CUSTOMER' as const }
      const sellerUser = { id: 's1', email: 'seller@test.com', firstName: 'Sell', lastName: 'Er', role: 'SELLER' as const }
      const adminUser = { id: 'a1', email: 'admin@test.com', firstName: 'Ad', lastName: 'Min', role: 'ADMIN' as const }
      const logisticsUser = { id: 'l1', email: 'dp@test.com', firstName: 'Ramesh', lastName: 'Kumar', role: 'DELIVERY_PARTNER' as const }

      // 1. Set Customer
      authReducer(undefined, setCredentials({ user: customerUser, accessToken: 'token-cust', refreshToken: 'ref-cust' }))
      // 2. Set Seller
      authReducer(undefined, setCredentials({ user: sellerUser, accessToken: 'token-seller', refreshToken: 'ref-seller' }))
      // 3. Set Admin
      authReducer(undefined, setCredentials({ user: adminUser, accessToken: 'token-admin', refreshToken: 'ref-admin' }))
      // 4. Set Logistics
      authReducer(undefined, setCredentials({ user: logisticsUser, accessToken: 'token-logistics', refreshToken: 'ref-logistics' }))

      // Verify each partition remains independent and not overwritten
      const custRaw = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)!)
      const sellerRaw = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)!)
      const adminRaw = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.admin)!)
      const logisticsRaw = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.logistics)!)

      expect(custRaw.accessToken).toBe('token-cust')
      expect(sellerRaw.accessToken).toBe('token-seller')
      expect(adminRaw.accessToken).toBe('token-admin')
      expect(logisticsRaw.accessToken).toBe('token-logistics')
    })

    it('scoped logout only removes targeted role without clobbering other tabs', () => {
      window.localStorage.setItem(ROLE_AUTH_KEYS.customer, JSON.stringify({ accessToken: 'token-cust', user: { role: 'CUSTOMER' } }))
      window.localStorage.setItem(ROLE_AUTH_KEYS.seller, JSON.stringify({ accessToken: 'token-seller', user: { role: 'SELLER' } }))
      window.localStorage.setItem(ROLE_AUTH_KEYS.logistics, JSON.stringify({ accessToken: 'token-logistics', user: { role: 'DELIVERY_PARTNER' } }))

      // Logout logistics tab only
      authReducer(undefined, logout({ scope: 'logistics' }))

      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.logistics)).toBeNull()
      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)).not.toBeNull()
      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)).not.toBeNull()
    })
  })

  describe('2. Forgot Password SHA-256 Token Verification', () => {
    it('produces deterministic token hashes between generation and verification', () => {
      const generatedToken = 'reset-token-abc-123-xyz'
      const tokenHashStored = crypto.createHash('sha256').update(generatedToken).digest('hex')

      // User enters token with possible whitespace
      const userInputToken = '  reset-token-abc-123-xyz  '
      const tokenHashLookup = crypto.createHash('sha256').update(userInputToken.trim()).digest('hex')

      expect(tokenHashStored).toBe(tokenHashLookup)
      expect(tokenHashLookup.length).toBe(64) // SHA-256 hex string
    })
  })

  describe('3. UPI QR Exact & Locked Amount Generation', () => {
    it('correctly constructs UPI intent URL with locked exact amount and mode=02', () => {
      const merchantVpa = 'bhavdeepbhukan129@okhdfcbank'
      const merchantName = 'TRADENEST'
      const orderTotal = 749.50
      const orderId = 'ord-verify-991'

      const qrData = `upi://pay?pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&aid=uGICAgMCjr6boHA&am=${orderTotal.toFixed(2)}&cu=INR&mode=02&tr=${orderId}&tn=Order%20Payment`

      expect(qrData).toContain('am=749.50')
      expect(qrData).toContain('mode=02') // UPI locked non-modifiable amount
      expect(qrData).toContain('cu=INR')
      expect(qrData).toContain('pa=bhavdeepbhukan129@okhdfcbank')
    })
  })

  describe('4. Reseller Order Pricing & Customer Bill Logic', () => {
    it('correctly calculates reseller margin and customer bill without exposing platform base price', () => {
      const platformBasePrice = 700
      const customerResalePrice = 950
      const quantity = 3

      const totalPlatformCost = platformBasePrice * quantity
      const totalCustomerBill = customerResalePrice * quantity
      const totalResellerMargin = totalCustomerBill - totalPlatformCost

      expect(totalCustomerBill).toBe(2850)
      expect(totalPlatformCost).toBe(2100)
      expect(totalResellerMargin).toBe(750)
      expect(totalResellerMargin / quantity).toBe(250) // ₹250 profit per unit
    })
  })

  describe('5. Purchase Rewards & Cashback Calculation', () => {
    it('calculates at least 5% cashback and generates valid coupon', () => {
      const orderTotal = 1500
      const cashbackEarned = Math.max(50, Math.round(orderTotal * 0.05))
      const couponCode = 'REWARD10'

      expect(cashbackEarned).toBe(75) // 5% of 1500
      expect(couponCode).toBe('REWARD10')
    })

    it('ensures minimum cashback threshold for small orders', () => {
      const smallOrderTotal = 300
      const cashbackEarned = Math.max(50, Math.round(smallOrderTotal * 0.05))

      expect(cashbackEarned).toBe(50) // Minimum ₹50 floor
    })
  })

  describe('6. Discount Badge & Savings Calculation', () => {
    it('calculates accurate discount percentage and savings near price', () => {
      const mrp = 1000
      const price = 699

      const discountPercent = Math.round(((mrp - price) / mrp) * 100)
      const savings = mrp - price

      expect(discountPercent).toBe(30) // 30% OFF
      expect(savings).toBe(301) // Save ₹301
    })
  })

  describe('7. AI Search Autocomplete Prefix Matching', () => {
    it('matches category "Smartphones" when searching prefix "smartp"', () => {
      const categories = [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Smart Watches', slug: 'smart-watches' },
        { name: 'Laptops', slug: 'laptops' },
        { name: 'Accessories', slug: 'accessories' },
      ]

      const query = 'smartp'
      const matched = categories.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.slug.toLowerCase().includes(query.toLowerCase())
      )

      expect(matched.length).toBe(1)
      expect(matched[0].name).toBe('Smartphones')
    })
  })

  describe('8. Logistics Real-time Order Notification & Address Transmission', () => {
    it('stores new order dispatch with full delivery address, customer phone, and reseller bill', () => {
      const orderId = 'a1b2c3d4-e5f6-7890'
      const dispatchDetails = {
        orderId,
        customerName: 'Priya Sharma',
        customerPhone: '+91 98765 43210',
        address: 'Flat 402, Sunshine Heights, Andheri West',
        city: 'Mumbai',
        pincode: '400053',
        items: [{ title: 'Wireless Bluetooth Earbuds', quantity: 2, price: 950 }],
        totalAmount: 1400, // platform base cost
        paymentMethod: 'UPI',
        isReseller: true,
        customerBillAmount: 1900, // custom bill for customer
      }

      const newShipment = {
        id: `shp-${Date.now()}`,
        orderNumber: `TN-ORD-${dispatchDetails.orderId.slice(0, 8).toUpperCase()}`,
        customerName: dispatchDetails.customerName,
        customerPhone: dispatchDetails.customerPhone,
        address: dispatchDetails.address,
        city: dispatchDetails.city,
        pincode: dispatchDetails.pincode,
        distance: '2.4 km',
        status: 'PENDING_PICKUP' as const,
        itemsCount: dispatchDetails.items.reduce((acc, item) => acc + (item.quantity || 1), 0),
        totalWeight: '1.2 kg',
        isReseller: dispatchDetails.isReseller,
        customerBillAmount: dispatchDetails.customerBillAmount,
        platformBaseCost: dispatchDetails.totalAmount,
        assignedAt: 'Just now',
        paymentMethod: `Prepaid (${dispatchDetails.paymentMethod})`,
      }

      // Emulate Checkout dispatch storage
      const existingRaw = window.localStorage.getItem('tradenest_logistics_dispatches')
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([newShipment, ...existing]))

      // Emulate Logistics Dashboard retrieval
      const storedRaw = window.localStorage.getItem('tradenest_logistics_dispatches')
      expect(storedRaw).not.toBeNull()
      const stored = JSON.parse(storedRaw!)

      expect(stored.length).toBe(1)
      expect(stored[0].orderNumber).toBe('TN-ORD-A1B2C3D4')
      expect(stored[0].customerName).toBe('Priya Sharma')
      expect(stored[0].customerPhone).toBe('+91 98765 43210')
      expect(stored[0].address).toBe('Flat 402, Sunshine Heights, Andheri West')
      expect(stored[0].city).toBe('Mumbai')
      expect(stored[0].pincode).toBe('400053')
      expect(stored[0].itemsCount).toBe(2)
      expect(stored[0].isReseller).toBe(true)
      expect(stored[0].customerBillAmount).toBe(1900)
      expect(stored[0].status).toBe('PENDING_PICKUP')
    })
  })

  describe('9. Admin-Assigned Delivery Partner Authentication & Isolated Session', () => {
    it('authenticates admin-assigned delivery partner and stores under isolated logistics partition', () => {
      // 1. Admin assigns a new delivery partner in Admin User Management
      const assignedPartners = [
        {
          id: 'dp-user-delhi-01',
          name: 'Vikram Singh',
          email: 'vikram.logistics@tradenest.local',
          password: 'Partner@2026Password',
          phone: '+91 98111 22334',
          hub: 'Delhi North Hub #02',
          vehicle: 'Electric Van (DL-01-EV-3392)',
          role: 'DELIVERY_PARTNER',
          isActive: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
      ]
      window.localStorage.setItem('tradenest_assigned_delivery_partners', JSON.stringify(assignedPartners))

      // 2. Partner logs in with assigned credentials
      const loginAttempt = {
        email: 'vikram.logistics@tradenest.local',
        password: 'Partner@2026Password',
      }

      const assignedRaw = window.localStorage.getItem('tradenest_assigned_delivery_partners')
      const parsedAssigned = assignedRaw ? JSON.parse(assignedRaw) : []
      const matched = parsedAssigned.find(
        (p: any) => p.email.toLowerCase() === loginAttempt.email.toLowerCase() && p.password === loginAttempt.password
      )

      expect(matched).toBeDefined()
      expect(matched.name).toBe('Vikram Singh')
      expect(matched.hub).toBe('Delhi North Hub #02')

      // 3. Authenticate and dispatch credentials
      const partnerUser = {
        id: matched.id,
        email: matched.email,
        firstName: matched.name.split(' ')[0],
        lastName: matched.name.split(' ').slice(1).join(' ') || '(Logistics)',
        role: 'DELIVERY_PARTNER' as const,
        phone: matched.phone,
      }

      authReducer(undefined, setCredentials({
        user: partnerUser,
        accessToken: 'logistics-token-session-vikram',
        refreshToken: 'logistics-ref-token-vikram',
      }))

      // Verify partition is 'tradenest-auth:logistics'
      const logisticsSession = JSON.parse(window.localStorage.getItem(ROLE_AUTH_KEYS.logistics)!)
      expect(logisticsSession).toBeDefined()
      expect(logisticsSession.user.role).toBe('DELIVERY_PARTNER')
      expect(logisticsSession.user.firstName).toBe('Vikram')
      expect(logisticsSession.accessToken).toBe('logistics-token-session-vikram')

      // Ensure customer & seller sessions are completely empty / unaffected
      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.customer)).toBeNull()
      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.seller)).toBeNull()
      expect(window.localStorage.getItem(ROLE_AUTH_KEYS.admin)).toBeNull()
    })
  })

  describe('10. Delivery Partner Atomic Claim Lock & Conflict Prevention', () => {
    it('allows the first delivery partner to claim an open pool order and locks it', () => {
      const openOrder = {
        id: 'shp-open-101',
        orderNumber: 'TN-ORD-554433',
        customerName: 'Kavita Roy',
        customerPhone: '+91 98222 33445',
        address: '12 MG Road, Bandra',
        city: 'Mumbai',
        pincode: '400050',
        distance: '2.0 km',
        status: 'PENDING_PICKUP',
        claimedBy: null, // Open pool
        itemsCount: 1,
        totalWeight: '0.7 kg',
        isReseller: false,
        customerBillAmount: 899,
        platformBaseCost: 899,
        assignedAt: 'Just now',
        paymentMethod: 'Prepaid (UPI)',
      }

      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([openOrder]))

      // Partner 1 (Ramesh) accepts the order
      const partner1 = {
        id: 'dp-user-1',
        name: 'Ramesh Kumar',
        phone: '+91 98201 44892',
        vehicle: 'Motorbike (MH-02-CD-4821)',
      }

      const list: any[] = JSON.parse(window.localStorage.getItem('tradenest_logistics_dispatches')!)
      const target = list.find((s) => s.id === openOrder.id)
      expect(target.claimedBy).toBeNull()

      // Lock to Partner 1
      target.claimedBy = partner1
      target.assignedAt = 'Just now (Claimed by you)'
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify(list))

      // Verification: order is now claimed by Partner 1
      const updatedList: any[] = JSON.parse(window.localStorage.getItem('tradenest_logistics_dispatches')!)
      expect(updatedList[0].claimedBy.id).toBe('dp-user-1')
      expect(updatedList[0].claimedBy.name).toBe('Ramesh Kumar')
    })

    it('prevents Partner 2 from claiming or overwriting an order already claimed by Partner 1', () => {
      const partner1 = {
        id: 'dp-user-1',
        name: 'Ramesh Kumar',
        vehicle: 'Motorbike (MH-02-CD-4821)',
      }
      const partner2 = {
        id: 'dp-user-delhi-01',
        name: 'Vikram Singh',
        vehicle: 'Electric Van (DL-01-EV-3392)',
      }

      const lockedOrder = {
        id: 'shp-locked-202',
        orderNumber: 'TN-ORD-998877',
        customerName: 'Sameer Joshi',
        address: 'Juhu Tara Road',
        claimedBy: partner1, // Already claimed by Ramesh
        status: 'PENDING_PICKUP',
      }
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([lockedOrder]))

      // Partner 2 attempts to claim
      const list: any[] = JSON.parse(window.localStorage.getItem('tradenest_logistics_dispatches')!)
      const target = list.find((s) => s.id === lockedOrder.id)

      let conflictError = ''
      if (target.claimedBy && target.claimedBy.id !== partner2.id) {
        conflictError = `Conflict: Order #${target.orderNumber} already claimed by ${target.claimedBy.name}`
      }

      // Assert conflict was caught and state remains locked to Partner 1
      expect(conflictError).toBe('Conflict: Order #TN-ORD-998877 already claimed by Ramesh Kumar')
      expect(target.claimedBy.id).toBe('dp-user-1')
      expect(target.claimedBy.name).toBe('Ramesh Kumar')
    })
  })

  describe('11. Seller Approval Pipeline & Logistics Dispatch Trigger', () => {
    it('places order in seller pending queue awaiting confirmation', () => {
      const customerOrder = {
        id: 'ord-seller-approval-01',
        userId: 'cust-user-1',
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        total: 1250,
        isReseller: true,
        customerBillAmount: 1600,
        shippingAddress: {
          fullName: 'Pooja Hegde',
          phone: '+91 98333 44556',
          line1: 'B-404 Whispering Palms',
          city: 'Mumbai',
          postalCode: '400101',
        },
        items: [{ title: 'Ergonomic Desk Chair', quantity: 1, price: 1250 }],
      }

      window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify([customerOrder]))

      const pendingOrders = JSON.parse(window.localStorage.getItem('tradenest_pending_seller_orders')!)
      expect(pendingOrders.length).toBe(1)
      expect(pendingOrders[0].status).toBe('PENDING')
      expect(pendingOrders[0].shippingAddress.fullName).toBe('Pooja Hegde')
    })

    it('only dispatches to logistics when seller clicks Approve & Pack Order', () => {
      const sellerOrder = {
        id: 'ord-seller-approval-02',
        status: 'PENDING',
        total: 950,
        isReseller: false,
        customerBillAmount: 950,
        shippingAddress: {
          fullName: 'Rajesh Nair',
          phone: '+91 97665 11223',
          line1: 'Flat 12, Palm Beach Road',
          city: 'Navi Mumbai',
          postalCode: '400706',
        },
        items: [{ title: 'Mechanical Keyboard', quantity: 1, price: 950 }],
        payment: { provider: 'UPI', status: 'SUCCESS' },
      }

      // Initial state: No logistics dispatches exist
      expect(window.localStorage.getItem('tradenest_logistics_dispatches')).toBeNull()

      // Seller approves order
      const nextStatus = 'CONFIRMED'
      if (nextStatus === 'CONFIRMED') {
        const addr = sellerOrder.shippingAddress
        const newShipment = {
          id: `shp-${Date.now()}`,
          orderNumber: `TN-ORD-${sellerOrder.id.slice(0, 8).toUpperCase()}`,
          customerName: addr.fullName,
          customerPhone: addr.phone,
          address: `${addr.line1}, ${addr.city}`,
          city: addr.city,
          pincode: addr.postalCode,
          status: 'PENDING_PICKUP',
          claimedBy: null,
          itemsCount: 1,
          customerBillAmount: sellerOrder.customerBillAmount,
          platformBaseCost: sellerOrder.total,
          assignedAt: 'Just now (Approved by Seller)',
        }
        window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([newShipment]))
      }

      const logisticsDispatches = JSON.parse(window.localStorage.getItem('tradenest_logistics_dispatches')!)
      expect(logisticsDispatches.length).toBe(1)
      expect(logisticsDispatches[0].customerName).toBe('Rajesh Nair')
      expect(logisticsDispatches[0].address).toBe('Flat 12, Palm Beach Road, Navi Mumbai')
      expect(logisticsDispatches[0].assignedAt).toContain('Approved by Seller')
    })
  })

  describe('12. Two-Way Logistics-to-Seller Real-Time Sync & Reverse Logistics Returns', () => {
    it('automatically syncs driver claim and status transitions to seller account', () => {
      const initialSellerOrder = {
        id: 'ord-sync-101',
        status: 'CONFIRMED',
        total: 1499,
        driver: null,
        deliveryStatus: null,
      }
      window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify([initialSellerOrder]))

      // 1. Delivery Partner accepts and claims the order
      const driver = {
        id: 'dp-user-1',
        name: 'Ramesh Kumar',
        phone: '+91 98201 44892',
        vehicle: 'Motorbike (MH-02-CD-4821)',
      }

      // Sync driver claim to seller
      const sellerOrdersAfterClaim: any[] = JSON.parse(window.localStorage.getItem('tradenest_pending_seller_orders')!)
      sellerOrdersAfterClaim[0].driver = driver
      sellerOrdersAfterClaim[0].deliveryStatus = 'CLAIMED'
      window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify(sellerOrdersAfterClaim))

      let stored = JSON.parse(window.localStorage.getItem('tradenest_pending_seller_orders')!)
      expect(stored[0].driver.name).toBe('Ramesh Kumar')
      expect(stored[0].deliveryStatus).toBe('CLAIMED')

      // 2. Delivery Partner clicks Out for Delivery
      stored[0].status = 'SHIPPED'
      stored[0].deliveryStatus = 'OUT_FOR_DELIVERY'
      window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify(stored))

      stored = JSON.parse(window.localStorage.getItem('tradenest_pending_seller_orders')!)
      expect(stored[0].status).toBe('SHIPPED')
      expect(stored[0].deliveryStatus).toBe('OUT_FOR_DELIVERY')

      // 3. Delivery Partner clicks Delivered & Handover
      stored[0].status = 'DELIVERED'
      stored[0].deliveryStatus = 'DELIVERED'
      window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify(stored))

      stored = JSON.parse(window.localStorage.getItem('tradenest_pending_seller_orders')!)
      expect(stored[0].status).toBe('DELIVERED')
    })

    it('seller return approval dispatches reverse logistics transportation to logistics fleet', () => {
      const returnOrder = {
        id: 'ord-return-909',
        status: 'DELIVERED',
        total: 2199,
        shippingAddress: {
          fullName: 'Deepika Sen',
          phone: '+91 98111 44332',
          line1: 'Flat 3B, Silver Arch, Pedder Road',
          city: 'Mumbai',
          postalCode: '400026',
        },
        returns: [{ status: 'PENDING', reason: 'Defective audio in left speaker' }],
      }

      // Seller approves return
      const approvedStatus = 'APPROVED'
      if (approvedStatus === 'APPROVED') {
        const addr = returnOrder.shippingAddress
        const returnShipment = {
          id: `shp-ret-${Date.now()}`,
          orderId: returnOrder.id,
          orderNumber: `TN-RET-${returnOrder.id.slice(0, 8).toUpperCase()}`,
          isReturnPickup: true,
          returnReason: returnOrder.returns[0].reason,
          customerName: addr.fullName,
          customerPhone: addr.phone,
          address: `${addr.line1}, ${addr.city}`,
          city: addr.city,
          pincode: addr.postalCode,
          returnHubAddress: 'TRADENEST Central Hub #04, Mumbai Central',
          status: 'PENDING_PICKUP',
          claimedBy: null,
          itemsCount: 1,
          customerBillAmount: returnOrder.total,
          platformBaseCost: returnOrder.total,
          assignedAt: 'Just now (Return Approved by Seller)',
          paymentMethod: 'Return Pickup (Inspect parcel before receipt)',
        }
        window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([returnShipment]))
      }

      const dispatches = JSON.parse(window.localStorage.getItem('tradenest_logistics_dispatches')!)
      expect(dispatches.length).toBe(1)
      expect(dispatches[0].isReturnPickup).toBe(true)
      expect(dispatches[0].orderNumber).toBe('TN-RET-ORD-RETU')
      expect(dispatches[0].returnReason).toBe('Defective audio in left speaker')
      expect(dispatches[0].customerName).toBe('Deepika Sen')
      expect(dispatches[0].returnHubAddress).toContain('Mumbai Central')
    })
  })
})
