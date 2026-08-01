# Contributing to TRADENEST

> **Welcome!** 🎉  
> This guide helps you set up a local development environment, understand the codebase, and submit high‑quality pull requests.

---

## 📦 Repository Layout (Monorepo)

```
tradenest/
├─ apps/
│  ├─ frontend/          # React + Vite PWA
│  └─ backend/
│     ├─ auth/
│     ├─ catalog/
│     ├─ order/
│     ├─ payment/
│     ├─ ai/
│     ├─ notification/
│     └─ gateway/
├─ libs/
│  ├─ common/            # Shared DTOs, enums, utils (Zod)
│  └─ auth/              # JWT, RBAC, rate‑limit middleware
├─ infra/
│  ├─ terraform/         # AWS (EKS, RDS, ElastiCache, S3, …)
│  ├─ helm/              # Umbrella chart + microservice lib chart
│  ├─ argocd/            # ArgoCD Applications
│  ├─ monitoring/        # Prometheus, Grafana, Loki, Alertmanager
│  ├─ security/          # NetworkPolicy, Kyverno, SealedSecrets, WAF, TLS
│  └─ docker/            # docker‑compose overrides (staging/prod)
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  ├─ contract/
│  ├─ e2e/
│  ├─ load/
│  └─ chaos/
├─ scripts/              # Helper shell / PowerShell scripts
├─ docs/                 # Architecture, API, Guides, Runbooks
├─ .github/workflows/    # CI / CD pipelines
├─ jenkins/              # Declarative pipeline + shared lib
├─ docker-compose.yml    # Local dev stack
├─ package.json          # npm workspaces root
└─ README.md
```

---

## 🛠️ Local Development Setup

### 1️⃣ Prerequisites
| Tool | Version |
|------|---------|
| Node.js | 20.x |
| npm | 10.x |
| Docker & Docker Compose | 24+ |
| kubectl | 1.28+ |
| helm | 3.12+ |
| tilt / skaffold (optional) | – |

### 2️⃣ Clone & Install
```bash
git clone https://github.com/your-org/tradenest.git
cd tradenest
cp .env.example .env          # edit secrets if needed
npm ci                        # installs all workspaces
```

### 3️⃣ Spin Up Local Stack
```bash
# Starts Postgres, Redis, MinIO, Mailhog + all backend services (hot‑reload)
npm run dev        # = docker-compose up --build
```
Services become available at:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:4000 |
| Auth | http://localhost:4001 |
| Catalog | http://localhost:4002 |
| Order | http://localhost:4003 |
| Payment | http://localhost:4004 |
| AI | http://localhost:4005 |
| Notification | http://localhost:4006 |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |
| Mailhog UI | http://localhost:8025 |

### 4️⃣ Database Migration & Seed
```bash
npm run db:migrate   # runs Prisma migrate against local Postgres
npm run db:seed      # creates super‑admin, test users, sample products
```

### 5️⃣ Run Tests
```bash
npm run test:unit          # vitest
npm run test:integration   # testcontainers
npm run test:contract      # Pact
npm run test:e2e           # Cypress (needs dev stack up)
npm run test:load          # k6 (targets local gateway)
```

---

## 🧭 Coding Standards

| Area | Standard |
|------|----------|
| **Language** | TypeScript (strict) for all backend & frontend |
| **Linting** | ESLint (`npm run lint`) – Airbnb + Prettier |
| **Formatting** | Prettier (`npm run format`) |
| **Commits** | Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`) – enforced by `commitlint` |
| **Branch naming** | `<type>/<short-desc>` e.g. `feat/add-wishlist-toggle` |
| **PR title** | Same as commit convention |
| **Tests** | Unit ≥ 80 % lines, integration for DB, contract for public APIs |
| **Documentation** | Update `docs/` when API or architecture changes |

---

## 🔀 Git Workflow

1. **Fork** the repo (or use a feature branch in the main repo).  
2. Create branch: `git checkout -b feat/my-feature`.  
3. Implement + **write tests**.  
4. Run `npm run lint && npm run test:unit`.  
5. Commit with conventional message: `git commit -m "feat: add wishlist toggle"`.  
6. Push & open PR against `develop`.  
6. CI runs (lint → unit → integration → contract → build → security‑scan).  
7. Review → **Approve** → **Squash‑merge** into `develop`.  
8. `develop` auto‑deploys to **staging** via GitHub Actions.  
9. Release: tag `vX.Y.Z` on `main` → CD pipeline deploys to **production**.

---

## 📦 Adding a New Microservice

1. `mkdir apps/backend/<name>`  
2. Copy `apps/backend/auth` as template (package.json, tsconfig, Dockerfile, prisma).  
3. Add Prisma models to **root** `prisma/schema.prisma` (single source of truth).  
4. Generate client: `npm run db:generate`.  
5. Implement routes, services, guards using `@tradenest/common` & `@tradenest/auth`.  
5. Add Helm dependency in `infra/helm/tradenest/Chart.yaml` (alias `<name>`).  
6. Add ServiceMonitor in `infra/monitoring/servicemonitors/servicemonitors.yaml`.  
7. Add NetworkPolicy in `infra/security/networkpolicies/`.  
8. Update `docker-compose.yml` with new service (dev).  
9. Document API in `docs/api/reference.md` (or extend OpenAPI).  

---

## 🐳 Docker Images

* **Multi‑arch** (amd64/arm64) built via `docker buildx` in CI.  
* Tag scheme: `ghcr.io/tradenest/<service>:<git‑sha>` + `latest`.  
* Base images: `node:20-alpine` (builder) → `node:20-alpine` (runner) with `dumb-init`.  
* Non‑root user (`uid=1001`), read‑only rootfs, dropped capabilities.

---

## 🔐 Secrets Management

* **Never** commit real secrets.  
* Local dev – `.env` (git‑ignored).  
* Staging/Prod – **AWS Secrets Manager** → External Secrets Operator → K8s `Secret`.  
* SealedSecrets for GitOps‑safe encrypted secrets (optional).

---

## 📚 Documentation Updates

* Architecture diagrams → `docs/architecture/` (Mermaid).  
* API changes → `docs/api/reference.md` + `docs/api/openapi.yaml`.  
* New runbook → `docs/runbooks/` + link in `docs/runbooks/index.md`.  
* Deployment steps → `docs/guides/deployment-guide.md`.

---

## 🙋 Getting Help

* **Slack** – `#tradenest-dev` (invite via maintainer).  
* **GitHub Discussions** – for design proposals.  
* **Issues** – bug reports, feature requests (use templates).

---

## 📜 License

MIT – see `LICENSE`.  
Contributions are welcome under the same license.

---

*Generated as part of Phase 12 – Documentation & Resume‑Ready Assets.*