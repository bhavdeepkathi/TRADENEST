# Monorepo Folder Layout (Production‑Ready)

```
tradenest/                               ← repo root (C:\Users\Acer\TRADENEST)
├─ .github/
│   └─ workflows/
│       ├─ ci.yml                        # fast PR checks (lint, unit, contract)
│       └─ release.yml                   # tag → build → chart publish
├─ .husky/                               # git hooks (commitlint, lint‑staged)
├─ .vscode/                              # workspace settings, launch configs
├─ docs/
│   ├─ architecture/
│   │   ├─ high-level-architecture.md
│   │   ├─ infra-aws-k8s.md
│   │   ├─ cicd-pipeline.md
│   │   └─ security-threat-model.md
│   ├─ design/
│   │   ├─ auth-service-lld.md
│   │   └─ er-diagram-and-prisma.md
│   └─ api/
│       └─ openapi.yaml                  # single source of truth
├─ infra/
│   └─ terraform/
│       ├─ environments/
│       │   ├─ dev/
│       │   ├─ staging/
│       │   └─ prod/
│       └─ modules/
│           ├─ vpc/
│           ├─ eks/
│           ├─ rds/
│           ├─ elasticache/
│           ├─ s3/
│           ├─ alb/
│           ├─ cloudfront/
│           ├─ secrets/
│           ├─ monitoring/
│           └─ iam/
├─ k8s/
│   ├─ base/                             # kustomize base (namespace, CRDs)
│   ├─ overlays/
│   │   ├─ dev/
│   │   ├─ staging/
│   │   └─ prod/
│   ├─ helm/
│   │   └─ tradenest/                    # umbrella Helm chart
│   │       ├─ Chart.yaml
│   │       ├─ values.yaml
│   │       ├─ values-dev.yaml
│   │       ├─ values-staging.yaml
│   │       ├─ values-prod.yaml
│   │       ├─ templates/
│   │       │   ├─ deployment.yaml
│   │       │   ├─ service.yaml
│   │       │   ├─ ingress.yaml
│   │       │   ├─ hpa.yaml
│   │       │   ├─ configmap.yaml
│   │       │   └─ secret.yaml
│   │       └─ charts/                   # sub‑charts per micro‑service
│   │           ├─ auth/
│   │           ├─ catalog/
│   │           ├─ order/
│   │           ├─ payment/
│   │           ├─ ai/
│   │           └─ notification/
│   └─ argocd/
│       └─ tradenest-app.yaml
├─ jenkins/
│   ├─ Jenkinsfile                       # declarative pipeline (see cicd doc)
│   └─ shared-lib/                       # @Library('tradenest-shared') _
├─ apps/
│   ├─ frontend/                         # React + Vite + Tailwind PWA
│   │   ├─ public/
│   │   ├─ src/
│   │   │   ├─ app/                      # Redux store, routes, providers
│   │   │   ├─ features/                 # feature folders (auth, catalog, cart…)
│   │   │   ├─ components/               # shared UI primitives
│   │   │   ├─ hooks/
│   │   │   ├─ utils/
│   │   │   └─ styles/
│   │   ├─ index.html
│   │   ├─ vite.config.ts
│   │   ├─ tailwind.config.cjs
│   │   ├─ Dockerfile
│   │   └─ .dockerignore
│   └─ backend/
│       ├─ auth/
│       ├─ catalog/
│       ├─ order/
│       ├─ payment/
│       ├─ ai/
│       └─ notification/
│           Each service follows identical structure:
│           ├─ src/
│           │   ├─ main.ts               # bootstrap (Express + DI container)
│           │   ├─ config/               # env validation (zod)
│           │   ├─ modules/
│           │   │   └─ <domain>/
│           │   │       ├─ controller.ts
│           │   │       ├─ service.ts
│           │   │       ├─ repository.ts
│           │   │       ├─ dto/
│           │   │       ├─ entity.ts
│           │   │       └─ routes.ts
│           │   ├─ middlewares/
│           │   ├─ filters/
│           │   ├─ interceptors/
│           │   ├─ guards/
│           │   └─ utils/
│           ├─ test/
│           │   ├─ unit/
│           │   ├─ integration/
│           │   └─ e2e/
│           ├─ Dockerfile
│           ├─ .dockerignore
│           ├─ package.json
│           └─ tsconfig.json
├─ libs/                                 # shared TS/JS packages (published to npm/GHCR)
│   ├─ common/                           # DTOs, enums, errors, constants
│   ├─ auth-client/                      # typed Axios + token refresh logic
│   ├─ ui-components/                    # storybook‑ready React lib
│   └─ prisma-client/                    # generated PrismaClient (git‑ignored)
├─ scripts/
│   ├─ dev-up.sh                         # docker‑compose up --build
│   ├─ db-migrate.sh                     # npx prisma migrate deploy
│   ├─ seed.sh                           # npm run prisma:seed
│   └─ load-test.sh                      # k6 script
├─ docker-compose.yml                    # local stack (postgres, redis, minio, mailhog)
├─ .env.example
├─ .eslintrc.cjs
├─ .prettierrc
├─ commitlint.config.cjs
├─ package.json                          # root scripts (turbo / nx style)
├─ turbo.json                            # Turborepo pipeline (optional)
└─ README.md
```

## Rationale

| Layer | Why |
|-------|-----|
| **Monorepo** | Single source of truth, atomic cross‑service refactors, shared `libs/*` versioning |
| **`apps/frontend`** | Independent deployable (static assets → CloudFront) |
| **`apps/backend/<svc>`** | True micro‑services – own `package.json`, Dockerfile, test suite |
| **`libs/`** | Enforces DRY – DTOs, API client, UI kit versioned together |
| **`infra/terraform/modules`** | Reusable, environment‑agnostic IaC; `environments/*` only supply `tfvars` |
| **`k8s/helm/tradenest`** | Umbrella chart → one `helm upgrade --install` per env; sub‑charts keep service‑level values |
| **`k8s/overlays`** | Kustomize patches (replicas, resources, image tags) per env without duplicating templates |
| **`jenkins/Jenkinsfile`** | Centralised, version‑controlled pipeline; shared library for reusable steps |
| **`scripts/`** | One‑liner DX commands (`./scripts/dev-up.sh`) – no tribal knowledge |

> **Next Phase** – we will scaffold the **frontend** (`apps/frontend`) with Vite, Tailwind, Redux‑Toolkit, PWA, and a production‑grade component library. Let me know when you’re ready.