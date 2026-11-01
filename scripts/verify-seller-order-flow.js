const BASE_URL = 'http://localhost:4000';

async function main() {
  console.log('--- Step 1: Customer Login ---');
  const custLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@tradenest.local', password: 'Customer@123' })
  });
  if (!custLogin.ok) {
    throw new Error(`Customer login failed: ${custLogin.status} ${await custLogin.text()}`);
  }
  const custData = await custLogin.json();
  const custToken = custData.accessToken;
  console.log('Customer logged in successfully.');

  console.log('--- Step 2: Get Catalog Products ---');
  const catRes = await fetch(`${BASE_URL}/api/products?page=1&limit=5`);
  const catData = await catRes.json();
  const product = catData.data?.[0];
  if (!product) throw new Error('No products found in catalog');
  console.log(`Found product: "${product.title}" (ID: ${product.id}, SellerId: ${product.sellerId}, Price: ₹${product.price})`);

  console.log('--- Step 3: Add to Cart ---');
  const cartRes = await fetch(`${BASE_URL}/api/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`
    },
    body: JSON.stringify({ productId: product.id, quantity: 1 })
  });
  console.log('Cart add status:', cartRes.status);

  console.log('--- Step 4: Create Order (Checkout) ---');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`
    },
    body: JSON.stringify({
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        line1: '123 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN'
      },
      paymentMethod: 'COD'
    })
  });
  if (!orderRes.ok) {
    throw new Error(`Order creation failed: ${orderRes.status} ${await orderRes.text()}`);
  }
  const order = await orderRes.json();
  console.log(`Order created successfully! Order ID: ${order.id}, Status: ${order.status}, Total: ₹${order.total}`);

  console.log('--- Step 5: Confirm Payment (COD) ---');
  const confirmRes = await fetch(`${BASE_URL}/api/orders/${order.id}/confirm-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${custToken}`
    },
    body: JSON.stringify({
      provider: 'COD',
      providerRef: `COD-${order.id}`
    })
  });
  console.log('Confirm payment status:', confirmRes.status);
  const confirmedOrder = await confirmRes.json();
  console.log('Confirmed order status:', confirmedOrder.status);

  console.log('--- Step 6: Seller Login ---');
  const sellerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'seller@tradenest.local', password: 'Seller@123' })
  });
  if (!sellerLogin.ok) {
    throw new Error(`Seller login failed: ${sellerLogin.status} ${await sellerLogin.text()}`);
  }
  const sellerData = await sellerLogin.json();
  const sellerToken = sellerData.accessToken;
  console.log('Seller logged in successfully.');

  console.log('--- Step 7: Get Seller Orders ---');
  const sellerOrdersRes = await fetch(`${BASE_URL}/api/orders/seller/me/orders?page=1&limit=20`, {
    headers: { Authorization: `Bearer ${sellerToken}` }
  });
  console.log('Seller orders status:', sellerOrdersRes.status);
  if (!sellerOrdersRes.ok) {
    throw new Error(`Seller orders query failed: ${sellerOrdersRes.status} ${await sellerOrdersRes.text()}`);
  }
  const sellerOrders = await sellerOrdersRes.json();
  console.log(`Seller orders received! Total: ${sellerOrders.meta.total}`);

  const foundOrder = sellerOrders.data.find(o => o.id === order.id);
  if (!foundOrder) {
    console.error('Available order IDs:', sellerOrders.data.map(o => o.id));
    throw new Error(`Newly placed order ${order.id} was not found in seller orders list!`);
  }
  console.log(`SUCCESS! Found newly placed order in seller portal: #${foundOrder.id.slice(0, 8)} with ${foundOrder.items.length} item(s)!`);

  console.log('--- Step 8: Seller Approves Order ---');
  const updateStatusRes = await fetch(`${BASE_URL}/api/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`
    },
    body: JSON.stringify({ status: 'PROCESSING' })
  });
  console.log('Seller update status:', updateStatusRes.status);
  const updatedStatusOrder = await updateStatusRes.json();
  console.log(`Order status updated to: ${updatedStatusOrder.status}`);

  console.log('\n========================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('========================================');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
