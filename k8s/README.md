# Kubernetes Manifests for Ghana Waters

This directory contains Kubernetes manifests organized for ArgoCD deployment using Kustomize.

## Directory Structure

```
k8s/
├── base/                   # Base manifests (environment-agnostic)
│   ├── admin/             # Admin dashboard
│   ├── api/               # API service
│   ├── frontend/          # Frontend application
│   ├── database/          # PostgreSQL database
│   └── jobs/              # Migration jobs
├── overlays/              # Environment-specific overlays
│   ├── dev/               # Development environment
│   ├── test/              # Test environment
│   └── prod/              # Production environment
└── argocd-apps/           # ArgoCD Application definitions
```

## Usage

### Manual Deployment

Deploy to a specific environment using kubectl:

```bash
# Deploy to dev
kubectl apply -k k8s/overlays/dev

# Deploy to test
kubectl apply -k k8s/overlays/test

# Deploy to prod
kubectl apply -k k8s/overlays/prod
```

### ArgoCD Deployment

1. Update the repository URL in `argocd-apps/*.yaml` files
2. Apply ArgoCD applications:

```bash
kubectl apply -f k8s/argocd-apps/
```

### Running Migrations

Migrations should be run manually after deployment:

```bash
# For test environment
kubectl create job --from=cronjob/ghanawaters-api-migrations ghanawaters-api-migrations-$(date +%s) -n ghanawaters-test

# For prod environment
kubectl create job --from=cronjob/ghanawaters-api-migrations ghanawaters-api-migrations-$(date +%s) -n ghanawaters-prod
```

## Environment Differences

### Dev
- Uses `dev-latest` image tags
- 1 replica for all services
- 1Gi database storage
- NODE_ENV=development

### Test
- Uses `test-develop` image tags
- 1 replica for all services
- 1Gi database storage
- NODE_ENV=test

### Prod
- Uses `latest` image tags
- 1 replica for all services (scalable)
- 10Gi database storage
- NODE_ENV=production
- Manual sync policy in ArgoCD

## Prerequisites

- Kubernetes cluster with:
  - NGINX Ingress Controller
  - cert-manager for TLS certificates
  - Persistent volume provisioner
  - ArgoCD (optional)

## Secrets

Before a new deployment, create the following secrets:

```bash
# Database secret (all environments)
kubectl create secret generic ghanawaters-postgres-secret \
  --from-literal=POSTGRES_USER=ghanawaters_user \
  --from-literal=POSTGRES_PASSWORD=<password> \
  --from-literal=POSTGRES_DB=ghanawaters_db \
  --from-literal=DATABASE_URL=postgresql://ghanawaters_user:<password>@ghanawaters-postgres-service:5432/ghanawaters_db \
  -n <namespace>  # e.g., ghanawaters-dev, ghanawaters-test, ghanawaters-prod
```

## Updating Image Tags

Image tags are managed in the overlay kustomization.yaml files:

```yaml
images:
  - name: ghcr.io/ghananauticalnfo/ghanawaters-admin
    newTag: <new-tag>
```

For CI/CD integration, use:

```bash
cd k8s/overlays/test
kustomize edit set image ghcr.io/ghananauticalnfo/ghanawaters-api:test-$COMMIT_SHA
```