# Keycloak Identity Management

## Overview

Single Keycloak instance deployed in Kubernetes serves identity management for all Ghana Waters environments.

## Deployment Details

- **Kubernetes Namespace**: `ghanawaters-keycloak`
- **Instance**: Single Keycloak deployment
- **Database**: PostgreSQL for persistence
- **Management**: ArgoCD GitOps deployment

## Realms

- `ghanawaters-dev` - Development environment
- `ghanawaters-test` - Test environment  
- `ghanawaters-prod` - Production environment
- `ghanawaters` - Local development (only local)
- `master` - Keycloak administration realm

## Access

- **URL**: https://keycloak.ghananautical.info
- **Admin Console**: https://keycloak.ghananautical.info/admin

## Master Realm Admin Credentials

Permanent admin user:
- Username: `superadmin`
- Password: Retrieved from secret below

## Administration

### Access Admin Console
1. Navigate to https://keycloak.ghananautical.info/admin
2. Login with username 'superadmin' and password from command below
3. Select target realm from dropdown

### Retrieve Admin Password
```bash
kubectl get secret keycloak-admin-secret -n ghanawaters-keycloak -o jsonpath='{.data.KEYCLOAK_ADMIN_PASSWORD}' | base64 -d
```

## Roles

There are currently two roles in the system

**Admin Role:**
- Full access to all Ghana Waters features

**Viewer Role:**
- Read-only access to Ghana Waters

## User Management

### Adding New Users

1. **Login to Admin Console**
   - Navigate to https://keycloak.ghananautical.info/admin
   - Login with superadmin credentials

2. **Select Target Realm**
   - Use realm dropdown in top-left corner
   - Select appropriate environment:
     - `ghanawaters-dev` for development
     - `ghanawaters-test` for testing
     - `ghanawaters-prod` for production

3. **Create User**
   - Click "Users" in left sidebar
   - Click "Add user" button
   - Fill required fields:
     - Username (required)
     - Email (for identification only - see Email Configuration below)
     - First Name / Last Name (recommended)
   - Click "Save"

4. **Set Password**
   - Go to "Credentials" tab
   - Click "Set password"
   - Enter secure password
   - Set "Temporary" to OFF for permanent password
   - Click "Set password"

5. **Assign Roles**
   - Go to "Role mappings" tab
   - Click "Assign role"
   - Select from available roles:
     - `admin` - Full system access
     - `viewer` - Read-only access
   - Click "Assign"

### Common Tasks
- User account management per realm
- Role assignment and permissions
- Manual password reset (no email functionality)
- Client configuration for OAuth2/OIDC
- Monitoring via Kubernetes logs

## Email Configuration

**Current Status:** Email/SMTP is not configured for this Keycloak instance.

**Impact:**
- Users cannot reset passwords via email
- No email verification for new accounts
- Administrators must manually set/reset all passwords
- Email field in user profiles is for identification only

**Password Management:**
- All password changes must be done through admin console
- Users cannot self-service password resets

## Security

- TLS certificates managed by cert-manager
- Credentials stored in Kubernetes secrets
- Database connection secured with dedicated PostgreSQL instance