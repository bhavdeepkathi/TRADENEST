import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

interface RoleBasedRouteProps {
  allowedRoles: ('CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN')[]
  fallbackPath?: string
}

export function RoleBasedRoute({ allowedRoles, fallbackPath = '/' }: RoleBasedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const userRole = user?.role
  const hasAccess = userRole && allowedRoles.includes(userRole)

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />
  }

  return <Outlet />
}

export function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function GuestRoute() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}