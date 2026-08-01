# TRADENEST Deployment Guide

## Prerequisites

| Tool | Version |
|------|---------|
| AWS CLI | ≥ 2.13 |
| kubectl | ≥ 1.28 |
| helm | ≥ 3.12 |
| Terraform | ≥ 1.6 |
| ArgoCD CLI | ≥ 2.9 |
| Docker / Buildx | ≥ 24.0 |
| Node.js | 20.x (for local dev) |

AWS credentials with permissions for **EKS, RDS, ElastiCache, S3, Route53, ACM, SecretsManager, IAM, CloudWatch**.

---

## 1️⃣ Bootstrap AWS Infrastructure (Terraform)

```bash
cd infra/terraform/environments/prod   # or staging
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Outputs you’ll need:

* `eks_cluster_name`
* `rds_endpoint`
* `elasticache_endpoint`
* `s3_bucket_names`
* `alb_dns_name`
* `hosted_zone_id`

> **Tip:** Store outputs in GitHub Secrets (`AWS_*`) for CI.

---

## 2️⃣ Configure `kubectl` & Install Cluster Add‑ons

```bash
aws eks update-kubeconfig --name <cluster-name> --region ap-south-1
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.0/deploy/static/provider/aws/deploy.yaml
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/download/v0.9.0/external-secrets.yaml
kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.11.0/install.yaml
```

Verify:

```bash
kubectl get pods -n cert-manager
kubectl get pods -n ingress-nginx
```

---

## 3️⃣ Secrets – External Secrets Operator

1. Create **AWS Secrets Manager** entries (path `tradenest/prod/`):

```
tradenest/prod/database-url
tradenest/prod/redis-url
tradenest/prod/jwt-secret
tradenest/prod/jwt-refresh-secret
tradenest/prod/razorpay-key-id
tradenest/prod/razorpay-key-secret
tradenest/prod/stripe-secret-key
tradenest/prod/smtp-host
tradenest/prod/smtp-port
tradenest/prod/smtp-user
tradenest/prod/smtp-pass
```

2. Deploy `ClusterSecretStore` + `ExternalSecret` (already in `infra/helm/external-secrets`):

```bash
helm upgrade --install external-secrets ./infra/helm/external-secrets -n external-secrets-system --create-namespace
```

---

## 4️⃣ TLS – cert‑manager + Let’s Encrypt

```bash
kubectl apply -f infra/security/tls/clusterissuers.yaml
# Verify issuers ready
kubectl get clusterissuer
```

Certificates are defined in the Helm chart (`values.yaml` → `ingress.tls`). They will be auto‑created on first Ingress deploy.

---

## 5️⃣ Deploy Platform via Helm (GitOps – ArgoCD)

### Option A – ArgoCD (recommended)

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose UI (port‑forward or ingress)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Create Applications:

```bash
kubectl apply -f infra/argocd/overlays/prod/application.yaml
# or staging
kubectl apply -f infra/argocd/overlays/staging/application.yaml
```

ArgoCD will:

* Pull `infra/helm/tradenest` chart
* Render with `values-prod.yaml` / `values-staging.yaml`
* Sync all Deployments, Services, Ingresses, ConfigMaps, Secrets, HPA, PDB, NetworkPolicies

### Option B – Manual Helm (one‑off)

```bash
helm dependency update infra/helm/tradenest
helm upgrade --install tradenest ./infra/helm/tradenest \
  -n tradenest-prod --create-namespace \
  -f infra/helm/tradenest/values.yaml \
  -f infra/helm/tradenest/values-prod.yaml
```

---

## 6️⃣ Verify Deployment

```bash
# All pods Running
kubectl get pods -n tradenest-prod

# Ingress addresses
kubectl get ingress -n tradenest-prod

# Health endpoints
curl -k https://api.tradenest.io/health
curl -k https://tradenest.io/health
```

Expected JSON:

```json
{ "status":"healthy","services":{"database":"healthy","redis":"healthy"} }
```

---

## 7️⃣ Post‑Deploy Smoke Tests

```bash
# 1. Auth flow
TOKEN=$(curl -s -X POST https://api.tradenest.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@tradenest.local","password":"Customer@123"}' | jq -r .accessToken)

# 2. List products
curl -H "Authorization: Bearer $TOKEN" https://api.tradenest.io/api/products | jq .

# 3. Add to cart → checkout → payment intent
# (use provided test credentials)
```

All should return **200** and valid payloads.

---

## 8️⃣ Rollback Procedure

```bash
# Helm rollback
helm rollback tradenest 1 -n tradenest-prod

# ArgoCD rollback (UI → History → Rollback) or CLI
argocd app rollback tradenest-prod <revision>
```

---

## 9️⃣ Scaling & Upgrades

* **Horizontal Pod Autoscaler** already defined (CPU 70 %).
* **Cluster Autoscaler** (managed node‑group) scales nodes.
* **Image tag** update → change `values-prod.yaml` `image.tag` → ArgoCD auto‑sync (or `helm upgrade`).

---

## 🔟 Clean‑up (tear down)

```bash
# Delete ArgoCD apps
kubectl delete -f infra/argocd/overlays/prod/application.yaml

# Delete Helm release
helm uninstall tradenest -n tradenest-prod

# Destroy Terraform
cd infra/terraform/environments/prod
terraform destroy
```

---

## 📌 Checklist for Production Go‑Live

| ✅ Item | Verified |
|--------|----------|
| DNS records (`api.tradenest.io`, `tradenest.io`) → ALB / CloudFront |
| ACM certificates issued & attached |
| WAF rules attached to ALB |
| Secrets present in Secrets Manager |
| ExternalSecrets synced (`kubectl get externalsecret -n tradenest-prod`) |
| NetworkPolicies applied (`kubectl get netpol -n tradenest-prod`) |
| Kyverno policies active (`kubectl get clusterpolicy`) |
| Prometheus scraping (`/metrics` on each pod) |
| Grafana dashboards visible |
| Alertmanager routing to Slack |
| Loki receiving logs (`kubectl logs -n monitoring -l app=loki`) |
| Load test passed (k6, p95 < 1 s) |
| Chaos experiment run without data loss |
| Runbooks documented & stored in `docs/runbooks/` |

---

*Generated as part of Phase 12 – Documentation & Resume‑Ready Assets.*