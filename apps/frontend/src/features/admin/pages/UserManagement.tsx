import { useState } from 'react'
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react'
import { useGetAllUsersQuery, useUpdateUserStatusMutation } from '../../../app/api'
import { format } from '../../../utils/date'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useGetAllUsersQuery({
    page,
    limit: 20,
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
  })
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserStatusMutation()

  const users = data?.data || []
  const meta = data?.meta

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(term) ||
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    )
  })

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser({ userId, isActive: !currentStatus }).unwrap()
      toast.success(currentStatus ? 'User suspended' : 'User activated')
    } catch {
      toast.error('Failed to update user status')
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateUser({ userId, role: newRole }).unwrap()
      toast.success(`User role updated to ${newRole}`)
    } catch {
      toast.error('Failed to change user role')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          User Directory & Roles
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage system users, grant administrative permissions, and toggle access controls.
        </p>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(['ALL', 'CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'] as const).map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                          {u.firstName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.id.slice(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        disabled={isUpdating}
                        className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="SELLER">SELLER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                        {u.isVerified && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 ${
                          u.isActive
                            ? 'border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="h-3 w-3" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} users)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
