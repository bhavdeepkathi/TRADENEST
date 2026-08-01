# Security Threat Model (STRIDE) & Hardening Checklist

| Asset | Threat (STRIDE) | Likelihood | Impact | Mitigations (implemented) |
|-------|-----------------|------------|--------|----------------------------|
| **Auth Service** | Spoofing (credential stuffing) | High | High | Rate‑limit (10 req/min/IP), bcrypt 12, breach‑list check, MFA optional |
| | Tampering (JWT alg‑none) | Medium | Critical | `helmet()` + `jose` lib enforces RS256, short‑lived access (15 min) + rotating refresh (30 d) stored hashed in Redis |
| | Repudiation (audit) | Low | Medium | Immutable audit log (append‑only table, signed) |
| | Info Disclosure (tokens in logs) | Medium | High | Structured JSON logs, `mask-sensitive` middleware, no token in URL |
| | DoS (login flood) | High | Medium | CloudFront + WAF rate‑rules, CAPTCHA after 5 failures |
| | Elevation (role escalation) | Low | Critical | RBAC middleware, `requireRole([...])`, least‑priv IAM for pods |
| **Catalog / Product Images** | Tampering (malicious upload) | Medium | High | S3 pre‑signed PUT only, content‑type whitelist, ClamAV scan via Lambda |
| | Info Disclosure (private seller docs) | Low | High | Separate S3 bucket, bucket policies + IAM conditions (`s3:GetObject` only for owner) |
| **Order / Payment** | Spoofing (webhook replay) | Medium | Critical | Verify provider signatures (Razorpay `X‑Razorpay‑Signature`, Stripe `Stripe‑Signature`), idempotency keys |
| | Tampering (price manipulation) | Medium | Critical | Server‑side price recompute from catalog at checkout, immutable order snapshot |
| | Repudiation (refund fraud) | Low | High | Refund only via admin‑approved workflow, dual‑approval for >₹10k |
| **AI Service** | Model Poisoning (training data) | Low | Medium | Retrain nightly from immutable snapshot, data validation pipeline |
| | Info Disclosure (PII in embeddings) | Low | High | Pseudonymise user IDs, no raw PII stored in vector DB |
| **Kubernetes Cluster** | Spoofing (pod identity) | Medium | Critical | IRSA, PodSecurityPolicies (restricted), OPA Gatekeeper |
| | Tampering (config maps) | Low | High | SealedSecrets / ExternalSecrets operator, GitOps only |
| | DoS (resource exhaustion) | Medium | High | Resource quotas, LimitRanges, HPA + VPA, cluster autoscaler |
| **CI/CD** | Supply‑chain (malicious image) | Low | Critical | Cosign signing, SBOM (Syft), policy enforcement (Kyverno) |
| | Credential leakage | Medium | High | GitHub Actions secrets, Jenkins credentials store, no hard‑coded secrets |

## Hardening Checklist (run in every env)

```bash
# 1. Network
aws ec2 create-network-acl-entry ...  # deny all inbound except ALB SG
# 2. WAF
aws wafv2 create-web-acl --rules file://waf-rules.json
# 3. TLS
#   - ACM cert for *.tradenest.io, imported to ALB & CloudFront
#   - Enforce HSTS, CSP via Helmet + Nginx `add_header`
# 4. Secrets Rotation (lambda + EventBridge daily)
# 5. Runtime
kubectl apply -f k8s/policies/psp-restricted.yaml
kubectl apply -f k8s/policies/network-policies.yaml
# 6. Image signing
cosign sign --key env://COSIGN_PRIVATE_KEY ghcr.io/tradenest/auth:v1.2.3
# 7. Auditing
#   - Enable CloudTrail data events for S3, RDS, KMS
#   - Forward to Loki via Fluent Bit
```

## Security‑by‑Design Principles Used

1. **Zero Trust** – every service validates JWT + scopes; mTLS via Istio (optional)  
2. **Least Privilege** – IRSA roles per service, DB users per schema  
3. **Defence in Depth** – WAF → ALB → Nginx → App middleware → DB row‑level security  
4. **Secure Defaults** – Helmet, `cookie-parser` `httpOnly; secure; sameSite=lax`  
5. **Observability of Security** – Falco runtime alerts → Loki → Alertmanager → Slack/PagerDuty