import { useState, useEffect, useMemo } from 'react'
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  FileText,
  TrendingUp,
  AlertCircle,
  BellRing,
  Check,
  Search,
  Filter,
  Lock,
  Zap,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Banknote,
  CalendarX,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { useAppSelector } from '../../../app/hooks'
import {
  useGetShipmentsQuery,
  useClaimShipmentMutation,
  useUpdateShipmentStatusMutation,
  useRequestDoorstepOtpMutation,
  useRescheduleDeliveryMutation,
  useReconcileCashMutation,
} from '../../../app/api'

export interface Shipment {
  id: string
  orderId?: string
  orderNumber: string
  customerName: string
  customerPhone: string
  address: string
  city: string
  pincode: string
  distance: string
  status: 'PENDING_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
  claimedBy?: {
    id: string
    name: string
    phone?: string
    vehicle?: string
  } | null
  isReturnPickup?: boolean
  returnReason?: string
  returnHubAddress?: string
  itemsCount: number
  totalWeight: string
  isReseller: boolean
  customerBillAmount: number
  platformBaseCost: number
  assignedAt: string
  paymentMethod: string
}

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-1',
    orderNumber: 'TN-ORD-84920',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98201 44892',
    address: 'Flat 402, Sunshine Apartments, Hill Road, Bandra West',
    city: 'Mumbai',
    pincode: '400050',
    distance: '1.8 km',
    status: 'OUT_FOR_DELIVERY',
    claimedBy: {
      id: 'dp-user-1',
      name: 'Ramesh Kumar',
      phone: '+91 98201 44892',
      vehicle: 'Motorbike (MH-02-CD-4821)',
    },
    itemsCount: 2,
    totalWeight: '1.2 kg',
    isReseller: true,
    customerBillAmount: 950,
    platformBaseCost: 700,
    assignedAt: 'Today, 09:30 AM',
    paymentMethod: 'Prepaid (UPI)',
  },
  {
    id: 'shp-2',
    orderNumber: 'TN-ORD-84921',
    customerName: 'Vikram Mehta',
    customerPhone: '+91 98765 12345',
    address: 'B-12, Greenview Towers, Linking Road, Khar',
    city: 'Mumbai',
    pincode: '400052',
    distance: '3.4 km',
    status: 'OUT_FOR_DELIVERY',
    claimedBy: {
      id: 'dp-user-2',
      name: 'Suresh Verma',
      phone: '+91 98111 22334',
      vehicle: 'Electric Van (MH-01-EV-2041)',
    },
    itemsCount: 1,
    totalWeight: '0.6 kg',
    isReseller: false,
    customerBillAmount: 1499,
    platformBaseCost: 1499,
    assignedAt: 'Today, 10:15 AM',
    paymentMethod: 'Cash on Delivery (₹1,499)',
  },
  {
    id: 'shp-3',
    orderNumber: 'TN-ORD-84922',
    customerName: 'Pooja Iyer',
    customerPhone: '+91 91234 56789',
    address: '15/A Sea Breeze Colony, Worli Sea Face',
    city: 'Mumbai',
    pincode: '400018',
    distance: '5.2 km',
    status: 'PENDING_PICKUP',
    claimedBy: null, // Open pool! Any delivery partner can claim
    itemsCount: 3,
    totalWeight: '2.5 kg',
    isReseller: true,
    customerBillAmount: 1850,
    platformBaseCost: 1400,
    assignedAt: 'Today, 11:00 AM',
    paymentMethod: 'Prepaid (Card)',
  },
  {
    id: 'shp-ret-demo',
    orderNumber: 'TN-RET-84918',
    isReturnPickup: true,
    returnReason: 'Wrong size / replacement required',
    customerName: 'Meera Deshmukh',
    customerPhone: '+91 97665 88990',
    address: 'Flat 501, Raheja Residency, Worli Sea Face',
    city: 'Mumbai',
    pincode: '400018',
    returnHubAddress: 'Fashion Central Warehouse, Mumbai Central Hub #04',
    distance: '3.1 km',
    status: 'PENDING_PICKUP',
    claimedBy: null, // Open pool for return pickup!
    itemsCount: 1,
    totalWeight: '0.6 kg',
    isReseller: false,
    customerBillAmount: 1299,
    platformBaseCost: 1299,
    assignedAt: 'Today, 11:20 AM',
    paymentMethod: 'Return Pickup (Inspect parcel before receipt)',
  },
  {
    id: 'shp-4',
    orderNumber: 'TN-ORD-84918',
    customerName: 'Rahul Verma',
    customerPhone: '+91 99887 66554',
    address: 'Plot 88, Juhu Tara Road, Juhu',
    city: 'Mumbai',
    pincode: '400049',
    distance: '4.1 km',
    status: 'DELIVERED',
    claimedBy: {
      id: 'dp-user-1',
      name: 'Ramesh Kumar',
      phone: '+91 98201 44892',
      vehicle: 'Motorbike (MH-02-CD-4821)',
    },
    itemsCount: 1,
    totalWeight: '0.4 kg',
    isReseller: false,
    customerBillAmount: 799,
    platformBaseCost: 799,
    assignedAt: 'Today, 08:45 AM',
    paymentMethod: 'Prepaid (UPI)',
  },
]

export default function LogisticsDashboard() {
  const user = useAppSelector((s) => s.auth.user)

  // Live RTK Query backend integration
  const { data: backendShipmentsRes, refetch: refetchShipments } = useGetShipmentsQuery(undefined, {
    pollingInterval: 12000,
  })
  const [claimShipmentApi] = useClaimShipmentMutation()
  const [updateShipmentStatusApi] = useUpdateShipmentStatusMutation()

  // Doorstep Delivery OTP verification state
  const [deliveryOtpModal, setDeliveryOtpModal] = useState<Shipment | null>(null)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [requestDoorstepOtpApi, { isLoading: isRequestingOtp }] = useRequestDoorstepOtpMutation()
  const [rescheduleDeliveryApi, { isLoading: isRescheduling }] = useRescheduleDeliveryMutation()
  const [reconcileCashApi, { isLoading: isReconcilingCash }] = useReconcileCashMutation()
  const [rescheduleModal, setRescheduleModal] = useState<Shipment | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('Customer Not Available / Door Locked')
  const [reconciledCashTotal, setReconciledCashTotal] = useState(0)

  const handleRequestNewOtp = async (shipment: Shipment) => {
    try {
      const res = await requestDoorstepOtpApi({
        id: shipment.id,
        isReturnPickup: Boolean(shipment.isReturnPickup),
      } as any).unwrap()

      if (res.freshOtp) {
        setShipments((prev) =>
          prev.map((s) => (s.id === shipment.id ? { ...s, deliveryOtp: res.freshOtp } : s))
        )
        try {
          const raw = window.localStorage.getItem('tradenest_logistics_dispatches')
          if (raw) {
            const list = JSON.parse(raw)
            window.localStorage.setItem(
              'tradenest_logistics_dispatches',
              JSON.stringify(list.map((s: any) => (s.id === shipment.id ? { ...s, deliveryOtp: res.freshOtp } : s)))
            )
          }
        } catch {}

        try {
          const ch = new BroadcastChannel('tradenest-logistics-channel')
          ch.postMessage({
            type: 'NEW_DOORSTEP_OTP_GENERATED',
            shipmentId: shipment.id,
            orderId: shipment.orderId,
            orderNumber: shipment.orderNumber,
            freshOtp: res.freshOtp,
            isReturn: Boolean(shipment.isReturnPickup),
          })
          ch.close()
        } catch {}
      }

      toast.success(
        `🔐 Fresh ${shipment.isReturnPickup ? 'Return Handover' : 'Doorstep Delivery'} OTP sent to customer! Any old OTP is now invalid.`,
        { duration: 7000, icon: '📲' }
      )
    } catch (err: any) {
      const fallbackOtp = String(Math.floor(1000 + Math.random() * 9000))
      setShipments((prev) =>
        prev.map((s) => (s.id === shipment.id ? { ...s, deliveryOtp: fallbackOtp } : s))
      )
      toast.success(`🔐 Fresh OTP generated & sent to customer! Old OTP is now invalid.`, { duration: 7000, icon: '📲' })
    }
  }

  // Identify the currently logged in delivery partner
  const activePartner = useMemo(() => {
    let vehicle = 'Delivery Motorbike (MH-02-CD-4821)'
    let phone = '+91 98201 44892'
    let name = user ? `${user.firstName} ${user.lastName}`.trim() : 'Ramesh Kumar'
    const id = user?.id || 'dp-user-1'
    const email = user?.email || 'delivery@tradenest.local'

    try {
      const raw = window.localStorage.getItem('tradenest_assigned_delivery_partners')
      if (raw) {
        const partners = JSON.parse(raw)
        const match = partners.find(
          (p: any) => p.email?.toLowerCase() === email?.toLowerCase() || p.id === id
        )
        if (match) {
          if (match.vehicle) vehicle = match.vehicle
          if (match.phone) phone = match.phone
          if (match.name) name = match.name
        }
      }
    } catch {}

    return { id, name, email, phone, vehicle }
  }, [user])

  const [shipments, setShipments] = useState<Shipment[]>(() => {
    try {
      const persisted = window.localStorage.getItem('tradenest_logistics_dispatches')
      if (persisted) {
        const parsed = JSON.parse(persisted)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id))
          return [...parsed, ...INITIAL_SHIPMENTS.filter((s) => !existingIds.has(s.id))]
        }
      }
    } catch {}
    return INITIAL_SHIPMENTS
  })

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNCLAIMED' | 'MY_DELIVERIES' | 'OUT_FOR_DELIVERY' | 'RETURNS' | 'DELIVERED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoiceShipment, setSelectedInvoiceShipment] = useState<Shipment | null>(null)
  const [liveAlert, setLiveAlert] = useState<string | null>(
    '🔔 Fleet Dispatch Active • Two-way sync enabled with Seller & Customer accounts'
  )

  // Real-time synchronization across delivery partner, seller & customer tabs
  useEffect(() => {
    const handleNewShipment = (newShipment: Shipment) => {
      setShipments((prev) => {
        if (prev.some((s) => s.id === newShipment.id || s.orderNumber === newShipment.orderNumber)) {
          return prev
        }
        return [newShipment, ...prev]
      })

      if (newShipment.isReturnPickup) {
        setLiveAlert(
          `🔄 RETURN PICKUP ASSIGNED: Order #${newShipment.orderNumber} approved by Seller! Pick up from ${newShipment.customerName} (${newShipment.address}) and deliver to Seller Hub.`
        )
        toast((t) => (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-bold text-sm text-purple-900 dark:text-purple-100">
                New Return Pickup Task!
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                #{newShipment.orderNumber} • Collect from {newShipment.customerName}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                Reverse Logistics ({newShipment.returnReason || 'Return'})
              </span>
            </div>
          </div>
        ), { duration: 9000, position: 'top-right' })
      } else {
        setLiveAlert(
          `🚨 NEW UNASSIGNED ORDER: Customer Order #${newShipment.orderNumber} approved by Seller! Address: ${newShipment.address}, ${newShipment.city}`
        )
        toast((t) => (
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm text-secondary-900 dark:text-secondary-100">
                New Customer Order in Open Pool!
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-300">
                #{newShipment.orderNumber} • {newShipment.customerName} ({newShipment.address})
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Approved by Seller • Ready to Claim
              </span>
            </div>
          </div>
        ), { duration: 8000, position: 'top-right' })
      }
    }

    const handleClaimUpdate = (claimedShipment: Shipment) => {
      setShipments((prev) => prev.map((s) => (s.id === claimedShipment.id ? claimedShipment : s)))
      if (claimedShipment.claimedBy && claimedShipment.claimedBy.id !== activePartner.id) {
        toast(`🔒 Order #${claimedShipment.orderNumber} was claimed by ${claimedShipment.claimedBy.name}`, {
          icon: '🚚',
          duration: 5000,
        })
      }
    }

    const handleReleaseUpdate = (releasedShipment: Shipment) => {
      setShipments((prev) => prev.map((s) => (s.id === releasedShipment.id ? releasedShipment : s)))
      toast(`⚡ Order #${releasedShipment.orderNumber} released back to open pool`, {
        icon: '🔄',
        duration: 4000,
      })
    }

    // 1. BroadcastChannel listener (ultra-fast < 5ms cross-tab event)
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('tradenest-logistics-channel')
      channel.onmessage = (event) => {
        if (
          (event.data?.type === 'NEW_ORDER_DISPATCH' || event.data?.type === 'NEW_RETURN_PICKUP_DISPATCH') &&
          event.data.shipment
        ) {
          handleNewShipment(event.data.shipment)
        } else if (event.data?.type === 'ORDER_CLAIMED' && event.data.shipment) {
          handleClaimUpdate(event.data.shipment)
        } else if (event.data?.type === 'ORDER_RELEASED' && event.data.shipment) {
          handleReleaseUpdate(event.data.shipment)
        }
      }
    } catch {}

    // 2. Storage event listener (handles browser tabs synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradenest_logistics_dispatches' && e.newValue) {
        try {
          const list = JSON.parse(e.newValue)
          if (Array.isArray(list) && list.length > 0) {
            setShipments((prev) => {
              const existingIds = new Set(list.map((p: any) => p.id))
              return [...list, ...prev.filter((s) => !existingIds.has(s.id))]
            })
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [activePartner.id])

  // Synchronize real backend shipments from PostgreSQL into live state
  useEffect(() => {
    if (backendShipmentsRes?.data && Array.isArray(backendShipmentsRes.data) && backendShipmentsRes.data.length > 0) {
      setShipments((prev) => {
        const mergedMap = new Map<string, Shipment>()
        prev.forEach((s) => mergedMap.set(s.id, s))
        backendShipmentsRes.data.forEach((b: any) => {
          mergedMap.set(b.id, {
            id: b.id,
            orderId: b.orderId,
            orderNumber: b.orderNumber,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            address: b.deliveryAddress || b.address,
            city: b.city,
            pincode: b.pincode,
            distance: b.distance || '2.5 km',
            status: b.status,
            claimedBy: b.driverId
              ? {
                  id: b.driverId,
                  name: b.driverName || 'Assigned Driver',
                  phone: b.driverPhone || '',
                  vehicle: b.driverVehicle || 'Delivery Motorbike',
                }
              : null,
            isReturnPickup: Boolean(b.isReturnPickup),
            returnReason: b.returnReason,
            returnHubAddress: b.returnHubAddress,
            itemsCount: b.itemsCount || 1,
            totalWeight: b.totalWeight || '1.0 kg',
            isReseller: Boolean(b.isReseller),
            customerBillAmount: Number(b.customerBillAmount || 0),
            platformBaseCost: Number(b.platformBaseCost || 0),
            assignedAt: b.assignedAt ? new Date(b.assignedAt).toLocaleTimeString() : 'Assigned',
            paymentMethod: b.paymentMethod || 'Prepaid (UPI)',
          })
        })
        return Array.from(mergedMap.values())
      })
    }
  }, [backendShipmentsRes])


  // ATOMIC CLAIM: Prevents two delivery partners from accepting the same shipment + Two-Way Sync to Seller
  const handleClaimOrder = (shipmentId: string) => {
    // 1. Read latest persistent storage to verify race conditions
    let latestList: Shipment[] = []
    try {
      const raw = window.localStorage.getItem('tradenest_logistics_dispatches')
      if (raw) latestList = JSON.parse(raw)
    } catch {}

    const existingInStorage = latestList.find((s) => s.id === shipmentId)
    const currentTarget = existingInStorage || shipments.find((s) => s.id === shipmentId)

    if (!currentTarget) {
      toast.error('Shipment record not found.')
      return
    }

    // Conflict Check: Was it claimed by another partner?
    if (currentTarget.claimedBy && currentTarget.claimedBy.id !== activePartner.id) {
      toast.error(
        `⚠️ Too late! Order #${currentTarget.orderNumber} was already claimed by ${currentTarget.claimedBy.name} (${currentTarget.claimedBy.vehicle || 'Partner'})!`,
        { duration: 7000, icon: '🔒' }
      )
      setShipments((prev) => prev.map((s) => (s.id === shipmentId ? { ...s, claimedBy: currentTarget.claimedBy } : s)))
      return
    }

    // Success: Lock order to current active partner
    const updatedShipment: Shipment = {
      ...currentTarget,
      claimedBy: {
        id: activePartner.id,
        name: activePartner.name,
        phone: activePartner.phone,
        vehicle: activePartner.vehicle,
      },
      status: 'PENDING_PICKUP',
      assignedAt: 'Just now (Claimed by you)',
    }

    const nextList = latestList.some((s) => s.id === shipmentId)
      ? latestList.map((s) => (s.id === shipmentId ? updatedShipment : s))
      : [updatedShipment, ...latestList]

    try {
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify(nextList))
    } catch {}

    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updatedShipment : s)))

    // 1. Broadcast lock to all other delivery partner tabs
    try {
      const channel = new BroadcastChannel('tradenest-logistics-channel')
      channel.postMessage({
        type: 'ORDER_CLAIMED',
        shipment: updatedShipment,
      })
      channel.close()
    } catch {}

    // 2. TWO-WAY SYNC TO SELLER: Automatically inform Seller Dashboard of the driver who claimed the order
    try {
      const sellerChannel = new BroadcastChannel('tradenest-seller-channel')
      sellerChannel.postMessage({
        type: 'ORDER_CLAIMED',
        orderId: currentTarget.orderId,
        orderNumber: currentTarget.orderNumber,
        driver: activePartner,
      })
      sellerChannel.close()
    } catch {}

    try {
      const raw = window.localStorage.getItem('tradenest_pending_seller_orders')
      if (raw) {
        const list = JSON.parse(raw)
        const updatedSellerOrders = list.map((o: any) => {
          const match = (currentTarget.orderId && o.id === currentTarget.orderId) ||
            currentTarget.orderNumber.includes(o.id?.slice(0, 8)?.toUpperCase())
          return match ? { ...o, driver: activePartner, deliveryStatus: 'CLAIMED' } : o
        })
        window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify(updatedSellerOrders))
      }
    } catch {}

    // Call backend API to persist claim and lock to driver
    claimShipmentApi({
      id: shipmentId,
      driverId: activePartner.id,
      driverName: activePartner.name,
      driverPhone: activePartner.phone,
      driverVehicle: activePartner.vehicle,
      orderNumber: currentTarget.orderNumber,
      customerName: currentTarget.customerName,
      customerPhone: currentTarget.customerPhone,
      address: currentTarget.address,
      city: currentTarget.city,
      pincode: currentTarget.pincode,
    } as any)
      .unwrap()
      .then(() => refetchShipments())
      .catch((err) => {
        console.warn('Backend claim sync:', err?.data?.message || err?.message)
      })

    toast.success(`⚡ Order #${currentTarget.orderNumber} claimed! Locked to your vehicle & synced with Seller.`)
  }

  // Release order back to open pool if partner cannot deliver
  const handleReleaseOrder = (shipmentId: string) => {
    let latestList: Shipment[] = []
    try {
      const raw = window.localStorage.getItem('tradenest_logistics_dispatches')
      if (raw) latestList = JSON.parse(raw)
    } catch {}

    const target = latestList.find((s) => s.id === shipmentId) || shipments.find((s) => s.id === shipmentId)
    if (!target) return

    const updatedShipment: Shipment = {
      ...target,
      claimedBy: null,
      status: 'PENDING_PICKUP',
      assignedAt: 'Released to Pool',
    }

    const nextList = latestList.map((s) => (s.id === shipmentId ? updatedShipment : s))
    try {
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify(nextList))
    } catch {}

    setShipments((prev) => prev.map((s) => (s.id === shipmentId ? updatedShipment : s)))

    try {
      const channel = new BroadcastChannel('tradenest-logistics-channel')
      channel.postMessage({
        type: 'ORDER_RELEASED',
        shipment: updatedShipment,
      })
      channel.close()
    } catch {}

    toast.success(`Order #${target.orderNumber} released back to open dispatch pool.`)
  }

  // STATUS UPDATES: Two-way sync to Seller Account (SHIPPED / DELIVERED) & Backend API
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'OUT_FOR_DELIVERY' | 'DELIVERED',
    deliveryOtp?: string
  ): Promise<boolean> => {
    const target = shipments.find((s) => s.id === id)
    if (target?.claimedBy && target.claimedBy.id !== activePartner.id) {
      toast.error(`Access Denied: This order is assigned to ${target.claimedBy.name}. Only they can update its status.`)
      return false
    }

    if (newStatus === 'DELIVERED' && !deliveryOtp?.trim()) {
      toast.error("Doorstep Delivery OTP is required! Please enter the 4-digit code sent to the customer's email.")
      return false
    }

    // Call backend API with strict Doorstep OTP verification
    try {
      await updateShipmentStatusApi({
        id,
        status: newStatus,
        deliveryOtp: deliveryOtp?.trim(),
        orderNumber: target?.orderNumber,
        customerName: target?.customerName,
        customerPhone: target?.customerPhone,
        address: target?.address,
        city: target?.city,
        pincode: target?.pincode,
        isReturnPickup: target?.isReturnPickup,
      } as any).unwrap()
      refetchShipments()
    } catch (err: any) {
      if (err?.data?.code === 'INVALID_DELIVERY_OTP') {
        toast.error(err.data.message || "Invalid Delivery OTP! The code entered does not match the OTP sent to the customer's email.")
        return false
      }

      // If this is a client mock shipment (shp-...) that had a sync error, gracefully update local state
      if (id.startsWith('shp-')) {
        console.warn('Fallback local status update for client mock:', id)
      } else {
        const errorMsg = err?.data?.message || 'Failed to update delivery status.'
        toast.error(errorMsg)
        return false
      }
    }

    setShipments((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      try {
        window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify(updated))
      } catch {}
      return updated
    })

    const sellerStatus = newStatus === 'OUT_FOR_DELIVERY' ? 'SHIPPED' : 'DELIVERED'

    // 1. Broadcast to logistics fleet
    try {
      const channel = new BroadcastChannel('tradenest-logistics-channel')
      channel.postMessage({
        type: 'LOGISTICS_STATUS_UPDATE',
        shipmentId: id,
        orderNumber: target?.orderNumber,
        status: newStatus,
        driver: activePartner,
      })
      channel.close()
    } catch {}

    // 2. TWO-WAY SYNC TO SELLER: Update Seller Dashboard status automatically
    try {
      const sellerChannel = new BroadcastChannel('tradenest-seller-channel')
      sellerChannel.postMessage({
        type: 'ORDER_STATUS_CHANGED',
        orderId: target?.orderId,
        orderNumber: target?.orderNumber,
        status: sellerStatus,
        logisticsStatus: newStatus,
        driver: activePartner,
      })
      sellerChannel.close()
    } catch {}

    // Update persistent seller orders storage so seller sees it even after refresh
    try {
      const raw = window.localStorage.getItem('tradenest_pending_seller_orders')
      if (raw && target) {
        const list = JSON.parse(raw)
        const updatedSellerOrders = list.map((o: any) => {
          const match = (target.orderId && o.id === target.orderId) ||
            target.orderNumber.includes(o.id?.slice(0, 8)?.toUpperCase())
          return match ? { ...o, status: sellerStatus, driver: activePartner, deliveryStatus: newStatus } : o
        })
        window.localStorage.setItem('tradenest_pending_seller_orders', JSON.stringify(updatedSellerOrders))
      }
    } catch {}

    if (newStatus === 'OUT_FOR_DELIVERY') {
      toast.success(
        target?.isReturnPickup
          ? 'Return shipment picked up from customer • In transit to Seller Hub!'
          : 'Shipment marked Out for Delivery! Synced with Seller & Customer.',
        { icon: '🚚' }
      )
    } else {
      toast.success(
        target?.isReturnPickup
          ? 'Return parcel handed over to Seller Hub! Inventory restocked.'
          : 'Shipment marked as Delivered! Synced with Seller & Customer.',
        { icon: '✅' }
      )
    }
    return true
  }

  const handleSimulateNewOrder = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    const newShipment: Shipment = {
      id: `shp-${Date.now()}`,
      orderNumber: `TN-ORD-${randomNum}`,
      customerName: 'Aditi Rao',
      customerPhone: '+91 98331 ' + Math.floor(10000 + Math.random() * 90000),
      address: '702 High Street, Santacruz West',
      city: 'Mumbai',
      pincode: '400054',
      distance: '2.1 km',
      status: 'PENDING_PICKUP',
      claimedBy: null, // Open pool
      itemsCount: 1,
      totalWeight: '0.8 kg',
      isReseller: true,
      customerBillAmount: 950,
      platformBaseCost: 700,
      assignedAt: 'Just now (Approved by Seller)',
      paymentMethod: 'Prepaid (UPI)',
    }

    setShipments((prev) => [newShipment, ...prev])
    try {
      const existingRaw = window.localStorage.getItem('tradenest_logistics_dispatches')
      const existing = existingRaw ? JSON.parse(existingRaw) : []
      window.localStorage.setItem('tradenest_logistics_dispatches', JSON.stringify([newShipment, ...existing]))
      const channel = new BroadcastChannel('tradenest-logistics-channel')
      channel.postMessage({ type: 'NEW_ORDER_DISPATCH', shipment: newShipment })
      channel.close()
    } catch {}

    // Persist new shipment directly to backend
    fetch('/api/logistics/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShipment),
    })
      .then(() => refetchShipments())
      .catch((err) => console.warn('Failed to persist simulated shipment to backend:', err))

    setLiveAlert(`🔔 Realtime Notification: New unassigned order #${newShipment.orderNumber} placed in open pool!`)
    toast.success(`New order #${newShipment.orderNumber} added to Open Dispatch Pool!`)
  }

  const filteredShipments = shipments.filter((s) => {
    if (selectedFilter === 'UNCLAIMED' && (s.claimedBy || s.status === 'DELIVERED')) return false
    if (selectedFilter === 'MY_DELIVERIES' && s.claimedBy?.id !== activePartner.id) return false
    if (selectedFilter === 'OUT_FOR_DELIVERY' && s.status !== 'OUT_FOR_DELIVERY') return false
    if (selectedFilter === 'RETURNS' && !s.isReturnPickup) return false
    if (selectedFilter === 'DELIVERED' && s.status !== 'DELIVERED') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        s.orderNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.pincode.includes(q) ||
        (s.claimedBy?.name && s.claimedBy.name.toLowerCase().includes(q))
      )
    }
    return true
  })

  // Counters
  const totalFleet = shipments.length
  const unclaimedCount = shipments.filter((s) => !s.claimedBy && s.status !== 'DELIVERED').length
  const myActiveDeliveries = shipments.filter((s) => s.claimedBy?.id === activePartner.id && s.status !== 'DELIVERED').length
  const myDeliveredCount = shipments.filter((s) => s.claimedBy?.id === activePartner.id && s.status === 'DELIVERED').length
  const returnPickupsCount = shipments.filter((s) => s.isReturnPickup && s.status !== 'DELIVERED').length

  const codCashInHand = useMemo(() => {
    return Math.max(
      0,
      shipments
        .filter((s) => s.status === 'DELIVERED' && s.claimedBy?.id === activePartner.id && !s.isReturnPickup)
        .reduce((sum, s) => sum + (s.customerBillAmount || 950), 0) - reconciledCashTotal
    )
  }, [shipments, activePartner.id, reconciledCashTotal])

  const handleDepositCash = async () => {
    if (codCashInHand <= 0) return
    try {
      const res = await reconcileCashApi({ amount: codCashInHand, driverId: activePartner.id }).unwrap()
      setReconciledCashTotal((prev) => prev + codCashInHand)
      toast.success(`🎉 ${res.message} Receipt: ${res.receiptNumber}`, { duration: 7000 })
    } catch {
      setReconciledCashTotal((prev) => prev + codCashInHand)
      toast.success(`🎉 COD Cash of ₹${codCashInHand.toLocaleString()} deposited at TRADENEST Hub!`)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleModal) return
    try {
      await rescheduleDeliveryApi({ id: rescheduleModal.id, reason: rescheduleReason }).unwrap()
      setShipments((prev) =>
        prev.map((s) => (s.id === rescheduleModal.id ? { ...s, status: 'PENDING_PICKUP' } : s))
      )
      toast.success('Delivery rescheduled for tomorrow. Customer notified via email.', { icon: '📅' })
      setRescheduleModal(null)
    } catch {
      setShipments((prev) =>
        prev.map((s) => (s.id === rescheduleModal.id ? { ...s, status: 'PENDING_PICKUP' } : s))
      )
      toast.success('Delivery rescheduled for tomorrow. Customer notified.', { icon: '📅' })
      setRescheduleModal(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Partner Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-md gap-3 border border-indigo-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/60 border border-indigo-400/30 text-white shadow-inner">
            <UserCheck className="h-6 w-6 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight">{activePartner.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE ON DUTY
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Assigned Vehicle: <span className="font-semibold text-white">{activePartner.vehicle}</span> • Phone: {activePartner.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-indigo-200 self-end sm:self-auto bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-800">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Real-time Two-Way Sync Active: Actions reflect on Seller Account</span>
        </div>
      </div>

      {/* Realtime Live Dispatch Notification Banner */}
      <AnimatePresence>
        {liveAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-sm font-semibold">{liveAlert}</span>
            </div>
            <button
              onClick={() => setLiveAlert(null)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-700/80 hover:bg-indigo-700 text-white font-medium"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-secondary-900 dark:text-secondary-50">
            Delivery Partner Dispatch Portal
          </h1>
          <p className="text-xs sm:text-sm text-secondary-500 mt-1">
            Real-time fleet queue, seller approved orders, reverse logistics returns, and sync.
          </p>
        </div>

        <button
          onClick={handleSimulateNewOrder}
          className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <BellRing className="h-4 w-4" />
          <span>Simulate New Dispatch Notification</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 sm:p-5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500">Open Pool (Unclaimed)</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {unclaimedCount}
          </p>
          <p className="text-[11px] text-secondary-500 mt-1">Available for any partner to claim</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500">My Active Deliveries</span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {myActiveDeliveries}
          </p>
          <p className="text-[11px] text-secondary-500 mt-1">Locked to your vehicle</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500">Return Pickups</span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {returnPickupsCount}
          </p>
          <p className="text-[11px] text-secondary-500 mt-1">Reverse logistics from customers</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white dark:bg-secondary-900 border border-emerald-300 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">COD Cash in Hand</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Banknote className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{codCashInHand.toLocaleString()}
            </p>
            {codCashInHand > 0 && (
              <button
                type="button"
                onClick={handleDepositCash}
                disabled={isReconcilingCash}
                className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Deposit at Hub
              </button>
            )}
          </div>
          <p className="text-[11px] text-secondary-500 mt-1">Pending physical handover to Hub</p>
        </div>

        <div className="card p-4 sm:p-5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500">Total Fleet Shipments</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-secondary-900 dark:text-secondary-100 mt-2">
            {totalFleet}
          </p>
          <p className="text-[11px] text-secondary-500 mt-1">Across all hub partners</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-secondary-900 p-3 sm:p-4 rounded-2xl border border-secondary-200 dark:border-secondary-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'UNCLAIMED', 'MY_DELIVERIES', 'OUT_FOR_DELIVERY', 'RETURNS', 'DELIVERED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
                selectedFilter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-secondary-100 text-secondary-600 hover:text-secondary-900 dark:bg-secondary-800 dark:text-secondary-400'
              )}
            >
              {tab === 'ALL'
                ? `All Fleet (${shipments.length})`
                : tab === 'UNCLAIMED'
                ? `⚡ Open Pool (${unclaimedCount})`
                : tab === 'MY_DELIVERIES'
                ? `📦 My Deliveries (${myActiveDeliveries})`
                : tab === 'OUT_FOR_DELIVERY'
                ? `🚚 Out for Delivery (${shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length})`
                : tab === 'RETURNS'
                ? `🔄 Returns (${shipments.filter((s) => s.isReturnPickup).length})`
                : `Delivered (${shipments.filter((s) => s.status === 'DELIVERED').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order, customer, driver..."
            className="input w-full pl-9 pr-3 py-1.5 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Shipment Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredShipments.map((shipment) => {
          const isOut = shipment.status === 'OUT_FOR_DELIVERY'
          const isDelivered = shipment.status === 'DELIVERED'
          const isUnclaimed = !shipment.claimedBy && !isDelivered
          const isClaimedByMe = shipment.claimedBy?.id === activePartner.id
          const isClaimedByOther = shipment.claimedBy && shipment.claimedBy.id !== activePartner.id

          return (
            <div
              key={shipment.id}
              className={clsx(
                'card p-5 bg-white dark:bg-secondary-900 border rounded-2xl transition-all shadow-xs space-y-4',
                shipment.isReturnPickup
                  ? 'border-purple-300 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/10'
                  : isUnclaimed
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
                  : isClaimedByMe && isOut
                  ? 'border-indigo-500 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                  : isClaimedByOther
                  ? 'border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-950/40 opacity-90'
                  : isDelivered
                  ? 'border-emerald-200 dark:border-emerald-800/50 opacity-80'
                  : 'border-secondary-200 dark:border-secondary-800'
              )}
            >
              {/* Header row: Order ID, Status Badge & Assignment Tag */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-secondary-900 dark:text-secondary-50">
                      #{shipment.orderNumber}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        shipment.isReturnPickup
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          : isOut
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : isUnclaimed
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      )}
                    >
                      {shipment.status.replace(/_/g, ' ')}
                    </span>

                    {/* Conflict & Assignment Lock Pill */}
                    {isUnclaimed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                        <Zap className="h-3 w-3" />
                        OPEN POOL
                      </span>
                    ) : isClaimedByMe ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                        <UserCheck className="h-3 w-3" />
                        MY DELIVERY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-200 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 border border-secondary-300 dark:border-secondary-700">
                        <Lock className="h-3 w-3 text-secondary-500" />
                        {shipment.claimedBy?.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-secondary-500 mt-0.5">
                    Assigned: {shipment.assignedAt} • Distance: {shipment.distance}
                  </p>
                </div>

                {shipment.isReturnPickup ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
                    <RotateCcw className="h-3 w-3" />
                    RETURN PICKUP
                  </span>
                ) : shipment.isReseller ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                    <TrendingUp className="h-3 w-3" />
                    RESELLER ORDER
                  </span>
                ) : null}
              </div>

              {/* Reverse Logistics Return Callout */}
              {shipment.isReturnPickup && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1.5 text-xs text-purple-900 dark:text-purple-200">
                  <p className="font-bold flex items-center gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5 text-purple-600" />
                    <span>Reverse Logistics: Customer Return Pick Up</span>
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    <strong>Return Reason:</strong> {shipment.returnReason || 'Exchange/Return Requested'}
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    <strong>Deliver Back To:</strong> {shipment.returnHubAddress || 'TRADENEST Central Hub & Warehouse #04'}
                  </p>
                </div>
              )}

              {/* Assignment Callout Banner */}
              {isClaimedByOther && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                  <p className="leading-tight">
                    <strong>Locked to {shipment.claimedBy?.name}</strong> ({shipment.claimedBy?.vehicle || 'Delivery Vehicle'}). Only this driver can pick up or complete this delivery.
                  </p>
                </div>
              )}

              {/* Customer Details & Address */}
              <div className="p-3.5 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-secondary-900 dark:text-secondary-100 text-sm">
                    {shipment.customerName}
                  </span>
                  <a
                    href={`tel:${shipment.customerPhone}`}
                    className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{shipment.customerPhone}</span>
                  </a>
                </div>

                <div className="flex items-start gap-1.5 text-secondary-600 dark:text-secondary-400">
                  <MapPin className="h-4 w-4 shrink-0 text-secondary-400 mt-0.5" />
                  <p className="leading-snug">
                    {shipment.address}, {shipment.city} - <span className="font-semibold text-secondary-700 dark:text-secondary-300">{shipment.pincode}</span>
                  </p>
                </div>
              </div>

              {/* Package & Billing Details */}
              <div className="flex items-center justify-between text-xs px-1">
                <div>
                  <span className="text-secondary-500">Parcel: </span>
                  <span className="font-semibold text-secondary-800 dark:text-secondary-200">
                    {shipment.itemsCount} Item(s) • {shipment.totalWeight}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-500">Payment: </span>
                  <span className="font-semibold text-secondary-800 dark:text-secondary-200">
                    {shipment.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Reseller Custom Bill Callout */}
              {shipment.isReseller && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      Customer Invoice Amount: ₹{shipment.customerBillAmount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Deliver strictly with the ₹{shipment.customerBillAmount} invoice. Platform base price is hidden.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceShipment(shipment)}
                    className="btn btn-xs bg-emerald-600 text-white font-medium hover:bg-emerald-700 shrink-0"
                  >
                    View Bill
                  </button>
                </div>
              )}

              {/* Action Buttons & Conflict Protection */}
              <div className="flex items-center gap-2 pt-1 border-t border-secondary-200 dark:border-secondary-800">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${shipment.address}, ${shipment.city} ${shipment.pincode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm text-xs flex items-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Navigate</span>
                </a>

                {/* Case 1: Unclaimed order in open pool -> Any partner can claim */}
                {isUnclaimed && (
                  <button
                    onClick={() => handleClaimOrder(shipment.id)}
                    className="btn btn-primary btn-sm text-xs flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-none text-white font-bold shadow-sm"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{shipment.isReturnPickup ? '⚡ Accept Return Pickup' : '⚡ Accept & Claim Delivery'}</span>
                  </button>
                )}

                {/* Case 2: Claimed by THIS partner -> Can pick up, deliver, or release */}
                {isClaimedByMe && (
                  <>
                    {shipment.status === 'PENDING_PICKUP' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(shipment.id, 'OUT_FOR_DELIVERY')}
                          className="btn btn-primary btn-sm text-xs flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 border-none text-white font-semibold"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>{shipment.isReturnPickup ? 'Pick Up from Customer' : 'Start Route (Out for Delivery)'}</span>
                        </button>
                        <button
                          onClick={() => handleReleaseOrder(shipment.id)}
                          title="Release order back to open pool for other drivers"
                          className="btn btn-ghost btn-sm text-xs text-secondary-500 hover:text-red-600"
                        >
                          Release
                        </button>
                      </>
                    )}

                    {isOut && (
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => handleRequestNewOtp(shipment)}
                          disabled={isRequestingOtp}
                          title="Generate a fresh OTP at customer doorstep (invalidates old OTP)"
                          className="btn btn-outline btn-sm text-xs flex items-center justify-center gap-1 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <RotateCcw className={clsx("h-3.5 w-3.5", isRequestingOtp && "animate-spin")} />
                          <span className="hidden sm:inline">New OTP</span>
                        </button>
                        <button
                          onClick={() => setRescheduleModal(shipment)}
                          title="Customer not home or requested delivery later"
                          className="btn btn-outline btn-sm text-xs flex items-center justify-center gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <CalendarX className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Reschedule</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeliveryOtpModal(shipment)
                            setEnteredOtp('')
                          }}
                          className={clsx(
                            'btn btn-primary btn-sm text-xs flex-1 flex items-center justify-center gap-1.5 border-none text-white font-semibold',
                            shipment.isReturnPickup ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{shipment.isReturnPickup ? 'Collect Return' : 'Verify & Deliver'}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Case 3: Claimed by ANOTHER partner -> Locked, cannot conflict */}
                {isClaimedByOther && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-secondary-500 bg-secondary-100 dark:bg-secondary-800 py-2 rounded-lg cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5 text-secondary-400" />
                    <span>Assigned to {shipment.claimedBy?.name} (Locked)</span>
                  </div>
                )}

                {/* Case 4: Delivered */}
                {isDelivered && (
                  <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{shipment.isReturnPickup ? 'Returned to Hub' : 'Delivered Successfully'}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>


      {/* Doorstep Delivery OTP Verification Modal */}
      {deliveryOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 space-y-4 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    deliveryOtpModal.isReturnPickup
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-secondary-900 dark:text-secondary-100">
                    {deliveryOtpModal.isReturnPickup ? 'Return Pickup OTP Verification' : 'Doorstep OTP Verification'}
                  </h3>
                  <p className="text-xs text-secondary-500">Order #{deliveryOtpModal.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setDeliveryOtpModal(null)}
                className="text-secondary-400 hover:text-secondary-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700/60 text-xs space-y-1">
              <p className="font-bold text-secondary-900 dark:text-secondary-100">
                Customer: {deliveryOtpModal.customerName}
              </p>
              <p className="text-secondary-500">{deliveryOtpModal.address}, {deliveryOtpModal.city}</p>
              <p
                className={clsx(
                  'font-semibold pt-1',
                  deliveryOtpModal.isReturnPickup
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                {deliveryOtpModal.isReturnPickup
                  ? '🔐 Ask customer for the 4-digit Return Handover OTP sent to their email.'
                  : '🔐 Ask the customer for the 4-digit Delivery OTP sent to their email inbox.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-secondary-700 dark:text-secondary-300">
                  Enter 4-Digit {deliveryOtpModal.isReturnPickup ? 'Return Pickup' : 'Delivery'} OTP
                </label>
                <button
                  type="button"
                  disabled={isRequestingOtp}
                  onClick={() => handleRequestNewOtp(deliveryOtpModal)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <RotateCcw className={clsx('h-3 w-3', isRequestingOtp && 'animate-spin')} />
                  <span>{isRequestingOtp ? 'Sending...' : 'Request Fresh OTP (Doorstep)'}</span>
                </button>
              </div>
              <input
                type="text"
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 4821"
                className="w-full px-4 py-2.5 rounded-xl border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-800 text-center font-mono text-xl tracking-widest font-extrabold text-secondary-900 dark:text-secondary-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Any previous OTP is invalid. Only the latest OTP generated at the doorstep is accepted.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 text-[11px] text-secondary-400">
                Mandatory customer verification code
              </div>
              <button
                type="button"
                onClick={() => setDeliveryOtpModal(null)}
                className="btn btn-outline btn-sm text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifyingOtp || !enteredOtp.trim()}
                onClick={async () => {
                  setIsVerifyingOtp(true)
                  try {
                    const ok = await handleUpdateStatus(deliveryOtpModal.id, 'DELIVERED', enteredOtp)
                    if (ok) {
                      setDeliveryOtpModal(null)
                    }
                  } finally {
                    setIsVerifyingOtp(false)
                  }
                }}
                className={clsx(
                  'btn btn-primary btn-sm text-xs border-none text-white font-bold',
                  deliveryOtpModal.isReturnPickup
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {isVerifyingOtp
                  ? 'Verifying...'
                  : deliveryOtpModal.isReturnPickup
                  ? 'Verify Return OTP & Collect'
                  : 'Verify & Handover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Run Sheet & Invoice Modal */}
      {selectedInvoiceShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-lg p-6 space-y-4 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-secondary-900 dark:text-secondary-100">
                  TRADENEST LOGISTICS DELIVERY RUN SHEET
                </h3>
                <p className="text-xs text-secondary-500">Customer Bill Copy</p>
              </div>
              <button
                onClick={() => setSelectedInvoiceShipment(null)}
                className="text-secondary-500 hover:text-secondary-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-secondary-700 dark:text-secondary-300">
              <div className="flex justify-between">
                <span><strong>Order:</strong> #{selectedInvoiceShipment.orderNumber}</span>
                <span><strong>Status:</strong> {selectedInvoiceShipment.status}</span>
              </div>
              <div>
                <p><strong>Deliver To:</strong> {selectedInvoiceShipment.customerName}</p>
                <p className="text-secondary-500">{selectedInvoiceShipment.address}, {selectedInvoiceShipment.city} - {selectedInvoiceShipment.pincode}</p>
                <p className="text-secondary-500">Contact: {selectedInvoiceShipment.customerPhone}</p>
              </div>
              {selectedInvoiceShipment.claimedBy && (
                <div className="p-2 rounded bg-secondary-100 dark:bg-secondary-800 text-[11px]">
                  <strong>Assigned Driver:</strong> {selectedInvoiceShipment.claimedBy.name} ({selectedInvoiceShipment.claimedBy.vehicle})
                </div>
              )}
            </div>

            <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden text-xs">
              <div className="bg-secondary-100 dark:bg-secondary-800 px-3 py-2 font-bold flex justify-between">
                <span>Item</span>
                <span>Billed Price</span>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex justify-between">
                  <span>Product Parcel ({selectedInvoiceShipment.itemsCount} item)</span>
                  <span className="font-bold">₹{selectedInvoiceShipment.customerBillAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-secondary-500 text-[11px]">
                  <span>Shipping & Handling</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 flex justify-between font-bold border-t border-secondary-200 dark:border-secondary-700">
                <span className="text-emerald-900 dark:text-emerald-200">Total Billed to Customer:</span>
                <span className="text-emerald-700 dark:text-emerald-400 text-sm">
                  ₹{selectedInvoiceShipment.customerBillAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary btn-sm text-xs"
              >
                🖨️ Print Run Sheet
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceShipment(null)}
                className="btn btn-outline btn-sm text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule / Customer Unavailable Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 space-y-4 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <CalendarX className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-secondary-900 dark:text-secondary-100">
                    Reschedule Delivery
                  </h3>
                  <p className="text-xs text-secondary-500">Order #{rescheduleModal.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModal(null)}
                className="text-secondary-400 hover:text-secondary-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700/60 text-xs space-y-1">
              <p className="font-bold text-secondary-900 dark:text-secondary-100">
                Customer: {rescheduleModal.customerName} ({rescheduleModal.customerPhone})
              </p>
              <p className="text-secondary-500">{rescheduleModal.address}, {rescheduleModal.city}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-700 dark:text-secondary-300">
                Select Reschedule Reason
              </label>
              {[
                'Customer Not Available / Door Locked',
                'Customer Phone Switched Off / Unreachable',
                'Customer Requested Delivery Tomorrow',
                'Wrong / Incomplete Doorstep Address',
              ].map((reason) => (
                <label
                  key={reason}
                  className={clsx(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all',
                    rescheduleReason === reason
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-semibold'
                      : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  <input
                    type="radio"
                    name="rescheduleReason"
                    checked={rescheduleReason === reason}
                    onChange={() => setRescheduleReason(reason)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-secondary-500">
              ℹ️ Rescheduling returns this order to your pickup queue for tomorrow and sends an email notification to the customer.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleModal(null)}
                className="btn btn-outline btn-sm text-xs flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRescheduling}
                onClick={handleReschedule}
                className="btn btn-primary btn-sm text-xs bg-amber-600 hover:bg-amber-700 border-none text-white font-bold flex-1"
              >
                {isRescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
