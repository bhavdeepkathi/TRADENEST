import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

export function RoleFallbackRedirect() {
  const { user } = useAppSelector((state: any) => state.auth)
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  const isSeller = user?.role === 'SELLER'
  return <Navigate to={isSeller ? '/seller/dashboard' : '/'} replace />
}