import { Link } from 'react-router-dom'
import { Home, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="mb-4 text-9xl font-bold text-primary-600/20 dark:text-primary-400/20">404</h1>
        <p className="mb-8 text-xl text-secondary-600 dark:text-secondary-300">Page not found</p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn btn-primary flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}