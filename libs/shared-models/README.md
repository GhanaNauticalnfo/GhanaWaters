# Ghana Waters Shared Models Library

This library contains shared TypeScript types and models used across all Ghana Waters applications (API, Admin, Frontend). This ensures type consistency across the entire codebase and prevents data structure mismatches.

## GeoPoint Types

The `geo-point.model.ts` file provides a unified approach to handling geographic coordinates throughout the codebase.

### Core Types

#### Coordinates (Named Tuple)
```typescript
export type Coordinates = [lon: number, lat: number];
```
A named tuple representing coordinates in GeoJSON order: `[longitude, latitude]`.

#### GeoPoint
```typescript
export interface GeoPoint {
  type: 'Point';
  coordinates: Coordinates;
}
```
Standard GeoJSON Point format used for:
- API responses
- PostGIS storage
- Consistent coordinate handling

#### LatLng
```typescript
export interface LatLng {
  lat: number;
  lng: number;
}
```
Alternative coordinate format for compatibility with some frontend libraries.

### Usage Examples

#### In Entities
```typescript
import { GeoPoint } from '@ghanawaters/shared-models';

@Entity('tracking_point')
export class TrackingPoint {
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  position: GeoPoint;
}
```

#### In DTOs
```typescript
import { GeoPoint } from '@ghanawaters/shared-models';

export class VesselResponseDto {
  @ApiProperty({ 
    description: 'Latest position coordinates',
    example: { type: 'Point', coordinates: [-0.2058, 5.5555] }
  })
  latest_position_coordinates?: GeoPoint;
}
```

#### Converting Between Formats
```typescript
import { GeoPointUtils, LatLng, GeoPoint } from '@ghanawaters/shared-models';

// LatLng to GeoPoint
const latLng: LatLng = { lat: 5.5555, lng: -0.2058 };
const geoPoint: GeoPoint = GeoPointUtils.toGeoPoint(latLng);

// GeoPoint to LatLng
const converted: LatLng = GeoPointUtils.toLatLng(geoPoint);

// Create from coordinates
const point: GeoPoint = GeoPointUtils.createGeoPoint(-0.2058, 5.5555);
```

#### Validation
```typescript
import { GeoPointUtils, isGeoPoint } from '@ghanawaters/shared-models';

// Validate coordinates
const isValid = GeoPointUtils.isValidCoordinate(-0.2058, 5.5555);

// Check Ghana bounds
const inGhana = GeoPointUtils.isWithinGhanaBounds(geoPoint);

// Type guard
if (isGeoPoint(someObject)) {
  // TypeScript knows this is a GeoPoint
  console.log(someObject.coordinates);
}
```

#### Distance Calculations
```typescript
const distance = GeoPointUtils.distanceInNauticalMiles(point1, point2);
```

### PostGIS Integration

When working with PostGIS, coordinates are stored in `[longitude, latitude]` order:

```sql
-- Insert a point
INSERT INTO tracking_point (position) 
VALUES (ST_SetSRID(ST_MakePoint(-0.2058, 5.5555), 4326));

-- Query as GeoJSON
SELECT ST_AsGeoJSON(position) FROM tracking_point;
-- Returns: {"type":"Point","coordinates":[-0.2058,5.5555]}
```

### Best Practices

1. **Always use GeoPoint for API responses** - Ensures consistency across all endpoints
2. **Use LatLng for frontend compatibility** - When integrating with libraries that expect lat/lng
3. **Validate coordinates** - Use the utility functions to ensure valid ranges
4. **Check Ghana bounds** - For maritime-specific validation
5. **Use type guards** - For runtime type checking when handling unknown data

### Migration Guide

If you have existing code using different coordinate formats:

```typescript
// Old format
interface OldCoordinates {
  latitude: number;
  longitude: number;
}

// Convert to GeoPoint
const geoPoint: GeoPoint = {
  type: 'Point',
  coordinates: [oldCoords.longitude, oldCoords.latitude]
};

// Or use the utility
const geoPoint = GeoPointUtils.createGeoPoint(
  oldCoords.longitude,
  oldCoords.latitude
);
```

## Other Shared Models

### Core Entity Models
- **Vessel Models** - Vessel entities and DTOs with response/input types
- **VesselType Models** - Vessel classification and categorization
- **Device Models** - Device authentication and management
- **Route Models** - Navigation routes with waypoints and sync support
- **LandingSite Models** - Fishing and maritime landing locations
- **TreeStub Models** - Navigation hazards and obstacles

### Integration Models
- **Niord Models** - Navigation warning data structures from external system
- **VesselTelemetry Models** - Real-time vessel tracking data
- **Sync Models** - Offline-first data synchronization structures
- **Settings Models** - Application configuration and user preferences

### Communication Models
- **WebSocket Events** - Real-time update event types for vessel positions
- **PositionUpdate Events** - Structured position update data for WebSocket broadcasts

### Utility Models
- **ResourceSettings Models** - Dynamic resource configuration
- **VoltaDepth Models** - Volta Lake bathymetric data structures

See individual model files for detailed documentation and usage examples.