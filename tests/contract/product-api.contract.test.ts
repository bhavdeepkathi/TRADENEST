import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const { like, eachLike, term, iso8601DateTimeWithMillis } = MatchersV3;

describe('Product API Contract Tests', () => {
  const provider = new PactV3({
    consumer: 'tradenest-frontend',
    provider: 'tradenest-catalog',
    dir: './tests/contract/pacts',
    logLevel: 'WARN',
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('returns a list of products', async () => {
    await provider.addInteraction({
      state: 'products exist',
      uponReceiving: 'a request for products',
      withRequest: {
        method: 'GET',
        path: '/api/products',
        query: { page: '1', limit: '20' },
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: eachLike({
            id: like(uuidv4()),
            title: like('Premium Wireless Headphones'),
            slug: like('premium-wireless-headphones'),
            price: like(2999),
            mrp: like(4999),
            images: eachLike(like('https://picsum.photos/seed/headphones1/400/400')),
            ratingAvg: like(4.5),
            reviewCount: like(234),
          }),
          meta: {
            page: like(1),
            limit: like(20),
            total: like(100),
            totalPages: like(5),
          },
        },
      },
    });

    const response = await axios.get('http://localhost:4002/api/products', {
      params: { page: 1, limit: 20 },
      headers: { Accept: 'application/json' },
    });

    expect(response.status).toBe(200);
    expect(response.data.data).toBeInstanceOf(Array);
    expect(response.data.meta).toHaveProperty('page');
  });

  it('returns a single product by ID', async () => {
    const productId = uuidv4();

    await provider.addInteraction({
      state: `product ${productId} exists`,
      uponReceiving: `a request for product ${productId}`,
      withRequest: {
        method: 'GET',
        path: `/api/products/${productId}`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: like(productId),
          sellerId: like(uuidv4()),
          categoryId: like(uuidv4()),
          title: like('Premium Wireless Headphones'),
          slug: like('premium-wireless-headphones'),
          description: like('Experience crystal-clear sound...'),
          price: like(2999),
          mrp: like(4999),
          images: eachLike(like('https://picsum.photos/seed/headphones1/600/600')),
          tags: eachLike(like('wireless')),
          status: like('ACTIVE'),
          ratingAvg: like(4.5),
          reviewCount: like(234),
          createdAt: iso8601DateTimeWithMillis(),
          updatedAt: iso8601DateTimeWithMillis(),
        },
      },
    });

    const response = await axios.get(`http://localhost:4002/api/products/${productId}`, {
      headers: { Accept: 'application/json' },
    });

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(productId);
  });

  it('returns 404 for non-existent product', async () => {
    const productId = uuidv4();

    await provider.addInteraction({
      state: `product ${productId} does not exist`,
      uponReceiving: `a request for non-existent product ${productId}`,
      withRequest: {
        method: 'GET',
        path: `/api/products/${productId}`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: {
          code: like('NOT_FOUND'),
          message: like('Product not found'),
        },
      },
    });

    try {
      await axios.get(`http://localhost:4002/api/products/${productId}`);
    } catch (error: any) {
      expect(error.response.status).toBe(404);
      expect(error.response.data.code).toBe('NOT_FOUND');
    }
  });
});