# Infrastructure Architecture (AWS + Kubernetes)

```mermaid
flowchart TB
    subgraph DNS["DNS & Edge"]
        R53[Route 53] --> ACM[ACM SSL Cert]
        ACM --> CF[CloudFront CDN]
        CF --> WAF[AWS WAF Rate‑limit / Geo‑block]
    end

    subgraph VPC["Custom VPC (10.0.0.0/16)"]
        subgraph Public["Public Subnets (AZ‑a, AZ‑b, AZ‑c)"]
            ALB[Application Load Balancer\n(TLS termination)]
            NAT[NAT Gateways]
        end

        subgraph Private["Private Subnets (AZ‑a, AZ‑b, AZ‑c)"]
            EKS[EKS Control Plane]
            NG[Managed Node Groups\n(t3.medium → auto‑scale)]
        end

        subgraph Data["Data Subnets"]
            RDS[(RDS PostgreSQL Multi‑AZ)]
            ElastiCache[(ElastiCache Redis Cluster)]
        end

        subgraph Storage["Object Storage"]
            S3Prod[S3 Bucket – product‑images]
            S3Inv[S3 Bucket – invoices]
            S3Docs[S3 Bucket – seller‑docs]
        end
    end

    subgraph Secrets["Secrets Management"]
        SM[Secrets Manager\n(DB pwd, JWT secret, Razorpay keys)]
    end

    subgraph Observability["Observability Stack"]
        CW[CloudWatch Logs & Metrics]
        Prom[Prometheus (EC2 / Fargate)]
        Grafana[Grafana (ECS Fargate)]
        Loki[Loki (Logs)]
        AlertMgr[Alertmanager → SNS]
    end

    subgraph CI_CD["CI / CD"]
        GH[GitHub Actions]
        Jenkins[Jenkins (on EC2 / EKS pod)]
        ArgoCD[ArgoCD (GitOps)]
    end

    CF --> ALB
    ALB --> NG
    NG --> EKS
    EKS --> RDS
    EKS --> ElastiCache
    EKS --> S3Prod
    EKS --> S3Inv
    EKS --> S3Docs
    EKS --> SM
    EKS --> CW
    Prom --> Grafana
    Loki --> Grafana
    AlertMgr --> CW
    GH --> Jenkins --> ArgoCD --> EKS
```

## Key AWS Resources (Terraform modules)

| Module | Purpose | Important Outputs |
|--------|---------|-------------------|
| `vpc` | 3‑AZ VPC, public + private + data subnets, NAT, IGW | `vpc_id`, `private_subnet_ids` |
| `eks` | EKS cluster, managed node‑group, IRSA roles | `cluster_endpoint`, `cluster_arn` |
| `rds` | PostgreSQL 15, Multi‑AZ, Parameter Group, Secrets Manager integration | `db_endpoint`, `db_secret_arn` |
| `elasticache` | Redis 7 cluster, TLS, auth via Secrets Manager | `redis_endpoint` |
| `s3` | Three buckets with lifecycle, versioning, block public access | `bucket_names` |
| `alb` | ALB with HTTPS listener, WAF ACL, target group → EKS node‑group | `alb_dns` |
| `cloudfront` | CDN in front of ALB, custom domain, ACM cert | `distribution_id` |
| `secrets` | Centralised secret store, rotation lambda for JWT | `secret_arns` |
| `monitoring` | CloudWatch log groups, Prometheus EC2, Grafana ECS, Loki S3 | `prometheus_url`, `grafana_url` |
| `iam` | Least‑privilege roles for EKS pods (IRSA), Jenkins, ArgoCD | `role_arns` |

> All modules live under `infra/terraform/modules/`. Root `main.tf` composes them for `dev`, `staging`, `prod` workspaces.