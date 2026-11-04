import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import api from '../services/api'

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  quantity_on_hand: '0',
  cost_price: '',
  selling_price: '',
  low_stock_threshold: '',
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(Number(value || 0))
}

function getErrorMessage(error, fallback) {
  const fieldErrors = error.response?.data?.errors
  const firstFieldError = fieldErrors && Object.values(fieldErrors)[0]
  return firstFieldError || error.response?.data?.message || fallback
}

function toFormValues(product) {
  return {
    name: product.name || '',
    sku: product.sku || '',
    description: product.description || '',
    quantity_on_hand: String(product.quantity_on_hand ?? 0),
    cost_price: String(product.cost_price ?? ''),
    selling_price: String(product.selling_price ?? ''),
    low_stock_threshold: String(product.low_stock_threshold ?? ''),
  }
}

function toPayload(form) {
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    quantity_on_hand: Number(form.quantity_on_hand),
  }

  if (form.description.trim()) payload.description = form.description.trim()
  if (form.cost_price !== '') payload.cost_price = Number(form.cost_price)
  if (form.selling_price !== '') payload.selling_price = Number(form.selling_price)
  if (form.low_stock_threshold !== '') payload.low_stock_threshold = Number(form.low_stock_threshold)

  return payload
}

export default function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(location.pathname === '/products/new')

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      const { data } = await api.get('/api/products')
      setProducts(data.products || [])
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to load products. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products

    return products.filter((product) =>
      product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query),
    )
  }, [products, search])

  function openCreateForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError('')
    setNotice('')
    setIsFormOpen(true)
  }

  function openEditForm(product) {
    setEditingProduct(product)
    setForm(toFormValues(product))
    setFormError('')
    setNotice('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    if (location.pathname === '/products/new') navigate('/products', { replace: true })
  }

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim() || !form.sku.trim()) {
      setFormError('Name and SKU are required.')
      return
    }

    const quantity = Number(form.quantity_on_hand)
    if (!Number.isInteger(quantity) || quantity < 0) {
      setFormError('Quantity on hand must be a non-negative whole number.')
      return
    }

    const numericFields = ['cost_price', 'selling_price', 'low_stock_threshold']
    if (numericFields.some((field) => form[field] !== '' && !Number.isFinite(Number(form[field])))) {
      setFormError('Prices and low-stock threshold must be valid numbers.')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, toPayload(form))
        setNotice('Product updated successfully.')
      } else {
        await api.post('/api/products', toPayload(form))
        setNotice('Product added successfully.')
      }

      await loadProducts()
      closeForm()
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to save product. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return

    setDeletingId(product.id)
    setNotice('')
    setPageError('')

    try {
      await api.delete(`/api/products/${product.id}`)
      await loadProducts()
      setNotice('Product deleted successfully.')
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to delete product. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DashboardLayout
      subtitle="Create, update, and monitor every item in your inventory."
      title="Products"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">Inventory catalog</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">All products</h2>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            onClick={openCreateForm}
            type="button"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            Add product
          </button>
        </div>

        {notice && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
        {pageError && (
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
            <span>{pageError}</span>
            <button className="font-semibold underline" onClick={loadProducts} type="button">Try again</button>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <label className="block max-w-md text-sm font-medium text-slate-700" htmlFor="product-search">
              Search products
              <input
                className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                id="product-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or SKU..."
                type="search"
                value={search}
              />
            </label>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : filteredProducts.length === 0 ? (
            <EmptyState hasSearch={Boolean(search.trim())} onAdd={openCreateForm} />
          ) : (
            <ProductTable
              deletingId={deletingId}
              onDelete={handleDelete}
              onEdit={openEditForm}
              products={filteredProducts}
            />
          )}
        </section>
      </div>

      {isFormOpen && (
        <ProductForm
          editingProduct={editingProduct}
          error={formError}
          form={form}
          isSubmitting={isSubmitting}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </DashboardLayout>
  )
}

function ProductTable({ products, deletingId, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Product name</th>
            <th className="px-5 py-3 font-semibold">SKU</th>
            <th className="px-5 py-3 font-semibold">Quantity</th>
            <th className="px-5 py-3 font-semibold">Cost price</th>
            <th className="px-5 py-3 font-semibold">Selling price</th>
            <th className="px-5 py-3 font-semibold">Low-stock threshold</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr className="text-slate-600" key={product.id}>
              <td className="px-5 py-4 font-semibold text-slate-900">{product.name}</td>
              <td className="px-5 py-4">{product.sku}</td>
              <td className="px-5 py-4">{product.quantity_on_hand}</td>
              <td className="px-5 py-4">{formatPrice(product.cost_price)}</td>
              <td className="px-5 py-4">{formatPrice(product.selling_price)}</td>
              <td className="px-5 py-4">{product.low_stock_threshold}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-3">
                  <button className="font-semibold text-blue-600 hover:text-blue-700" onClick={() => onEdit(product)} type="button">Edit</button>
                  <button className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50" disabled={deletingId === product.id} onClick={() => onDelete(product)} type="button">
                    {deletingId === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductForm({ editingProduct, error, form, isSubmitting, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div aria-labelledby="product-form-title" aria-modal="true" className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl" role="dialog">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900" id="product-form-title">{editingProduct ? 'Edit product' : 'Add product'}</h2>
            <p className="mt-1 text-sm text-slate-500">Keep your inventory details accurate and current.</p>
          </div>
          <button aria-label="Close form" className="text-2xl leading-none text-slate-400 hover:text-slate-700" onClick={onClose} type="button">×</button>
        </div>
        <form className="space-y-5 px-6 py-6" onSubmit={onSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name" name="name" onChange={onChange} required value={form.name} />
            <FormField label="SKU" name="sku" onChange={onChange} required value={form.sku} />
          </div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="description">
            Description
            <textarea className="mt-2 block min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="description" name="description" onChange={onChange} value={form.description} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Quantity on hand" min="0" name="quantity_on_hand" onChange={onChange} required type="number" value={form.quantity_on_hand} />
            <FormField label="Low-stock threshold" min="0" name="low_stock_threshold" onChange={onChange} type="number" value={form.low_stock_threshold} />
            <FormField label="Cost price" min="0" name="cost_price" onChange={onChange} step="0.01" type="number" value={form.cost_price} />
            <FormField label="Selling price" min="0" name="selling_price" onChange={onChange} step="0.01" type="number" value={form.selling_price} />
          </div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={isSubmitting} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">{isSubmitting ? 'Saving...' : editingProduct ? 'Save changes' : 'Add product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, name, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id={name} name={name} {...props} />
    </label>
  )
}

function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">□</div>
      <h3 className="mt-4 font-semibold text-slate-900">{hasSearch ? 'No matching products' : 'Your inventory is empty'}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{hasSearch ? 'Try a different product name or SKU.' : 'Add your first product to start managing your inventory.'}</p>
      {!hasSearch && <button className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700" onClick={onAdd} type="button">Add your first product</button>}
    </div>
  )
}

function LoadingState() {
  return <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div className="h-14 animate-pulse rounded-lg bg-slate-100" key={item} />)}</div>
}
