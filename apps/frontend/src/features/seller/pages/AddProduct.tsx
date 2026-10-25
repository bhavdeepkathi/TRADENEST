import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Camera, Loader2, Save, ArrowLeft, AlertTriangle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGetCategoriesQuery, useCreateProductMutation, useUpdateProductMutation, useGetProductQuery, useUploadProductImageMutation, useGetMySellerStatusQuery } from '../../../app/api'

const productSchema = z.object({
  title: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  brand: z.string().min(1, 'Please enter a brand'),
  subcategory: z.string().min(1, 'Please enter a subcategory'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  mrp: z.number().optional(),
  discountPercent: z.number().min(0).max(100).default(0),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  tags: z.string().optional(),
  images: z.array(
    z.string().url().or(z.string().regex(/^\/api\/products\/images\/[0-9a-f-]+\.(jpg|png|webp|gif)$/i))
  ).max(10).default([]),
})

type ProductForm = z.infer<typeof productSchema>

const initialValues: ProductForm = {
  title: '',
  description: '',
  categoryId: '',
  brand: 'TRADENEST',
  subcategory: 'General',
  price: 0,
  mrp: undefined,
  discountPercent: 0,
  stockQuantity: 1,
  tags: '',
  images: [],
}

export default function AddProduct() {
  const navigate = useNavigate()
  const params = useParams()
  const isEditing = !!params.id
  const [pendingImageFiles, setPendingImageFiles] = useState<Record<string, File>>({})
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery()
  const { data: productData, isLoading: productLoading } = useGetProductQuery(params.id || '', { skip: !isEditing })
  const { data: sellerStatus, isLoading: isSellerStatusLoading } = useGetMySellerStatusQuery()
  const [createProduct] = useCreateProductMutation()
  const [updateProduct] = useUpdateProductMutation()
  const [uploadProductImage] = useUploadProductImageMutation()

  const isKycApproved = sellerStatus?.kycStatus === 'APPROVED'
  const isKycRejected = sellerStatus?.kycStatus === 'REJECTED'
  const isKycPending = sellerStatus?.kycStatus === 'PENDING'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (isEditing && productData) {
      const savedImageUrls = productData.images.filter((url) => !url.startsWith('blob:'))
      reset({
        ...initialValues,
        title: productData.title,
        description: productData.description,
        categoryId: productData.categoryId,
        brand: productData.brand,
        subcategory: productData.subcategory,
        price: Number(productData.price),
        mrp: productData.mrp == null ? undefined : Number(productData.mrp),
        discountPercent: productData.discountPercent,
        stockQuantity: productData.inventory?.quantity ?? 0,
        tags: productData.tags.join(', '),
        images: savedImageUrls,
      })
      setImageUrls(savedImageUrls)
    }
  }, [isEditing, productData, reset])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const validFiles = files.filter((file) => supportedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024)
    if (validFiles.length !== files.length) {
      toast.error('Use JPEG, PNG, WebP, or GIF images up to 5MB each')
    }
    if (validFiles.length + imageUrls.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    const newFiles: Record<string, File> = {}
    const newUrls = validFiles.map((file) => {
      const url = URL.createObjectURL(file)
      newFiles[url] = file
      return url
    })
    setPendingImageFiles((previous) => ({ ...previous, ...newFiles }))
    setImageUrls((previous) => [...previous, ...newUrls])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const url = imageUrls[index]
    if (pendingImageFiles[url]) {
      URL.revokeObjectURL(url)
      setPendingImageFiles((previous) => {
        const next = { ...previous }
        delete next[url]
        return next
      })
    }
    setImageUrls((previous) => previous.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductForm) => {
    if (!isKycApproved) {
      if (isKycRejected) {
        toast.error(`Cannot publish: Seller KYC is REJECTED (${sellerStatus?.kycRejectionReason || 'Documents rejected'})`)
      } else {
        toast.error('Cannot publish: Seller KYC verification is currently pending approval')
      }
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        brand: data.brand,
        subcategory: data.subcategory,
        price: data.price,
        mrp: data.mrp,
        discountPercent: data.discountPercent,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        images: await Promise.all(imageUrls.map(async (url) => {
          const file = pendingImageFiles[url]
          return file ? (await uploadProductImage(file).unwrap()).url : url
        })),
      }

      if (isEditing) {
        await updateProduct({ id: params.id!, body: payload }).unwrap()
        toast.success('Product updated successfully!')
      } else {
        await createProduct({ ...payload, stockQuantity: data.stockQuantity }).unwrap()
        toast.success('Product created successfully!')
      }
      navigate('/seller/inventory')
    } catch (err: any) {
      const message = err?.data?.message || (isEditing ? 'Failed to update product' : 'Failed to create product')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = categoriesData?.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || []

  return (
    <div className="max-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/seller/inventory')} className="btn btn-outline p-2" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-50">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            {isEditing ? 'Update the details below to modify your product.' : 'Fill in the details below to add a new product to your inventory.'}
          </p>
        </div>
      </div>

      {(categoriesLoading || productLoading || isSellerStatusLoading) && (
        <div className="card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
        </div>
      )}

      {isKycRejected && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-800 text-red-800 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">KYC Status: Rejected</h3>
              <p className="text-sm mt-1">
                Your seller KYC verification was rejected by administration.
                {sellerStatus?.kycRejectionReason && (
                  <span className="font-medium"> Reason: {sellerStatus.kycRejectionReason}</span>
                )}
              </p>
              <p className="text-xs mt-1 text-red-700 dark:text-red-400">
                You cannot add or publish products until your account KYC is reviewed and approved by Superadmin.
              </p>
            </div>
          </div>
        </div>
      )}

      {isKycPending && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">KYC Status: Pending Verification</h3>
              <p className="text-sm mt-1">
                Your seller application is currently pending review by platform administrators.
              </p>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                You will be able to create and publish products once your KYC verification is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-6">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Product Name *</label>
              <input {...register('title')} className="input" placeholder="Enter product name" aria-invalid={!!errors.title} />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Description *</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Describe your product in detail..."
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Category *</label>
              <select {...register('categoryId')} className="input" aria-invalid={!!errors.categoryId}>
                <option value="">Select category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Subcategory *</label>
              <input {...register('subcategory')} className="input" placeholder="e.g., Headphones" aria-invalid={!!errors.subcategory} />
              {errors.subcategory && <p className="mt-1 text-sm text-red-500">{errors.subcategory.message}</p>}
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Brand *</label>
              <input {...register('brand')} className="input" placeholder="Enter brand name" aria-invalid={!!errors.brand} />
              {errors.brand && <p className="mt-1 text-sm text-red-500">{errors.brand.message}</p>}
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Tags</label>
              <input {...register('tags')} className="input" placeholder="comma, separated, tags" />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-6">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Price (₹) *</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="0.00"
                aria-invalid={!!errors.price}
              />
              {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">MRP (₹)</label>
              <input
                {...register('mrp', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-secondary-500">Maximum retail price (optional)</p>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Discount %</label>
              <input
                {...register('discountPercent', { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                max="100"
                className="input"
                placeholder="0"
              />
            </div>
            {!isEditing && (
              <div>
                <label className="block mb-1.5 text-sm font-medium text-secondary-700 dark:text-secondary-300">Initial Stock *</label>
                <input
                  {...register('stockQuantity', { valueAsNumber: true })}
                  type="number"
                  step="1"
                  min="0"
                  className="input"
                  placeholder="1"
                  aria-invalid={!!errors.stockQuantity}
                />
                {errors.stockQuantity && <p className="mt-1 text-sm text-red-500">{errors.stockQuantity.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-50 mb-6">Product Images</h2>
          {isEditing && productData?.images.some((url) => url.startsWith('blob:')) && (
            <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
              This product has temporary images that are no longer available. Upload them again to restore the photos.
            </p>
          )}
          <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-xl p-8">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={clsx(
                'flex flex-col items-center justify-center cursor-pointer transition-colors',
                imageUrls.length > 0 ? 'bg-secondary-50 dark:bg-secondary-800/50' : ''
              )}
            >
              {imageUrls.length === 0 ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
                    <Camera className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-secondary-600 dark:text-secondary-400 mb-2">Drag & drop images here, or click to browse</p>
                  <p className="text-xs text-secondary-400">Max 10 images, 5MB each. JPEG, PNG, WebP, GIF supported.</p>
                </>
              ) : (
                <p className="text-secondary-600 dark:text-secondary-400">Click to add more images ({imageUrls.length}/10)</p>
              )}
            </label>
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                  <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs font-medium bg-primary-600 text-white rounded">Main</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <button type="button" onClick={() => navigate('/seller/inventory')} className="btn btn-outline">Cancel</button>
          <button
            type="submit"
            disabled={isSubmitting || !isKycApproved}
            title={!isKycApproved ? (isKycRejected ? 'Publishing blocked: KYC Rejected' : 'Publishing blocked: KYC Pending') : ''}
            className={clsx('btn btn-primary', !isKycApproved && 'opacity-60 cursor-not-allowed')}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : !isKycApproved ? (
              <>
                <X className="mr-2 h-4 w-4" />
                {isKycRejected ? 'KYC Rejected - Cannot Publish' : 'KYC Pending Approval'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Product' : 'Publish Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function clsx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}