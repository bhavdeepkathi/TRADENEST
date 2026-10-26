import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, ArrowRight, Tag, Package, X } from 'lucide-react'
import { useGetProductsQuery } from '../app/api'

interface AiSearchBarProps {
  placeholder?: string
  className?: string
  onSearchSubmitted?: (query: string) => void
  initialValue?: string
}

// Built-in standard marketplace taxonomy for instantaneous AI prefix prediction
const MARKETPLACE_TAXONOMY = [
  { name: 'Smartphones', category: 'Mobiles', slug: 'smartphones', synonyms: ['smartp', 'smartph', 'phone', 'mobile'] },
  { name: 'Smart Watches & Bands', category: 'Electronics', slug: 'smart-watches', synonyms: ['smartw', 'watch', 'band'] },
  { name: 'Smart TVs & Android TVs', category: 'Appliances', slug: 'smart-tvs', synonyms: ['smartt', 'television', 'tv'] },
  { name: 'Laptops & MacBooks', category: 'Computers', slug: 'laptops', synonyms: ['lap', 'notebook', 'pc'] },
  { name: 'Headphones & Earbuds', category: 'Audio', slug: 'headphones', synonyms: ['headph', 'earp', 'airp', 'tws'] },
  { name: 'Shoes & Sneakers', category: 'Fashion', slug: 'shoes', synonyms: ['sho', 'sneaker', 'footwear'] },
  { name: 'Cameras & DSLRs', category: 'Cameras', slug: 'cameras', synonyms: ['cam', 'dslr', 'lens'] },
  { name: 'Tablets & iPads', category: 'Computers', slug: 'tablets', synonyms: ['tab', 'ipad'] },
  { name: 'Gaming Consoles & Accessories', category: 'Gaming', slug: 'gaming', synonyms: ['game', 'playstation', 'xbox'] },
  { name: 'Home & Kitchen Appliances', category: 'Home', slug: 'kitchen', synonyms: ['kitch', 'mixer', 'cook'] },
  { name: 'Men & Women Apparel', category: 'Fashion', slug: 'clothing', synonyms: ['shirt', 'pant', 'dress', 'tshirt'] },
]

export default function AiSearchBar({
  placeholder = 'Search products, brands, categories (e.g. smartp, laptop)...',
  className = '',
  onSearchSubmitted,
  initialValue = '',
}: AiSearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initialValue)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Query live products matching prefix
  const { data: productsData } = useGetProductsQuery(
    { q: query.trim(), limit: 5 },
    { skip: query.trim().length < 2 }
  )

  const products = productsData?.data || []

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Predictive category matching (e.g. "smartp" -> "Smartphones")
  const trimmed = query.trim().toLowerCase()
  const predictedCategories = trimmed.length >= 2
    ? MARKETPLACE_TAXONOMY.filter(
        (tax) =>
          tax.name.toLowerCase().includes(trimmed) ||
          tax.synonyms.some((s) => s.startsWith(trimmed) || trimmed.startsWith(s)) ||
          tax.category.toLowerCase().startsWith(trimmed)
      ).slice(0, 4)
    : []

  const hasSuggestions = isOpen && trimmed.length >= 2 && (predictedCategories.length > 0 || products.length > 0)

  const handleSelect = (searchVal: string, categoryFilter?: string) => {
    setQuery(searchVal)
    setIsOpen(false)
    if (onSearchSubmitted) {
      onSearchSubmitted(searchVal)
    } else {
      const params = new URLSearchParams()
      params.set('q', searchVal)
      if (categoryFilter) {
        params.set('category', categoryFilter)
      }
      navigate(`/products?${params.toString()}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim()) {
        handleSelect(query.trim())
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center rounded-xl bg-slate-50 dark:bg-secondary-800/80 border border-slate-200 dark:border-secondary-700/80 shadow-xs focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
        <Search className="h-4 w-4 ml-3.5 text-secondary-400 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
            className="p-1 mr-1 text-secondary-400 hover:text-secondary-600 rounded-md"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (query.trim()) handleSelect(query.trim())
          }}
          className="mr-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Search</span>
        </button>
      </div>

      {/* AI Autocomplete Dropdown */}
      {hasSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 shadow-2xl text-left animate-in fade-in slide-in-from-top-1 duration-150">
          {/* AI Category / Word Predictions */}
          {predictedCategories.length > 0 && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span>AI Predicted Categories (Full Word)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {predictedCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleSelect(cat.name, cat.category)}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-secondary-800 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors shadow-xs"
                  >
                    <Tag className="h-3 w-3 text-indigo-500 group-hover:text-white" />
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">({cat.category})</span>
                    <ArrowRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Previews Matching Prefix */}
          {products.length > 0 && (
            <div className="p-2 divide-y divide-secondary-100 dark:divide-secondary-800">
              <div className="px-2 py-1 text-[11px] font-semibold text-secondary-400 uppercase tracking-wider">
                Matching Products
              </div>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/products/${p.slug}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/70 text-left transition-colors"
                >
                  <img
                    src={p.images[0] || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop'}
                    alt={p.title}
                    className="h-10 w-10 object-cover rounded-md bg-secondary-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-secondary-500 truncate">
                      {p.brand} · {p.subcategory || p.category?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-primary-600">
                      ₹{Number(p.price).toLocaleString()}
                    </span>
                    {p.mrp && Number(p.mrp) > Number(p.price) && (
                      <span className="block text-[10px] text-emerald-600 font-medium">
                        {Math.round(((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100)}% off
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* View All Matches Footer */}
          <button
            type="button"
            onClick={() => handleSelect(query.trim())}
            className="w-full p-2.5 bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center justify-center gap-1.5 transition-colors border-t border-secondary-100 dark:border-secondary-800"
          >
            <span>See all results for "{query}"</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
