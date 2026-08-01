# TRADENEST Runbooks

> **Purpose** – Step‑by‑step incident response for the most common production alerts.  
> Each runbook follows: **Detect → Diagnose → Mitigate → Resolve → Post‑mortem**.

---

## 1️⃣ Service Down (Prometheus `ServiceDown`)

**Alert**: `up{job=~"tradenest-.*"} == 0` for 1 min.

### Detect
* Alert fires in Alertmanager → Slack `#alerts-critical`.
* Grafana “Service Up” panel shows red.

### Diagnose
```bash
# 1. Which deployment?
kubectl get pods -n tradenest-prod -l app.kubernetes.io/name=<service> -o wide

# 2. Check pod status
kubectl describe pod <pod-name> -n tradenest-prod

# 3. Recent logs
kubectl logs <pod-name> -n tradenest-prod --tail=100 -f
```

Common causes:
| Cause | Fix |
|-------|-----|
| CrashLoopBackOff (OOM) | Increase `resources.limits.memory` in Helm values, re‑deploy |
| ImagePullBackOff | Verify image tag exists in GHCR, check `imagePullSecrets` |
| ConfigMap/Secret missing | Ensure ExternalSecret synced (`kubectl get externalsecret -n tradenest-prod`) |
| Database migration lock | `kubectl exec -it <pg-pod> -- pg_ctl promote` or clear `pg_advisory_lock` |

### Mitigate (quick)
* Scale replica count up: `kubectl scale deployment <service> --replicas=4 -n tradenest-prod`
* Rollback to previous image: `helm rollback tradenest 1 -n tradenest-prod` (or ArgoCD rollback)

### Resolve
* Apply permanent fix (code, config, resource limits).
* Deploy new image tag via Helm/ArgoCD.
* Verify `up` metric returns 1.

### Post‑mortem
* Document root cause in `docs/runbooks/postmortems/YYYYMMDD-service-down.md`.
* Update runbook if new failure mode discovered.

---

## 2️⃣ High Error Rate (`HighErrorRate`)

**Alert**: 5xx ratio > 5 % over 2 min.

### Detect
* Slack `#alerts-warning`.
* Grafana “Error Rate” panel spikes.

### Diagnose
```bash
# 1. Identify endpoint
kubectl logs -n tradenest-prod -l app.kubernetes.io/name=<service> --since=5m | grep -i "5.."

# 2. Check recent deployments
kubectl rollout history deployment/<service> -n tradenest-prod

# 3. DB errors?
kubectl exec -it <pg-pod> -- psql -U tradenest -c "SELECT * FROM pg_stat_activity WHERE state='active';"
```

Typical reasons:
* New code path throws unhandled exception → rollback.
* Downstream dependency (payment gateway) failing → enable circuit‑breaker / fallback.
* Database deadlock → check long‑running transactions.

### Mitigate
* Enable feature flag to disable problematic endpoint.
* Increase retry/timeout in gateway (`nginx.ingress.kubernetes.io/proxy-read-timeout`).
* Scale out pods to absorb load.

### Resolve
* Patch code, run unit/integration tests, deploy.
* If downstream, contact vendor / implement fallback.

---

## 3️⃣ High Latency (`HighLatency`)

**Alert**: p95 > 1 s for 5 min.

### Diagnose
```bash
# 1. Identify slow endpoint via Grafana “Latency p95” per service.
# 2. Check DB query plans
EXPLAIN ANALYZE SELECT ...;   # run in psql
# 3. Look for GC pauses (Node.js) – enable `--trace-gc` in pod env.
# 4. CPU saturation?
kubectl top pods -n tradenest-prod -l app.kubernetes.io/name=<service>
```

### Mitigate
* Add DB index (create migration).
* Enable query caching in Redis.
* Increase pod CPU limit / add replicas.

---

## 4️⃣ Pod OOM / CPU Throttling (`PodMemoryUsageHigh`, `PodCPUUsageHigh`)

### Diagnose
```bash
kubectl top pods -n tradenest-prod --containers
kubectl describe pod <pod> -n tradenest-prod | grep -A5 "Limits:"
```

### Mitigate
* Raise `resources.limits.memory` / `cpu` in Helm values.
* Add `resources.requests` to guarantee QoS.
* Enable Node.js `--max-old-space-size=<MB>` via `NODE_OPTIONS`.

---

## 5️⃣ Database Connectivity Issues

**Symptoms**: `connection refused`, `timeout`, `too many connections`.

### Diagnose
```bash
# From a pod
kubectl exec -it <any-pod> -n tradenest-prod -- pg_isready -h $DB_HOST -p 5432

# Check RDS metrics in CloudWatch (CPU, FreeableMemory, DBConnections)
```

### Mitigate
* Increase `max_connections` parameter group.
* Enable RDS Proxy (if not already).
* Ensure connection pool (`pgbouncer` sidecar) configured.

### Resolve
* Scale RDS instance class.
* Optimize long queries.

---

## 6️⃣ TLS / Certificate Expiry

**Alert**: cert‑manager `CertificateExpiringSoon` (30 days).

### Resolve
```bash
kubectl get certificate -n tradenest-prod
# Force renewal
kubectl delete certificate tradenest-tls -n tradenest-prod
# cert-manager will re‑issue
```

Verify new cert in ACM and Ingress.

---

## 7️⃣ Payment Webhook Failures

**Alert**: `PaymentWebhookFailure` (custom metric from payment service).

### Diagnose
```bash
kubectl logs -n tradenest-prod -l app.kubernetes.io/name=payment --since=10m | grep -i webhook
```

### Mitigate
* Verify provider status page (Razorpay/Stripe).
* Check signature verification secret matches.
* Replay failed webhook (payment service exposes `/payments/webhook/replay/:id`).

---

## 8️⃣ Chaos Experiment Gone Wrong

**Alert**: Any critical alert during scheduled LitmusChaos run.

### Immediate Action
```bash
kubectl delete chaosengine tradenest-chaos -n tradenest-prod
# Wait for pods to recover
kubectl get pods -n tradenest-prod -w
```

### Follow‑up
* Review experiment spec – reduce blast radius.
* Add `pause` between experiments.

---

## 📋 General Incident Checklist

| Step | Action |
|------|--------|
| 1 | Acknowledge in Slack (`/ack`). |
| 2 | Assign **Incident Commander** (IC). |
| 3 | Open incident channel (`#incident-<service>-<date>`). |
| 4 | Run relevant runbook. |
| 5 | Communicate status every 15 min. |
| 6 | Once resolved, close alert, post summary. |
| 7 | Schedule post‑mortem within 48 h. |
| 8 | Update runbooks / add new alerts. |

---

## 📂 Post‑mortem Template (`docs/runbooks/postmortems/YYYYMMDD-<title>.md`)

```markdown
# Post‑mortem: <Title>

**Date**: YYYY‑MM‑DD  
**Duration**: Xh Ym  
**Impact**: <e.g., 5 % checkout failures, 200 users affected>  
**Root Cause**: <concise>  
**Timeline**  
- HH:MM – Detection  
- HH:MM – Mitigation started  
- HH:MM – Resolution  

**Action Items**  
- [ ] Ticket #123 – Fix …  
- [ ] Ticket #124 – Add alert …  

**Lessons Learned** …
```

---

*Generated as part of Phase 12 – Documentation & Resume‑Ready Assets.*