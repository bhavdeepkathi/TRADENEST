import { PlusCircle, Search, Edit, Trash2, ChevronDown, ChevronUp, Loader2, RotateCcw, Save, AlertTriangle, AlertCircle, Download, Upload, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetSellerProductsQuery, useDeleteProductMutation, useUpdateProductMutation, useGetMySellerStatusQuery, useGetCategoriesQuery, useCreateProductMutation } from '../../../app/api'
import toast from 'react-hot-toast'

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  INACTIVE: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OUT_OF_STOCK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  LOW_STOCK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

const productIcons: Record<string, string> = {
  'Electronics': '🎧',
  'Fashion': '👕',
  'Home & Kitchen': '🏠',
  'Beauty & Personal Care': '💄',
  'Sports & Outdoors': '⚽',
  'Books': '📚',
  'Toys & Games': '🧸',
  'Automotive': '🚗',
  'General': '📦',
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [stockValues, setStockValues] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useGetSellerProductsQuery({ page, limit: 10, status: statusFilter !== 'all' ? statusFilter : undefined })
  const { data: sellerStatus } = useGetMySellerStatusQuery()
  const { data: categoriesData } = useGetCategoriesQuery()
  const [deleteProduct] = useDeleteProductMutation()
  const [updateProduct, { isLoading: isUpdatingStock }] = useUpdateProductMutation()
  const [createProduct] = useCreateProductMutation()

  const [showImportModal, setShowImportModal] = useState(false)
  const [csvRawText, setCsvRawText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importStats, setImportStats] = useState<{ total: number; success: number; failed: number } | null>(null)

  const products = data?.data || []
  const meta = data?.meta

  const filteredProducts = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig) return 0
      const aVal = a[sortConfig.key as keyof typeof a]
      const bVal = b[sortConfig.key as keyof typeof b]
      if (aVal == null || bVal == null) return 0
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const SortIcon = ({ sortKey }: { sortKey: string }) => {
    if (sortConfig?.key !== sortKey) return <ChevronDown className="h-4 w-4 text-secondary-400" />
    return sortConfig?.direction === 'asc' ? <ChevronUp className="h-4 w-4 text-primary-600" /> : <ChevronDown className="h-4 w-4 text-primary-600" />
  }

  const getStockStatus = (product: typeof products[0]) => {
    const qty = product.inventory?.quantity ?? 0
    const threshold = 10
    if (qty === 0) return 'OUT_OF_STOCK'
    if (qty <= threshold) return 'LOW_STOCK'
    return product.status
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id).unwrap()
      toast.success('Product deleted successfully')
      refetch()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/seller/products/${id}/edit`)
  }

  const handleUpdateStock = async (id: string, currentQuantity: number) => {
    const quantity = Number(stockValues[id] ?? currentQuantity)
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Enter a valid non-negative stock quantity')
      return
    }

    try {
      await updateProduct({ id, body: { stockQuantity: quantity } }).unwrap()
      setStockValues((values) => {
        const nextValues = { ...values }
        delete nextValues[id]
        return nextValues
      })
      toast.success('Stock updated successfully')
    } catch {
      toast.error('Failed to update stock')
    }
  }

  const downloadSampleCSV = () => {
    const sample = `title,brand,category,price,mrp,stockQuantity,description
Wireless Bluetooth Earbuds,AudioPro,Electronics,1499,2999,50,High quality noise cancelling wireless earbuds
Cotton Casual Slim Fit Shirt,UrbanStyle,Fashion,899,1999,30,Premium 100% breathable cotton slim fit shirt
Stainless Steel Water Bottle 1L,HydroFit,Home & Kitchen,499,999,100,Double walled insulated vacuum stainless steel bottle`
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tradenest_sample_product_import.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('No products available to export')
      return
    }
    const headers = ['title', 'brand', 'category', 'price', 'mrp', 'stockQuantity', 'status', 'description']
    const rows = products.map((p) => [
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${((p as any).brand || '').replace(/"/g, '""')}"`,
      `"${(p.category?.name || 'General').replace(/"/g, '""')}"`,
      p.price,
      p.mrp || p.price,
      p.inventory?.quantity ?? 0,
      p.status,
      `"${(p.description || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tradenest_inventory_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${products.length} products to CSV`)
  }

  const parseCSVRows = (text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) return []
    const headerLine = lines[0].toLowerCase()
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))

    const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('name'))
    const priceIdx = headers.findIndex((h) => h.includes('price'))
    const mrpIdx = headers.findIndex((h) => h.includes('mrp'))
    const stockIdx = headers.findIndex((h) => h.includes('stock') || h.includes('qty') || h.includes('quantity'))
    const brandIdx = headers.findIndex((h) => h.includes('brand'))
    const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('cat'))
    const descIdx = headers.findIndex((h) => h.includes('desc'))

    const parsed = []
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',')
      const cleanRow = row.map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'))

      const title = titleIdx !== -1 && cleanRow[titleIdx] ? cleanRow[titleIdx] : `Product ${i}`
      const price = priceIdx !== -1 ? Math.max(0, Number(cleanRow[priceIdx]) || 100) : 100
      const mrp = mrpIdx !== -1 ? Math.max(price, Number(cleanRow[mrpIdx]) || price) : Math.round(price * 1.3)
      const stock = stockIdx !== -1 ? Math.max(0, parseInt(cleanRow[stockIdx], 10) || 10) : 10
      const brand = brandIdx !== -1 && cleanRow[brandIdx] ? cleanRow[brandIdx] : 'TradeNest Select'
      const catName = catIdx !== -1 && cleanRow[catIdx] ? cleanRow[catIdx] : 'General'
      const desc = descIdx !== -1 && cleanRow[descIdx] ? cleanRow[descIdx] : `${title} - High quality product offered on TradeNest marketplace.`

      const matchedCat = categoriesData?.find((c) => c.name.toLowerCase() === catName.toLowerCase()) || categoriesData?.[0]
      const categoryId = matchedCat?.id || 'general'

      parsed.push({
        title,
        price,
        mrp,
        stockQuantity: stock,
        brand,
        categoryName: matchedCat?.name || catName,
        categoryId,
        description: desc,
      })
    }
    return parsed
  }

  const handleExecuteBulkImport = async () => {
    const rows = parseCSVRows(csvRawText)
    if (rows.length === 0) {
      toast.error('No valid product rows found in CSV')
      return
    }
    setIsImporting(true)
    setImportStats(null)
    let success = 0
    let failed = 0
    for (const item of rows) {
      try {
        await createProduct({
          title: item.title,
          price: item.price,
          mrp: item.mrp,
          stockQuantity: item.stockQuantity,
          brand: item.brand,
          categoryId: item.categoryId,
          description: item.description,
          images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'],
        }).unwrap()
        success++
      } catch (err) {
        failed++
      }
    }
    setIsImporting(false)
    setImportStats({ total: rows.length, success, failed })
    if (success > 0) {
      toast.success(`Successfully imported ${success} products!`)
      refetch()
    }
  }

  const parsedPreview = csvRawText.trim() ? parseCSVRows(csvRawText) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">Inventory</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">Manage your product catalog and stock levels.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline flex items-center gap-1.5 text-xs font-semibold"
            title="Download full catalog as CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowImportModal(true)
              setImportStats(null)
            }}
            className="btn btn-outline flex items-center gap-1.5 text-xs font-semibold"
            title="Upload CSV to add products in bulk"
          >
            <Upload className="h-4 w-4" />
            Bulk Import CSV
          </button>
          <Link
            to="/seller/products/add"
            className={clsx('btn btn-primary', sellerStatus?.kycStatus !== 'APPROVED' && 'opacity-70')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {sellerStatus?.kycStatus === 'REJECTED' && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 text-red-800 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Seller KYC Verification Rejected</h3>
              <p className="text-sm mt-1">
                Your seller KYC verification was rejected by administration.
                {sellerStatus?.kycRejectionReason && (
                  <span className="font-medium"> Reason: {sellerStatus.kycRejectionReason}</span>
                )}
              </p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400">
                All your products have been hidden from customer marketplace searches and product pages. Adding and updating products is disabled until KYC approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {sellerStatus?.kycStatus === 'PENDING' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">KYC Status: Pending Review</h3>
              <p className="text-sm mt-1">
                Your seller KYC verification is currently being reviewed by administrators. Your products will not be visible to customers until your account is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-4"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REJECTED">Rejected</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <button onClick={() => refetch()} disabled={isLoading} className="btn btn-outline flex items-center gap-2">
            <RotateCcw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Failed to load products</p>
            <button onClick={() => refetch()} className="btn btn-outline mt-2">Retry</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50 dark:bg-secondary-800/50">
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Product</th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('categoryId')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Category <SortIcon sortKey="categoryId" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('price')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Price <SortIcon sortKey="price" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                      <button onClick={() => handleSort('inventory')} className="flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200">Stock <SortIcon sortKey="inventory" /></button>
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Status</th>
                    <th className="text-right p-4 text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-secondary-500">No products found</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-800 text-2xl">
                              {product.category?.name ? productIcons[product.category.name] || '📦' : '📦'}
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900 dark:text-secondary-50 truncate max-w-xs">{product.title}</p>
                              <p className="text-xs text-secondary-500 dark:text-secondary-400">ID: {product.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-secondary-700 dark:text-secondary-300">{product.category?.name || 'General'}</td>
                        <td className="p-4 text-sm font-medium text-secondary-900 dark:text-secondary-50">₹{product.price.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={stockValues[product.id] ?? String(product.inventory?.quantity ?? 0)}
                              onChange={(event) => setStockValues((values) => ({ ...values, [product.id]: event.target.value }))}
                              className="input w-20"
                              aria-label={`Stock quantity for ${product.title}`}
                            />
                            <button
                              onClick={() => handleUpdateStock(product.id, product.inventory?.quantity ?? 0)}
                              disabled={isUpdatingStock}
                              className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-50"
                              aria-label={`Save stock quantity for ${product.title}`}
                            >
                              <Save className="h-4 w-4 text-primary-600" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[getStockStatus(product)])}>
                            {getStockStatus(product).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(product.id)} className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Edit product"><Edit className="h-4 w-4 text-secondary-500" /></button>
                            <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700" aria-label="Delete product"><Trash2 className="h-4 w-4 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, meta.total)} of {meta.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={page === meta.totalPages || isLoading}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 space-y-4 bg-white dark:bg-secondary-900 shadow-2xl border border-secondary-200 dark:border-secondary-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-secondary-200 dark:border-secondary-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-50">
                    Bulk Product CSV Import
                  </h3>
                  <p className="text-xs text-secondary-500">
                    Add dozens or hundreds of products at once using standard CSV format.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template Download & File Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary-50 dark:bg-secondary-800/60 rounded-xl border border-secondary-200 dark:border-secondary-700">
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                <p className="font-semibold text-secondary-800 dark:text-secondary-200">Need the correct column format?</p>
                <p>Use our sample CSV template with pre-filled example products.</p>
              </div>
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="btn btn-outline btn-sm inline-flex items-center gap-1.5 shrink-0 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download Sample CSV
              </button>
            </div>

            {/* File Upload / Paste Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-secondary-700 dark:text-secondary-300">
                  Select CSV File or Paste Data:
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const content = event.target?.result as string
                        setCsvRawText(content || '')
                      }
                      reader.readAsText(file)
                    }
                  }}
                  className="text-xs text-secondary-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>

              <textarea
                rows={5}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder="title,brand,category,price,mrp,stockQuantity,description&#10;Wireless Earbuds,AudioPro,Electronics,1499,2999,50,High quality audio&#10;Casual Cotton Shirt,UrbanStyle,Fashion,899,1999,30,100% Cotton shirt"
                className="w-full font-mono text-xs rounded-lg border border-secondary-300 bg-white dark:bg-secondary-800 dark:border-secondary-700 p-3 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-secondary-800 dark:text-secondary-200">
                    Preview ({parsedPreview.length} products detected):
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Validated & Ready to Import
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-lg text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-secondary-100 dark:bg-secondary-800 sticky top-0">
                      <tr>
                        <th className="p-2">Title</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                      {parsedPreview.map((item, idx) => (
                        <tr key={idx} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/40">
                          <td className="p-2 font-medium truncate max-w-[200px]">{item.title}</td>
                          <td className="p-2 text-secondary-500">{item.categoryName}</td>
                          <td className="p-2 font-bold">₹{item.price}</td>
                          <td className="p-2">{item.stockQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results feedback */}
            {importStats && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    Import completed: <strong>{importStats.success} created</strong>
                    {importStats.failed > 0 && `, ${importStats.failed} failed`}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                disabled={parsedPreview.length === 0 || isImporting}
                onClick={handleExecuteBulkImport}
                className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isImporting ? 'Importing Products...' : `Import ${parsedPreview.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}