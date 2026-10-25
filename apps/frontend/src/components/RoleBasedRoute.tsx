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
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  if (isAuthenticated) {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user?.role === 'SELLER') {
      return <Navigate to="/seller/dashboard" replace />
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user, loading, isAuthenticated } = useAppSelector((state) => state.auth)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}