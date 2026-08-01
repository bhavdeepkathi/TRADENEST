import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Filter, ChevronDown, Grid, List } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

const mockProducts = Array.from({ length: 12 }, (_, i) => ({
  id: `prod-${i + 1}`,
  title: `Premium Product ${i + 1}`,
  slug: `premium-product-${i + 1}`,
  price: 999 + i * 100,
  mrp: 1499 + i * 100,
  image: `https://picsum.photos/seed/product${i + 1}/400/400`,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 100 + i * 10,
}))

export default function ProductList() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState('popularity')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-50">All Products</h1>
            <p className="text-secondary-600 dark:text-secondary-300">{mockProducts.length} products found</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <div className="flex items-center border border-secondary-300 rounded-lg dark:border-secondary-600">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 text-sm bg-transparent focus:outline-none dark:bg-secondary-800"
              >
                <option value="popularity">Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <ChevronDown className="mx-2 h-4 w-4 text-secondary-400" />
            </div>

            <div className="flex border border-secondary-300 rounded-lg dark:border-secondary-600">
              <button
                onClick={() => setView('grid')}
                className={clsx('p-2 transition-colors', view === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-secondary-400 hover:text-secondary-600')}
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={clsx('p-2 transition-colors', view === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-secondary-400 hover:text-secondary-600')}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-8 rounded-xl border border-secondary-200 p-6 dark:border-secondary-700"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Category</label>
                <select className="input">
                  <option>All Categories</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Garden</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Min Price</label>
                <input type="number" placeholder="0" className="input" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Max Price</label>
                <input type="number" placeholder="10000" className="input" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300">Rating</label>
                <select className="input">
                  <option>Any Rating</option>
                  <option>4★ & up</option>
                  <option>3★ & up</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <div
          className={clsx(
            'gap-6',
            view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col'
          )}
        >
          {mockProducts.map((product, i) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={clsx('card overflow-hidden transition-all', view === 'list' ? 'flex flex-row' : 'flex flex-col')}
            >
              <Link to={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800" style={{ flexShrink: 0, width: view === 'list' ? '200px' : '100%' }}>
                <img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
                {product.mrp && product.mrp > product.price && (
                  <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                    {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-4" style={{ minWidth: 0 }}>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-secondary-900 dark:text-secondary-50 hover:text-primary-600">
                    {product.title}
                  </h3>
                </Link>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-50">★ {product.rating}</span>
                  <span className="text-sm text-secondary-500">({product.reviewCount})</span>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <span className="text-xl font-bold text-secondary-900 dark:text-secondary-50">₹{product.price.toLocaleString()}</span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="line-through text-sm text-secondary-400">₹{product.mrp.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {mockProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-secondary-600 dark:text-secondary-300">No products found matching your criteria.</p>
          </div>
        )}

        <div className="mt-12 flex justify-center gap-2">
          <button className="btn btn-outline" disabled>Previous</button>
          <button className="btn btn-primary w-10" disabled>1</button>
          <button className="btn btn-outline w-10">2</button>
          <button className="btn btn-outline w-10">3</button>
          <button className="btn btn-outline">Next</button>
        </div>
      </div>
    </div>
  )
}