# TRADENEST 🚀

> **AI‑Powered, Cloud‑Native Digital Marketplace**  
> Production‑grade, microservices, GitOps‑ready – built to showcase **Full‑Stack + Cloud + DevOps + Security** expertise for top‑tier interviews.

[![CI](https://github.com/your-org/tradenest/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/tradenest/actions/workflows/ci.yml)
[![CD Staging](https://github.com/your-org/tradenest/actions/workflows/cd-staging.yml/badge.svg)](https://github.com/your-org/tradenest/actions/workflows/cd-staging.yml)
[![CD Production](https://github.com/your-org/tradenest/actions/workflows/cd-production.yml/badge.svg)](https://github.com/your-org/tradenest/actions/workflows/cd-production.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/guides/contributing.md)

---

## 🌟 Highlights

| Area | Tech / Practice |
|------|-----------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Redux‑Toolkit, PWA, Framer‑Motion, Dark‑Mode |
| **Backend** | 6 Node 20 micro‑services (Auth, Catalog, Order, Payment, AI, Notification) + API Gateway |
| **Data** | PostgreSQL (RDS Multi‑AZ), Redis (ElastiCache), S3 (versioned) |
| **Auth** | JWT RS256, short‑lived access + rotating refresh, OTP, RBAC, Kyverno‑enforced policies |
| **AI** | Recommendation engine, trending prediction, demand forecast, fraud scoring |
| **Payments** | Razorpay, Stripe, UPI, Wallet – webhook‑verified, idempotent |
| **Observability** | Prometheus + Grafana dashboards, Loki logs, Alertmanager → Slack |
| **Security** | NetworkPolicies, PSA `restricted`, Kyverno, SealedSecrets, WAF, TLS (cert‑manager) |
| **CI/CD** | GitHub Actions (lint, test, contract, build, scan) → ArgoCD GitOps (staging/prod) |
| **Testing** | Unit (Vitest 80 %+), Integration (Testcontainers), Contract (Pact), E2E (Cypress), Load (k6), Chaos (Litmus) |
| **IaC** | Terraform (VPC, EKS, RDS, ElastiCache, S3, ALB, CloudFront, Route53) |
| **GitOps** | Helm umbrella chart + Kustomize overlays, ArgoCD auto‑sync, External‑Secrets Operator |

---

## 📸 Screenshots (add your own)

| Home | Product List | Cart & Checkout |
|------|--------------|-----------------|
| ![home](docs/assets/home.png) | ![list](docs/assets/list.png) | ![checkout](docs/assets/checkout.png) |

---

## 🚀 Quick Start (Local)

```bash
git clone https://github.com/your-org/tradenest.git
cd tradenest
cp .env.example .env
npm ci
npm run dev          # docker‑compose up (Postgres, Redis, MinIO, Mailhog + all services)
npm run db:migrate
npm run db:seed
# open http://localhost:3000
```

**Test accounts** (seeded):
| Role | Email | Password |
|------|-------|----------|
| Super‑Admin | superadmin@tradenest.local | SuperAdmin@123 |
| Admin | admin@tradenest.local | Admin@123 |
| Customer | customer@tradenest.local | Customer@123 |
| Seller | seller@tradenest.local | Seller@123 |

---

## 📂 Repository Tour

```
tradenest/
├─ apps/                # Frontend + 7 backend services
├─ libs/                # Shared TS packages (common, auth)
├─ infra/
│   ├─ terraform/       # AWS infra as code
│   ├─ helm/            # Umbrella + microservice lib chart
│   ├─ argocd/          # GitOps Applications
│   ├─ monitoring/      # Prometheus, Grafana, Loki, Alertmanager
│   └─ security/        # NetPol, Kyverno, SealedSecrets, WAF, TLS
├─ tests/               # unit / integration / contract / e2e / load / chaos
├─ .github/workflows/   # CI + CD pipelines
├─ jenkins/             # Declarative pipeline + shared lib
├─ docs/                # Architecture, API, Guides, Runbooks
└─ docker-compose.yml   # Local dev stack
```

---

## 📚 Documentation

| Doc | Link |
|-----|------|
| Architecture Overview | `docs/architecture/overview.md` |
| API Reference (OpenAPI) | `docs/api/reference.md` |
| Deployment Guide | `docs/guides/deployment-guide.md` |
| Contributing Guide | `docs/guides/contributing.md` |
| Runbooks (Incident Response) | `docs/runbooks/index.md` |

---

## 🧪 Test Suite

```bash
npm run test:unit          # Vitest (80%+ coverage)
npm run test:integration   # Testcontainers (real PG/Redis)
npm run test:contract      # Pact consumer‑driven contracts
npm run test:e2e           # Cypress full customer journey
npm run test:load          # k6 staged load (p95 < 1s)
npm run test:chaos:staging # LitmusChaos experiments
```

All run automatically in **GitHub Actions** (`.github/workflows/tests.yml`).

---

## ☁️ Production Deployment (One‑liner via ArgoCD)

```bash
# After Terraform bootstrap (see deployment guide)
kubectl apply -f infra/argocd/overlays/prod/application.yaml
# ArgoCD syncs Helm chart → all micro‑services, ingress, monitoring, security
```

*Zero‑downtime rolling updates, HPA, PDB, auto‑rollback on health‑check failure.*

---

## 🔐 Security Posture

* **Network** – default‑deny `NetworkPolicy`, AWS WAF, private subnets.  
* **Pod** – PSA `restricted`, Kyverno (no‑priv, non‑root, read‑only FS, limits).  
* **Secrets** – External‑Secrets → AWS Secrets Manager, SealedSecrets for GitOps.  
* **Transport** – TLS everywhere (cert‑manager + Let’s Encrypt), mTLS ready.  
* **App** – Helmet, CSP, CSRF, JWT‑RS256, short access + rotating refresh, rate‑limit.

---

## 📈 Metrics & SLOs (sample)

| Metric | Target |
|--------|--------|
| Availability | 99.9 % (monthly) |
| p95 Latency (API) | < 1 s |
| Error Rate (5xx) | < 0.1 % |
| Deployment Frequency | Multiple / day |
| MTTR (critical) | < 15 min |

---

## 🎓 Why TRADENEST Stands Out

1. **End‑to‑End Ownership** – from Terraform infra to React PWA.  
2. **Real‑World Patterns** – DDD, CQRS‑lite, Event‑driven (WebSocket), Idempotent payments.  
3. **Observability‑First** – dashboards, alerts, logs, traces.  
4. **Security‑By‑Design** – multiple defence layers, automated policy enforcement.  
5. **GitOps & CI/CD** – fully automated, reproducible, auditable.  
6. **Chaos‑Ready** – automated resilience verification.  
7. **Interview‑Ready Docs** – architecture diagrams, runbooks, API spec, deployment guide.

---

## 🤝 Contributing

See `docs/guides/contributing.md`.  
We ❤️ PRs – bug fixes, new features, documentation, tests.

---

## 📜 License

MIT © 2025 TRADENEST Team

---

**Built with ❤️ to demonstrate production‑grade Full‑Stack + Cloud + DevOps + Security engineering.**  
*Star ⭐ the repo if you find it useful!*