import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import api from '../services/api'

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export default function Settings() {
  const [threshold, setThreshold] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const { data } = await api.get('/api/settings')
      setThreshold(String(data.settings.default_low_stock_threshold))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load settings. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  function handleThresholdChange(event) {
    setThreshold(event.target.value)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const value = Number(threshold)

    if (
      threshold.trim() === '' ||
      !/^\d+$/.test(threshold) ||
      !Number.isSafeInteger(value) ||
      value < 0
    ) {
      setError('Enter a non-negative whole number, such as 0 or 10.')
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await api.put('/api/settings', { default_low_stock_threshold: value })
      await loadSettings()
      setSuccess('Settings saved successfully.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save settings. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout
      subtitle="Configure defaults for how StockFlow monitors your inventory."
      title="Settings"
    >
      <div className="mx-auto max-w-4xl">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <p className="text-sm font-medium text-blue-600">Organization preferences</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Inventory Settings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Set the default quantity at which products are considered low stock. Product-specific thresholds take priority over this setting.
            </p>
          </div>

          <form className="px-6 py-6 sm:px-8 sm:py-8" onSubmit={handleSubmit}>
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <div className="max-w-lg">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="default-low-stock-threshold">
                  Default Low Stock Threshold
                  <input
                    className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    disabled={isSaving}
                    id="default-low-stock-threshold"
                    inputMode="numeric"
                    min="0"
                    onChange={handleThresholdChange}
                    pattern="[0-9]*"
                    step="1"
                    type="number"
                    value={threshold}
                  />
                </label>
                <p className="mt-2 text-sm text-slate-500">
                  Products without their own threshold will use this value.
                </p>
              </div>
            )}

            {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

            <div className="mt-8 border-t border-slate-100 pt-5">
              <button
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading || isSaving}
                type="submit"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  )
}
