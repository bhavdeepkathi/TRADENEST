# CI / CD Pipeline (GitHub → Jenkins → ArgoCD → EKS)

```mermaid
flowchart LR
    Dev[Developer] -->|git push| GH[GitHub\n(branch → PR)]
    GH -->|PR opened| GHA[GitHub Actions]
    GHA -->|lint, unit, contract| Sonar[SonarCloud]
    GHA -->|build docker| DockerBuild[docker buildx]
    DockerBuild -->|push| GHCR[(GHCR / ECR)]
    GH -->|merge to main| Jenkins[Jenkins Pipeline]
    Jenkins -->|stage: integration test| IntTest[Integration Tests\n(Testcontainers)]
    Jenkins -->|stage: helm lint| HelmLint[helm lint]
    Jenkins -->|stage: helm package| HelmPkg[helm package]
    Jenkins -->|push chart| ChartRepo[(ChartMuseum / OCI)]
    Jenkins -->|trigger| ArgoCD[ArgoCD\nGitOps]
    ArgoCD -->|sync| EKS[EKS Cluster]
    EKS -->|rollout| Pods[Pods (Deployment)]
    Pods -->|health| Prom[Prometheus]
    Prom -->|metrics| Grafana[Grafana Dashboards]
    Pods -->|logs| Loki[Loki]
    Loki -->|alerts| AlertMgr[Alertmanager → SNS / Slack]
```

## Pipeline Stages (Jenkinsfile – declarative)

```groovy
pipeline {
  agent { label 'docker' }
  environment {
    REGISTRY   = 'ghcr.io/tradenest'
    IMAGE_TAG  = "${GIT_COMMIT.short()}"
    CHART_VER  = "0.1.${BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Node Setup') {
      steps { sh 'nvm install && npm ci' }
    }
    stage('Lint & Unit') {
      steps { sh 'npm run lint && npm run test:unit' }
    }
    stage('Contract Test') {
      steps { sh 'npm run test:contract' } // Pact / Schemathesis
    }
    stage('Docker Build') {
      steps {
        script {
          docker.build("${REGISTRY}/frontend:${IMAGE_TAG}", '-f apps/frontend/Dockerfile .')
          docker.build("${REGISTRY}/auth:${IMAGE_TAG}",      '-f apps/backend/auth/Dockerfile .')
          // repeat for catalog, order, payment, ai, notification
        }
      }
    }
    stage('Push Images') {
      steps { sh 'docker push --all-tags ${REGISTRY}' }
    }
    stage('Helm Lint & Package') {
      steps {
        dir('k8s/helm/tradenest') {
          sh 'helm dependency update'
          sh 'helm lint .'
          sh "helm package . --app-version ${IMAGE_TAG} --version ${CHART_VER}"
        }
      }
    }
    stage('Publish Chart') {
      steps {
        sh 'helm push tradenest-${CHART_VER}.tgz oci://ghcr.io/tradenest/charts'
      }
    }
    stage('ArgoCD Sync') {
      steps {
        sh '''
          argocd app set tradenest --parameter image.tag=${IMAGE_TAG}
          argocd app sync tradenest --prune --auto-prune
        '''
      }
    }
    stage('Smoke Test') {
      steps { sh 'npm run test:smoke -- --env=staging' }
    }
  }
  post {
    always { archiveArtifacts artifacts: 'k8s/helm/tradenest/*.tgz', fingerprint: true }
    failure { slackSend channel: '#deploy-alerts', message: "❌ Build ${BUILD_NUMBER} failed" }
    success { slackSend channel: '#deploy-alerts', message: "✅ Build ${BUILD_NUMBER} deployed" }
  }
}
```

## GitHub Actions (`.github/workflows/ci.yml`) – fast feedback

```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]
jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '20', cache: 'npm'}
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:contract
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env: {SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}}
```

## ArgoCD Application (GitOps)

```yaml
# k8s/argocd/tradenest-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: tradenest
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourorg/tradenest.git
    targetRevision: HEAD
    path: k8s/helm/tradenest
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: tradenest
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

> **Result:** Every merged PR is automatically built, scanned, containerised, chart‑published, and GitOps‑synced to the EKS cluster with zero‑downtime rolling updates.