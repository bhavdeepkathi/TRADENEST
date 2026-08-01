# TRADENEST – Architecture Overview

## High‑Level Diagram

```mermaid
flowchart TB
    subgraph Client["Clients"]
        Web[React PWA (Vite)]
        Mobile[Mobile Browser / PWA]
    end

    subgraph Edge["Edge & DNS"]
        CF[CloudFront CDN]
        WAF[AWS WAF]
        DNS[Route 53]
    end

    subgraph Gateway["API Gateway (NGINX Ingress)"]
        GW[Gateway Service :4000]
    end

    subgraph Services["Micro‑services (K8s Deployments)"]
        Auth[Auth Service]
        Catalog[Catalog Service]
        Order[Order Service]
        Payment[Payment Service]
        AI[AI Service]
        Notif[Notification Service]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL RDS)]
        Redis[(ElastiCache Redis)]
        S3[(S3 Buckets)]
    end

    subgraph Observability["Observability"]
        Prom[Prometheus]
        Grafana[Grafana]
        Loki[Loki]
        AlertMgr[Alertmanager]
    end

    Web --> CF
    Mobile --> CF
    CF --> WAF --> DNS --> GW
    GW --> Auth
    GW --> Catalog
    GW --> Order
    GW --> Payment
    GW --> AI
    GW --> Notif

    Auth --> PG
    Auth --> Redis
    Catalog --> PG
    Catalog --> Redis
    Catalog --> S3
    Order --> PG
    Order --> Redis
    Payment --> PG
    Payment --> Redis
    AI --> PG
    AI --> Redis
    Notif --> PG
    Notif --> Redis

    Prom --> Grafana
    Loki --> Grafana
    AlertMgr --> Prom
```

## Component Responsibilities

| Component | Tech | Key Responsibilities |
|-----------|------|----------------------|
| **Frontend** | React 18, Vite, Tailwind, Redux‑Toolkit, PWA | SSR‑free SPA, offline‑first, responsive UI, dark‑mode |
| **API Gateway** | NGINX Ingress + custom proxy | TLS termination, request routing, auth header injection, rate‑limit |
| **Auth Service** | Node 20, Express, Prisma, JWT (RS256) | Register, login, OTP, password‑reset, RBAC, token refresh |
| **Catalog Service** | Node 20, Express, Prisma | Product CRUD, search, filters, categories, inventory |
| **Order Service** | Node 20, Express, Prisma | Cart → order, status machine, invoices, returns |
| **Payment Service** | Node 20, Express, Prisma, Razorpay/Stripe/UPI | Payment intent, webhook handling, refunds, wallet |
| **AI Service** | Node 20, TensorFlow.js / Python micro‑svc | Recommendations, trending, demand forecast, fraud scoring |
| **Notification Service** | Node 20, Socket.io, Nodemailer | Email, push, in‑app, preferences |
| **PostgreSQL** | AWS RDS Multi‑AZ | ACID, relational data, migrations via Prisma |
| **Redis** | ElastiCache Cluster | Sessions, caching, rate‑limit counters, pub/sub |
| **S3** | AWS S3 (versioned) | Product images, invoices, seller KYC docs |
| **Observability** | Prometheus + Grafana + Loki + Alertmanager | Metrics, logs, dashboards, alerting |

## Deployment Topology (AWS)

```
Route53 → CloudFront → ALB (TLS) → NGINX Ingress (EKS) → Services (Deployments) → RDS / ElastiCache / S3
```

* EKS managed node‑groups (t3.medium → auto‑scale)
* IRSA for least‑privilege pod IAM
* External‑Secrets Operator → AWS Secrets Manager
* cert‑manager + Let’s Encrypt for TLS
* ArgoCD GitOps for all manifests

## Security Layers

1. **Network** – default‑deny NetworkPolicies, WAF rules, private subnets.
2. **Pod** – PSA `restricted`, Kyverno policies (no‑priv, non‑root, read‑only fs, limits).
3. **Secrets** – SealedSecrets + External‑Secrets, never in repo.
4. **Transport** – TLS everywhere (cert‑manager), mTLS optional via Istio.
5. **Application** – Helmet, CSP, CSRF, JWT‑RS256, short‑lived access tokens, refresh‑token rotation.

---

*Generated as part of Phase 12 – Documentation & Resume‑Ready Assets.*