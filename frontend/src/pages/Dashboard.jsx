import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0))
}

function getApiError(error) {
  return error.response?.data?.message || 'We could not load your inventory. Please try again.'
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [summaryResponse, productsResponse] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/products'),
      ])
      setSummary(summaryResponse.data.summary)
      setProducts(productsResponse.data.products || [])
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const lowStockProducts = summary?.low_stock_products || []
  const recentProducts = products.slice(0, 5)

  return (
    <DashboardLayout
      title={`Good to see you${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
      subtitle="Here is what is happening with your inventory today."
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Inventory summary</h2>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={loadDashboard}
            type="button"
          >
            {isLoading ? 'Refreshing...' : 'Refresh data'}
          </button>
        </div>

        {error && (
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
            <span>{error}</span>
            <button className="font-semibold underline" onClick={loadDashboard} type="button">Try again</button>
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard detail="All time" label="Total products" value={summary?.total_products ?? 0} />
              <StatCard detail="On hand" label="Total quantity" value={summary?.total_quantity ?? 0} accent="navy" />
              <StatCard
                accent="amber"
                detail={lowStockProducts.length ? 'Needs attention' : 'Looking good'}
                label="Low stock products"
                value={summary?.low_stock_count ?? 0}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader title="Recent inventory" action={products.length > 0 ? <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" to="/products">View all</Link> : null} />
                {recentProducts.length === 0 ? (
                  <EmptyState title="Your inventory is empty" message="Add your first product to start tracking stock." action={<Link className="font-semibold text-blue-600" to="/products/new">Add a product</Link>} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                        <tr><th className="px-6 py-3 font-semibold">Product</th><th className="px-6 py-3 font-semibold">SKU</th><th className="px-6 py-3 font-semibold">Quantity</th><th className="px-6 py-3 text-right font-semibold">Price</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentProducts.map((product) => (
                          <tr className="text-slate-600" key={product.id}>
                            <td className="px-6 py-4 font-semibold text-slate-900">{product.name}</td>
                            <td className="px-6 py-4">{product.sku}</td>
                            <td className="px-6 py-4">{product.quantity_on_hand}</td>
                            <td className="px-6 py-4 text-right font-medium text-slate-900">{formatPrice(product.selling_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader title="Low stock alerts" action={null} />
                {lowStockProducts.length === 0 ? (
                  <EmptyState title="All stock levels are healthy" message="There are no products requiring attention right now." />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lowStockProducts.map((product) => (
                      <div className="flex items-center justify-between gap-4 px-6 py-4" key={product.id}>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{product.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold text-amber-600">{product.quantity_on_hand} available</p>
                          <p className="mt-1 text-xs text-slate-500">Threshold: {product.effective_low_stock_threshold}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function SectionHeader({ title, action }) {
  return <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">{title}</h2>{action}</div>
}

function EmptyState({ title, message, action }) {
  return <div className="px-6 py-12 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">—</div><h3 className="mt-4 font-semibold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{message}</p>{action && <div className="mt-4 text-sm">{action}</div>}</div>
}

function LoadingState() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-32 animate-pulse rounded-xl bg-slate-200" key={item} />)}</div><div className="h-80 animate-pulse rounded-xl bg-slate-200" /></div>
}
