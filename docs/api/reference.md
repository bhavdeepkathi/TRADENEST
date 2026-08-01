# TRADENEST API Reference

> **Base URL**  
> `https://api.tradenest.io/v1` (production)  
> `https://api.staging.tradenest.io/v1` (staging)

All endpoints are served behind the **API Gateway** (`/api` prefix).  
Authentication: **Bearer JWT** (access token). Refresh via `/auth/refresh`.

---

## Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes (except public) | `Bearer <access_token>` |
| `Content-Type` | Yes (POST/PATCH) | `application/json` |
| `Idempotency-Key` | Optional (mutating) | Client‑generated UUID for safe retries |

---

## Error Format
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": { "field": "email", "issue": "must be a valid email" }
}
```
| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Request body/query invalid |
| 401 | `AUTHENTICATION_ERROR` | Missing/expired/invalid token |
| 403 | `AUTHORIZATION_ERROR` | Insufficient role/permission |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate unique field |
| 422 | `UNPROCESSABLE_ENTITY` | Business rule violation |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Authentication (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register **customer** or **seller** (returns *OTP sent*) |
| POST | `/auth/verify-otp` | — | Verify OTP → returns **access + refresh** tokens |
| POST | `/auth/login` | — | Email/password → tokens |
| POST | `/auth/refresh` | Refresh | Rotate refresh token |
| POST | `/auth/logout` | Access | Revoke current refresh token |
| POST | `/auth/logout-all` | Access | Revoke all user refresh tokens |
| POST | `/auth/forgot-password` | — | Send reset‑password OTP |
| POST | `/auth/reset-password` | — | Reset password with token |
| GET  | `/auth/me` | Access | Current user profile |

**Request/Response examples** – see `docs/api/openapi.yaml`.

---

## Users (`/users`) – **Admin / Super‑Admin**

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/users` | ADMIN, SUPER_ADMIN | Paginated list, filter `role` |
| GET | `/users/:id` | ADMIN, SUPER_ADMIN | Single user |
| PATCH | `/users/:id` | ADMIN, SUPER_ADMIN | Update `firstName`, `lastName`, `role`, `isActive` |
| DELETE | `/users/:id` | SUPER_ADMIN | Hard delete |

---

## Products (`/products`) – Public read, Seller write

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/products` | — | — | Search, filter (`q`, `categoryId`, `minPrice`, `maxPrice`, `rating`, `status`), paginate |
| GET | `/products/:id` | — | — | Full detail (incl. reviews, inventory) |
| POST | `/products` | Access | SELLER, ADMIN | Create (status = `PENDING_APPROVAL`) |
| PATCH | `/products/:id` | Access | SELLER (owner), ADMIN | Update fields, `status` transition |
| DELETE | `/products/:id` | Access | SELLER (owner), ADMIN | Soft delete (`INACTIVE`) |

**Query parameters** – `page`, `limit`, `sort` (`price_asc|price_desc|newest|popularity`), `order`.

---

## Categories (`/categories`) – Public read, Admin write

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/categories` | — | — |
| GET | `/categories/:id` | — | — |
| POST | `/categories` | Access | ADMIN |
| PATCH | `/categories/:id` | Access | ADMIN |
| DELETE | `/categories/:id` | Access | ADMIN |

---

## Cart (`/cart`) – Customer

| Method | Path | Auth |
|--------|------|------|
| GET | `/cart` | Access |
| POST | `/cart` | Access (add/update item `{productId, quantity}`) |
| DELETE | `/cart/:productId` | Access |
| POST | `/cart/clear` | Access |

---

## Wishlist (`/wishlist`) – Customer

| Method | Path | Auth |
|--------|------|------|
| GET | `/wishlist` | Access |
| POST | `/wishlist/toggle` | Access (`{productId}`) |
| DELETE | `/wishlist/clear` | Access |

---

## Orders (`/orders`) – Customer & Seller

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/orders` | Access | CUSTOMER (own), SELLER (own items), ADMIN |
| GET | `/orders/:id` | Access | same |
| POST | `/orders` | Access | CUSTOMER (creates from cart) |
| PATCH | `/orders/:id/status` | Access | SELLER (owner), ADMIN (`status` transition) |
| POST | `/orders/:id/return` | Access | CUSTOMER |
| GET | `/orders/:id/invoice` | Access | CUSTOMER, SELLER, ADMIN (PDF download) |

---

## Payments (`/payments`) – Customer

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/intent` | Access | Create payment intent (`provider`: `RAZORPAY|STRIPE|UPI|WALLET`) |
| POST | `/payments/webhook/:provider` | **none** (signed) | Provider callbacks (Razorpay/Stripe/UPI) |
| POST | `/payments/refund` | Access | ADMIN only – full/partial refund |
| GET | `/payments/:id` | Access | Payment details |

---

## Wallet (`/wallet`) – Customer

| Method | Path | Auth |
|--------|------|------|
| GET | `/wallet` | Access |
| POST | `/wallet/add` | Access (`{amount, paymentMethod}`) |
| GET | `/wallet/transactions` | Access |

---

## Coupons (`/coupons`) – Admin

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/coupons` | Access | ADMIN |
| POST | `/coupons` | Access | ADMIN |
| PATCH | `/coupons/:id` | Access | ADMIN |
| DELETE | `/coupons/:id` | Access | ADMIN |

---

## Notifications (`/notifications`) – Customer

| Method | Path | Auth |
|--------|------|------|
| GET | `/notifications` | Access (paginated, `read` filter) |
| GET | `/notifications/unread-count` | Access |
| PATCH | `/notifications/:id/read` | Access |
| PATCH | `/notifications/read-all` | Access |

---

## Preferences (`/preferences`) – Customer

| Method | Path | Auth |
|--------|------|------|
| GET | `/preferences` | Access |
| PATCH | `/preferences` | Access (`email`, `push`, `sms`, `marketing`) |
| POST | `/preferences/device-token` | Access (`{token, platform}`) |
| DELETE | `/preferences/device-token/:token` | Access |

---

## AI (`/ai`) – Internal / Customer

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| GET | `/ai/recommendations` | Access | CUSTOMER (personalized), SELLER (trending) |
| GET | `/ai/analytics/trending` | Access | ADMIN, SELLER |
| GET | `/ai/analytics/forecast` | Access | ADMIN |
| GET | `/ai/analytics/fraud-alerts` | Access | ADMIN |

---

## Rate Limits (global defaults)

| Scope | Window | Max Requests |
|-------|--------|--------------|
| Auth endpoints | 15 min | 10 |
| API (authenticated) | 15 min | 100 |
| Strict (payment intent) | 1 min | 5 |

Exceeding returns **429** with `Retry-After` header.

---

## Versioning & Deprecation

* Version encoded in URL (`/v1/`).  
* Breaking changes → new major version (`/v2/`).  
* Deprecation notice 90 days before removal; `Sunset` header on deprecated endpoints.

---

## SDKs / Generated Clients

* **TypeScript** – `npm i @tradenest/api-client` (generated from OpenAPI).  
* **Python** – `pip install tradenest-sdk`.  
* **Go** – `go get github.com/tradenest/go-sdk`.

---

*Full machine‑readable spec:* `docs/api/openapi.yaml` (OpenAPI 3.0).  
*Interactive UI:* `https://api.tradenest.io/docs` (Swagger‑UI).

---

*Generated as part of Phase 12 – Documentation & Resume‑Ready Assets.*