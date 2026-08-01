# High‑Level Architecture (HLA)

```mermaid
flowchart TB
    subgraph Client["Clients"]
        Web[Web App (React + Vite)]
        Mobile[Mobile PWA]
    end

    subgraph Edge["Edge & DNS"]
        CF[CloudFront CDN]
        WAF[AWS WAF]
        RL[Route 53]
    end

    subgraph Gateway["API Gateway / Ingress"]
        Nginx[Nginx Ingress (K8s)]
        ALB[AWS ALB]
    end

    subgraph Auth["Auth Service"]
        AuthSvc[Auth Micro‑service\n(Node + Express)]
        JWT[(JWT + Refresh Tokens)]
        RedisAuth[(Redis Token Store)]
    end

    subgraph Core["Core Business Services"]
        Catalog[Catalog Service]
        Order[Order Service]
        Payment[Payment Service]
        Inventory[Inventory Service]
        Notification[Notification Service]
        AI[AI Recommendation Service]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL (RDS))]
        Redis[(ElastiCache Redis)]
        S3[(S3 Buckets)]
    end

    subgraph Observability["Observability"]
        Prom[Prometheus]
        Grafana[Grafana]
        Loki[Loki]
        AlertMgr[Alertmanager]
        CW[CloudWatch]
    end

    subgraph CI/CD["CI / CD"]
        GH[GitHub Actions]
        Jenkins[Jenkins Pipeline]
        ArgoCD[ArgoCD / Flux]
    end

    Web --> CF
    Mobile --> CF
    CF --> WAF --> ALB --> Nginx
    Nginx --> AuthSvc
    Nginx --> Catalog
    Nginx --> Order
    Nginx --> Payment
    Nginx --> Inventory
    Nginx --> Notification
    Nginx --> AI

    AuthSvc --> JWT
    AuthSvc --> RedisAuth

    Catalog --> PG
    Catalog --> Redis
    Catalog --> S3
    Order --> PG
    Order --> Redis
    Payment --> PG
    Payment --> S3
    Inventory --> PG
    Notification --> PG
    Notification --> Redis
    AI --> PG
    AI --> Redis

    GH --> Jenkins --> ArgoCD --> Nginx
    Prom --> Grafana
    Loki --> Grafana
    AlertMgr --> CW
```