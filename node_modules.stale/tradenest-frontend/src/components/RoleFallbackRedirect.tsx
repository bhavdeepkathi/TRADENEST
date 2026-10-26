import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export function RoleFallbackRedirect() {
  const { user } = useAppSelector((state: any) => state.auth)
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user?.role === 'SELLER') {
    return <Navigate to="/seller/dashboard" replace />
  }
  if (user?.role === 'DELIVERY_PARTNER') {
    return <Navigate to="/logistics/dashboard" replace />
  }
  return <Navigate to="/" replace />
}