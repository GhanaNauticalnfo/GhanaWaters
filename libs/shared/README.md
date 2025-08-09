# Ghana Waters Shared Library

## Overview

The `@ghanawaters/shared` library provides reusable Angular components, pipes, services, and utilities for UI consistency across Ghana Waters frontend applications (Admin Dashboard and Public Frontend).

## Key Features

### Components
- **BoatIcon**: Standardized vessel icon component with customizable styling
- **SearchDropdown**: Reusable dropdown component with search functionality
- **ResourceList**: Generic list component for displaying and managing resources

### Pipes
- **TimeAgoPipe**: Converts timestamps to human-readable relative time ("2 hours ago")
- **VesselIdPipe**: Formats vessel IDs according to Ghana Maritime Authority standards

### Services
- **SettingsService**: Manages application settings and user preferences

### Utilities
- **VesselId Utilities**: Helper functions for vessel ID validation and formatting

## Usage

### Importing Components

```typescript
import { BoatIconComponent, SearchDropdownComponent } from '@ghanawaters/shared';

@Component({
  selector: 'app-example',
  imports: [BoatIconComponent, SearchDropdownComponent],
  // ...
})
export class ExampleComponent {}
```

### Using Pipes

```typescript
import { TimeAgoPipe, VesselIdPipe } from '@ghanawaters/shared';

@Component({
  template: `
    <p>Last seen: {{ vessel.lastSeen | timeAgo }}</p>
    <p>Vessel: {{ vessel.id | vesselId }}</p>
  `,
  imports: [TimeAgoPipe, VesselIdPipe]
})
export class VesselInfoComponent {}
```

### Services

```typescript
import { SettingsService } from '@ghanawaters/shared';

constructor(private settingsService: SettingsService) {}

loadUserSettings() {
  const settings = this.settingsService.getUserSettings();
  // Apply settings...
}
```

### Utilities

```typescript
import { VesselIdUtils } from '@ghanawaters/shared';

// Validate vessel ID format
const isValid = VesselIdUtils.isValidVesselId('GH-123-ABC');

// Format vessel ID
const formatted = VesselIdUtils.formatVesselId('gh123abc');
// Returns: 'GH-123-ABC'
```

## Architecture

This library follows Angular best practices:
- Standalone components for modern Angular 19 compatibility
- Pure pipes for performance optimization
- Injectable services with proper dependency injection
- Utility functions as pure functions for testability

## Building

Run `nx build shared` to build the library.

## Running unit tests

Run `nx test shared` to execute the unit tests via [Jest](https://jestjs.io).

## Development Guidelines

- All components should be standalone for Angular 19 compatibility
- Follow PrimeNG design patterns for consistency
- Write comprehensive unit tests for all utilities and services
- Document complex components with JSDoc comments
- Use TypeScript strict mode for type safety
