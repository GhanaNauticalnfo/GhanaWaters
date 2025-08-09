# Ghana Waters Map Library

## Overview

The `@ghanawaters/map` library provides shared mapping functionality using MapLibre GL for maritime visualization across Ghana Waters applications. This library centralizes all map-related components, services, and layer implementations.

## Key Features

- **Core Map Service**: Manages MapLibre instances and provides common mapping utilities
- **Reusable Components**: Map component with consistent styling and behavior
- **Layer Management**: Specialized services for different data layers
- **Real-time Updates**: WebSocket integration for live vessel position updates
- **OpenStreetMap Styling**: Custom OSM-based styles optimized for maritime use

## Architecture

### Core Services

- `MapService`: Central service for MapLibre instance management
- `LayerManagerService`: Handles dynamic layer addition/removal

### Layer Services

- `VesselLayerService`: Displays vessel positions with real-time updates via WebSocket
- `RouteLayerService`: Renders navigation routes and waypoints
- `DepthLayerService`: Displays depth contours and bathymetric data
- `NiordLayerService`: Shows navigation warnings from Niord system
- `NwNmLayerService`: Displays navigation warnings and notices to mariners

### Components

- `MapComponent`: Primary map component with MapLibre integration
- `NiordMessagesComponent`: Displays navigation warning details

## Usage

### Basic Map Setup

```typescript
import { MapService } from '@ghanawaters/map';

@Component({
  selector: 'app-map',
  template: '<div #mapContainer></div>'
})
export class MapComponent {
  constructor(private mapService: MapService) {}

  ngAfterViewInit() {
    this.mapService.initializeMap(this.mapContainer.nativeElement);
  }
}
```

### Layer Management

```typescript
import { LayerManagerService, VesselLayerService } from '@ghanawaters/map';

// Add vessel tracking layer
this.layerManager.addLayer(this.vesselLayer);

// Remove layer
this.layerManager.removeLayer('vessels');
```

### Real-time Vessel Updates

The library integrates with WebSocket services to provide real-time vessel position updates:

```typescript
// Vessel layer automatically subscribes to WebSocket position updates
// No manual setup required - handled internally by VesselLayerService
```

## Map Styles

The library uses custom OpenStreetMap-based styles optimized for maritime navigation:

- Water areas prominently displayed
- Coastlines and bathymetry emphasized
- Reduced land detail to focus on maritime features
- Custom symbology for vessels and navigation aids

## Building

Run `nx build map` to build the library.

## Running unit tests

Run `nx test map` to execute the unit tests via [Jest](https://jestjs.io).

## Dependencies

- MapLibre GL JS for map rendering
- Socket.IO client for real-time updates
- @ghanawaters/shared-models for type definitions
