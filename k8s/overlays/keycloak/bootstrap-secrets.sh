#!/bin/bash
#
# BOOTSTRAP SECRETS SCRIPT
# 
# This script is used ONLY for initial cluster bootstrapping.
# It creates the required Kubernetes secrets for Keycloak deployment.
# 
# WARNING: This script contains placeholder values and should NOT be used as-is.
# Generate secure passwords before running this script on a new cluster.
#
# Usage: 
#   1. Replace <GENERATE_SECURE_PASSWORD> with actual secure passwords
#   2. Run this script ONCE during initial cluster setup
#   3. After bootstrap, admin access is via 'superadmin' user created manually
#

echo "🚀 Bootstrapping Keycloak secrets for new cluster..."
echo "⚠️  WARNING: Ensure you've replaced placeholder passwords with secure values!"

# Create namespace if it doesn't exist
kubectl create namespace ghanawaters-keycloak --dry-run=client -o yaml | kubectl apply -f -

# Create PostgreSQL credentials for Keycloak
kubectl create secret generic keycloak-postgres-secret \
  --from-literal=POSTGRES_USER=keycloak \
  --from-literal=POSTGRES_PASSWORD='<GENERATE_SECURE_PASSWORD>' \
  --from-literal=POSTGRES_DB=keycloak \
  -n ghanawaters-keycloak \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Bootstrap secrets created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy Keycloak via ArgoCD"
echo "   2. Create 'superadmin' user manually in Keycloak admin console"
echo "   3. Remove/disable any temporary bootstrap admin users"
echo ""
echo "🔐 Admin access: https://keycloak.ghananautical.info/admin"
echo "👤 Admin user: superadmin (created manually after deployment)"