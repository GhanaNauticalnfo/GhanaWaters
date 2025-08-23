# Code Organization Guide

This document provides a comprehensive overview of the Ghana Waters codebase organization, architecture, and structure.

## Project Overview

Ghana Waters is an Nx monorepo containing multiple integrated applications for maritime tracking and management. The repository uses a feature-based organization with shared libraries and clear separation of concerns.

### Repository Structure

```
ghanawaters/
├── apps/                    # Applications
│   ├── admin/              # Admin dashboard (Angular 19)
│   ├── api/                # Backend API (NestJS 10)
│   └── frontend/           # Public frontend (Angular 19)
├── libs/                   # Shared libraries
│   ├── shared/             # Shared utilities
│   ├── shared-map/         # MapLibre components
│   └── shared-models/      # TypeScript models
├── docker/                 # Container configurations
│   ├── local/              # Local development
│   └── config/             # Configuration files
├── k8s/                    # Kubernetes manifests
│   ├── base/               # Base configurations
│   └── overlays/           # Environment-specific configs
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## Applications

### API Application (`apps/api/`)

**Technology Stack**: NestJS 10, TypeORM, PostgreSQL with PostGIS

**Architecture**: Modular structure following NestJS conventions

```
apps/api/src/app/
├── app.module.ts           # Main application module
├── root.controller.ts      # Root route handler
├── auth/                   # Authentication module
├── database/               # Database configuration
├── vessels/                # Vessel management
│   ├── device/             # Device authentication
│   ├── tracking/           # Position tracking
│   ├── type/               # Vessel types
│   ├── websockets/         # WebSocket integration
│   └── dto/                # Data transfer objects
├── routes/                 # Navigation routes
├── kml-dataset/            # KML data management
├── landing-sites/          # Landing site management
├── settings/               # Application settings
├── sync/                   # Data synchronization
└── migrations/             # Database migrations
```

**Key Patterns**:
- Each module follows NestJS structure: controller, service, entity, DTOs
- TypeORM entities with PostGIS geography types
- JWT authentication with Keycloak integration
- WebSocket service for real-time vessel tracking
- Comprehensive DTO pattern for API responses

### Admin Application (`apps/admin/`)

**Technology Stack**: Angular 19, PrimeNG, Standalone Components

**Architecture**: Feature-based organization with shared core services

```
apps/admin/src/app/
├── app.config.ts           # Application configuration
├── app.routes.ts           # Route definitions
├── core/                   # Core services and guards
│   ├── auth/               # Keycloak authentication
│   ├── guards/             # Route guards
│   └── services/           # Core application services
├── features/               # Feature modules
│   ├── vessels/            # Vessel management
│   ├── routes/             # Route management
│   ├── kml/                # KML dataset management
│   ├── landing-sites/      # Landing site management
│   ├── settings/           # Application settings
│   ├── live/               # Live tracking dashboard
│   └── home/               # Dashboard home
└── shared/                 # Shared components and utilities
```

**Feature Module Structure**:
Each feature follows a consistent organization:
```
features/[feature-name]/
├── components/             # Feature components
├── services/               # Feature-specific services
├── guards/                 # Feature guards
└── models/                 # Local models (if needed)
```

### Frontend Application (`apps/frontend/`)

**Technology Stack**: Angular 19, MapLibre GL, Tailwind CSS

**Architecture**: Public-facing map interface with minimal structure

```
apps/frontend/src/app/
├── app.config.ts           # Application configuration
├── app.routes.ts           # Route definitions
├── components/             # Application components
└── services/               # Application services
```

## Shared Libraries

### Shared Models Library (`libs/shared-models/`)

**Purpose**: Type definitions and interfaces shared across applications

**Organization**:
```
libs/shared-models/src/lib/
├── vessel.model.ts         # Vessel interfaces
├── vessel-type.model.ts    # Vessel type definitions
├── vessel-telemetry.model.ts # Tracking data models
├── route.model.ts          # Navigation route models
├── kml-dataset.model.ts    # KML data models
├── landing-site.model.ts   # Landing site models
├── device.model.ts         # Device authentication models
├── sync.model.ts           # Synchronization models
├── settings.model.ts       # Settings models
├── geo-point.model.ts      # Geographic data models
└── websocket-events.model.ts # WebSocket event types
```

**Usage Pattern**:
- Import using workspace alias: `@ghanawaters/shared-models`
- API DTOs extend shared interfaces
- Ensures type consistency across applications

### Shared Map Library (`libs/shared-map/`)

**Purpose**: MapLibre components and map-related services

**Organization**:
```
libs/shared-map/src/lib/
├── components/             # Map components
├── core/                   # Core map services
├── layers/                 # Layer management services
├── models/                 # Map-specific models
└── styles/                 # Map styling configurations
```

### Shared Utilities Library (`libs/shared/`)

**Purpose**: Common utilities and helper functions

**Organization**:
```
libs/shared/src/lib/
├── utils/                  # Utility functions
├── constants/              # Application constants
└── pipes/                  # Shared Angular pipes
```

## Infrastructure Organization

### Docker Configuration (`docker/`)

**Local Development**:
```
docker/local/
├── docker-compose.yml      # Main compose file
├── postgres/               # PostgreSQL configuration
├── keycloak/               # Keycloak setup and realms
```

### Kubernetes Manifests (`k8s/`)

**Organization**: Kustomize-based configuration management

```
k8s/
├── base/                   # Base Kubernetes resources
│   ├── admin/              # Admin app manifests
│   ├── api/                # API app manifests
│   ├── frontend/           # Frontend app manifests
│   ├── database/           # Database manifests
│   ├── keycloak/           # Keycloak manifests
│   └── jobs/               # Job definitions
└── overlays/               # Environment-specific configurations
    ├── dev/                # Development environment
    ├── test/               # Test environment
    └── prod/               # Production environment
```

**Pattern**: Base configurations with environment-specific patches

## Database Organization

### Entity Structure

**Location**: `apps/api/src/app/[module]/[entity].entity.ts`

**Key Entities**:
- `Vessel`: Main vessel information
- `TrackingPoint`: GPS tracking data with PostGIS geography
- `VesselType`: Vessel classification
- `Route`: Navigation routes with waypoints
- `DeviceToken`: Device authentication
- `KmlDataset`: KML file metadata
- `LandingSite`: Landing site locations
- `Settings`: Application configuration

### Migration Management

**Location**: `apps/api/src/migrations/`

**Naming Convention**: `[timestamp]-[description].ts`

**Pattern**:
- Schema changes in migration files
- Initial data seeding included
- TypeORM CLI integration for generation

## Testing Structure

### Test File Organization

**Convention**: Tests are co-located with source files using `.spec.ts` suffix

**API Tests**:
```
apps/api/src/app/[module]/
├── [component].service.spec.ts
├── [component].controller.spec.ts
└── dto/[dto].spec.ts
```

**Frontend Tests**:
```
apps/admin/src/app/features/[feature]/
└── components/[component].spec.ts
```

### Test Categories

- **Unit Tests**: Service and component logic
- **Integration Tests**: Controller and service integration
- **DTO Validation Tests**: Input/output validation
- **E2E Tests**: End-to-end application flows

## Build System Organization

### Nx Configuration

**Root Configuration**: `nx.json` defines build targets and caching

**Project Configuration**: Each app has `project.json` with specific build settings

**Build Targets**:
- `build`: Production build
- `serve`: Development server
- `test`: Unit tests
- `lint`: Code quality checks

### TypeScript Configuration

**Base Configuration**: `tsconfig.base.json` with workspace path mappings

**App-Specific**: Each app extends base configuration

**Path Mappings**:
```json
{
  "@ghanawaters/shared-models": ["libs/shared-models/src/index.ts"],
  "@ghanawaters/shared-map": ["libs/shared-map/src/index.ts"],
  "@ghanawaters/shared": ["libs/shared/src/index.ts"]
}
```

## Development Conventions

### Module Organization

1. **Feature-Based Structure**: Related functionality grouped together
2. **Barrel Exports**: Each library exports through `index.ts`
3. **Consistent Naming**: Services, controllers, and components follow naming conventions
4. **Separation of Concerns**: Clear boundaries between layers

### Code Patterns

1. **DTO Pattern**: Separate input and response DTOs
2. **Service Layer**: Business logic in services
3. **Entity Transformation**: Entities have `toResponseDto()` methods
4. **Guard Usage**: Authentication and authorization guards
5. **Dependency Injection**: NestJS and Angular DI patterns

### File Naming

- **Components**: `[name].component.ts`
- **Services**: `[name].service.ts`
- **Controllers**: `[name].controller.ts`
- **Entities**: `[name].entity.ts`
- **DTOs**: `[name]-[type].dto.ts`
- **Models**: `[name].model.ts`

## Cross-Cutting Concerns

### Authentication

- **Keycloak Integration**: OAuth2/OIDC with PKCE
- **JWT Validation**: API endpoints protected by JWT guards
- **Role-Based Access**: Admin and viewer roles
- **Device Authentication**: Token-based device access

### Data Synchronization

- **Offline-First**: Mobile app sync capability
- **Incremental Sync**: Change tracking with `sync_log` table
- **Conflict Resolution**: Last-write-wins strategy

### Real-Time Features

- **WebSocket Integration**: Real-time vessel position updates
- **WebSocket Events**: Live dashboard updates
- **Event-Driven Architecture**: Pub/sub patterns for notifications

## Related Documentation

- [Style Guide](ghanawaters-styleguide.md) - Coding standards and patterns
- [Angular Best Practices](angular-bestpractices.md) - Angular-specific guidelines
- [Keycloak Configuration](keycloak.md) - Authentication setup
- [ArgoCD Deployment](argocd.md) - Kubernetes deployment process

---

This organization supports scalability, maintainability, and clear separation of concerns across the Ghana Waters platform.