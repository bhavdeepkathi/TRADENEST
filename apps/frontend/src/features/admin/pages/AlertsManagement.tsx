import { useState } from 'react'
import {
  AlertTriangle,
  ShieldAlert,
  Server,
  CheckCircle,
  Clock,
  Check,
  Search,
  Filter,
} from 'lucide-react'
import { useGetAdminAlertsQuery, useAcknowledgeAlertMutation, useCreateTestAlertMutation } from '../../../app/api'
import { formatDistanceToNow } from '../../../utils/date'
import toast from 'react-hot-toast'

export default function AlertsManagement() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'INFRA' | 'FRAUD'>('ALL')
  const { data, isLoading } = useGetAdminAlertsQuery(undefined, {
    pollingInterval: 15000,
  })
  const [acknowledgeAlert, { isLoading: isAcknowledging }] = useAcknowledgeAlertMutation()
  const [createTestAlert, { isLoading: isCreatingTest }] = useCreateTestAlertMutation()

  const infraAlerts = data?.infraAlerts || []
  const fraudAlerts = data?.fraudAlerts || []

  const unackInfra = infraAlerts.filter((a) => !a.acknowledged)
  const unackFraud = fraudAlerts.filter((a) => !a.resolved)

  const handleAcknowledge = async (id: string, type: 'infra' | 'fraud') => {
    try {
      await acknowledgeAlert({ id, type }).unwrap()
      toast.success('Alert acknowledged')
    } catch {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleTriggerTest = async (type: 'infra' | 'fraud') => {
    try {
      await createTestAlert({
        type,
        severity: type === 'infra' ? 'HIGH' : 'CRITICAL',
      }).unwrap()
      toast.success(`Test ${type === 'infra' ? 'Infrastructure' : 'Fraud'} alert generated!`)
    } catch {
      toast.error('Failed to generate test alert')
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300'
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
            System & Security Incident Alerts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor infrastructure exceptions, cluster anomalies, and anti-fraud security detections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTriggerTest('infra')}
            disabled={isCreatingTest}
            className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Generate a simulated infrastructure alert to verify system alerts"
          >
            <Server className="h-3.5 w-3.5 text-amber-500" />
            + Test Infra Alert
          </button>
          <button
            onClick={() => handleTriggerTest('fraud')}
            disabled={isCreatingTest}
            className="btn btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3"
            title="Generate a simulated fraud alert to verify system alerts"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            + Test Fraud Alert
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {unackFraud.length}
            </div>
            <p className="text-xs text-slate-500">Unresolved Fraud Alerts</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Server className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {unackInfra.length}
            </div>
            <p className="text-xs text-slate-500">Active Infra Incidents</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {infraAlerts.filter((a) => a.acknowledged).length +
                fraudAlerts.filter((a) => a.resolved).length}
            </div>
            <p className="text-xs text-slate-500">Resolved Incidents</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['ALL', 'INFRA', 'FRAUD'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'ALL'
              ? 'All Alerts'
              : tab === 'INFRA'
              ? `Infrastructure (${infraAlerts.length})`
              : `Fraud & Risk (${fraudAlerts.length})`}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading system alerts...</div>
        ) : (
          <>
            {/* Infra Alerts Section */}
            {(activeTab === 'ALL' || activeTab === 'INFRA') &&
              infraAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    alert.acknowledged
                      ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                      : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mt-0.5">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          [{alert.source}]
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed font-mono">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alert.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="h-4 w-4" />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id, 'infra')}
                        disabled={isAcknowledging}
                        className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {/* Fraud Alerts Section */}
            {(activeTab === 'ALL' || activeTab === 'FRAUD') &&
              fraudAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    alert.resolved
                      ? 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                      : 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-800/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mt-0.5">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Type: {alert.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                        User ID: <span className="font-mono text-slate-900 dark:text-white">{alert.userId || 'N/A'}</span>
                        {alert.orderId && <> • Order ID: <span className="font-mono">{alert.orderId}</span></>}
                      </p>
                      {alert.details && (
                        <pre className="mt-1.5 p-2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 overflow-x-auto max-w-xl font-mono">
                          {JSON.stringify(alert.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alert.resolved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="h-4 w-4" />
                        Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id, 'fraud')}
                        disabled={isAcknowledging}
                        className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                      >
                        Resolve Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {infraAlerts.length === 0 && fraudAlerts.length === 0 && (
              <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  All Systems Clear
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No infrastructure exceptions or security incidents recorded.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
