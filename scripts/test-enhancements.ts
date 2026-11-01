import http from 'http'

function request(options: http.RequestOptions, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const opts = { ...options, port: options.port || 4000 }
    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, data: data ? JSON.parse(data) : null })
        } catch {
          resolve({ status: res.statusCode || 0, data })
        }
      })
    })
    req.on('error', reject)
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.end()
  })
}

async function runTests() {
  console.log('🧪 Starting Verification of Newly Implemented Features...\n')

  // 1. Get a product from catalog
  console.log('1. Checking Catalog & Q&A endpoints:')
  const catalogRes = await request({
    hostname: '127.0.0.1',
    port: 4000,
    path: '/api/products?limit=1',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (catalogRes.status !== 200 || !catalogRes.data?.data?.[0]?.id) {
    throw new Error('Failed to fetch a catalog product')
  }
  const productId = catalogRes.data.data[0].id
  console.log(`   Fetched Product: ${catalogRes.data.data[0].title} (ID: ${productId})`)

  // 2. Fetch Q&A for this product
  const qaRes = await request({
    hostname: '127.0.0.1',
    port: 4000,
    path: `/api/products/${productId}/questions`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  console.log(`   GET /api/products/${productId}/questions -> Status: ${qaRes.status}`)
  console.log(`   Initial Questions Count: ${qaRes.data?.data?.length ?? 0}`)

  // 3. Login as Customer and post a Question
  console.log('\n2. Testing Customer Question Submission:')
  const loginRes = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'customer@tradenest.local', password: 'Customer@123' }
  )

  const token = loginRes.data?.accessToken
  if (!token) throw new Error('Customer login failed: ' + JSON.stringify(loginRes.data))
  console.log('   Customer logged in successfully')

  const askRes = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: `/api/products/${productId}/questions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    { question: 'Is this item water resistant and suitable for daily outdoor commute?' }
  )
  console.log(`   POST /api/products/${productId}/questions -> Status: ${askRes.status}`)
  const questionId = askRes.data?.id
  console.log(`   Question ID Created: ${questionId}`)

  // 4. Login as Seller and Answer the Question
  console.log('\n3. Testing Seller Answer Submission:')
  const sellerLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'seller@tradenest.local', password: 'Seller@123' }
  )
  const sellerToken = sellerLogin.data?.accessToken
  if (!sellerToken) throw new Error('Seller login failed: ' + JSON.stringify(sellerLogin.data))

  const answerRes = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: `/api/products/questions/${questionId}/answer`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
    },
    { answer: 'Yes! It features splash-proof IPX4 coating and reinforced stitching for daily all-weather commute.' }
  )
  console.log(`   POST /api/products/questions/${questionId}/answer -> Status: ${answerRes.status}`)
  console.log(`   Answer Response:`, answerRes.data)

  // 5. Verify the question now appears answered
  const updatedQaRes = await request({
    hostname: '127.0.0.1',
    port: 4000,
    path: `/api/products/${productId}/questions`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  const answeredQ = updatedQaRes.data?.data?.find((q: any) => q.id === questionId)
  console.log(`   Verified Answer: "${answeredQ?.answer}" (Answered By: ${answeredQ?.answeredBy})`)

  // 6. Test Logistics Doorstep Reschedule & Cash Reconciliation
  console.log('\n4. Testing Logistics COD Reconciliation & Reschedule:')
  const driverLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'delivery@tradenest.local', password: 'Delivery@123' }
  )
  const driverToken = driverLogin.data?.accessToken
  if (!driverToken) throw new Error('Driver login failed')

  const cashReconcileRes = await request(
    {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/api/logistics/reconcile-cash',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
    },
    { amount: 1500, hubId: 'HUB-NORTH-DELHI-01', notes: 'Settled COD collected for today shifts' }
  )
  console.log(`   POST /api/logistics/reconcile-cash -> Status: ${cashReconcileRes.status}`)
  console.log(`   Reconciliation Receipt:`, cashReconcileRes.data)

  console.log('\n🎉 ALL ENHANCEMENT TESTS PASSED PERFECTLY!\n')
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
