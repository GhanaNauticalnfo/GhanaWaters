import { Injectable } from '@angular/core';
import { Map as MaplibreMap, LngLatBounds } from 'maplibre-gl';
import { BaseLayerService } from '../base-layer.service';

export interface KmlFeatureData {
  type: 'FeatureCollection';
  features: any[];
}

@Injectable({
  providedIn: 'root'
})
export class KmlLayerService extends BaseLayerService {
  readonly layerId = 'kml-layer';
  private map: MaplibreMap | null = null;
  private featureData: KmlFeatureData | null = null;
  private readonly featureColor = '#3b82f6'; // Blue for KML features

  constructor() {
    super();
  }

  initialize(map: MaplibreMap): void {
    this.map = map;

    // Wait for style to be loaded before updating display
    if (this.map.isStyleLoaded()) {
      this.updateDisplay();
    } else {
      this.map.once('styledata', () => {
        this.updateDisplay();
      });
    }
  }

  async update(): Promise<void> {
    this.updateDisplay();
  }

  toggleVisibility(visible: boolean): void {
    if (!this.map) return;

    // Toggle all KML layers visibility
    const layers = ['kml-fill-layer', 'kml-line-layer', 'kml-point-layer'];
    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
  }

  destroy(): void {
    this.clearLayers();
    this.map = null;
  }

  /**
   * Set the GeoJSON feature data to display
   */
  setFeatureData(featureData: KmlFeatureData | null): void {
    this.featureData = featureData;
    if (this.map) {
      // Ensure style is loaded before updating display
      if (this.map.isStyleLoaded()) {
        this.updateDisplay();
      } else {
        this.map.once('styledata', () => {
          this.updateDisplay();
        });
      }
    }
  }

  /**
   * Fit the map to show all features
   */
  fitToFeatures(): void {
    if (!this.map || !this.featureData?.features.length) return;

    // Check if map container has valid dimensions
    const container = this.map.getContainer();
    if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('Map container has no dimensions, skipping fitBounds');
      // Use requestAnimationFrame for smoother retries
      requestAnimationFrame(() => this.fitToFeatures());
      return;
    }

    try {
      const bounds = new LngLatBounds();

      // Extract coordinates from all features
      this.featureData.features.forEach(feature => {
        this.extractCoordinatesFromFeature(feature, bounds);
      });

      // Only fit bounds if we have a valid bounding box
      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15 // Prevent zooming in too close
        });
      }
    } catch (error) {
      console.error('Error fitting map to features:', error);
    }
  }

  private extractCoordinatesFromFeature(feature: any, bounds: LngLatBounds): void {
    if (!feature.geometry) return;

    const { type, coordinates } = feature.geometry;

    switch (type) {
      case 'Point':
        bounds.extend(coordinates as [number, number]);
        break;
      case 'MultiPoint':
      case 'LineString':
        coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
        break;
      case 'MultiLineString':
      case 'Polygon':
        coordinates.forEach((ring: [number, number][]) => {
          ring.forEach(coord => bounds.extend(coord));
        });
        break;
      case 'MultiPolygon':
        coordinates.forEach((polygon: [number, number][][]) => {
          polygon.forEach(ring => {
            ring.forEach(coord => bounds.extend(coord));
          });
        });
        break;
    }
  }

  private updateDisplay(): void {
    if (!this.map) return;

    if (this.featureData && this.featureData.features.length > 0) {
      this.addFeatureLayers();
    } else {
      this.clearLayers();
    }
  }

  private addFeatureLayers(): void {
    if (!this.map || !this.featureData) return;

    // Ensure style is loaded before adding source
    if (!this.map.isStyleLoaded()) {
      console.warn('Map style not loaded, skipping feature layers');
      return;
    }

    // Check if source already exists and update it, otherwise add it
    if (this.map.getSource('kml-features')) {
      // Update existing source data
      (this.map.getSource('kml-features') as any).setData(this.featureData);
    } else {
      // Add source for the first time
      this.map.addSource('kml-features', {
        type: 'geojson',
        data: this.featureData
      });

      // Add fill layer for polygons
      this.map.addLayer({
        id: 'kml-fill-layer',
        type: 'fill',
        source: 'kml-features',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': this.featureColor,
          'fill-opacity': 0.3
        }
      });

      // Add line layer for lines and polygon outlines
      this.map.addLayer({
        id: 'kml-line-layer',
        type: 'line',
        source: 'kml-features',
        filter: ['any',
          ['==', ['geometry-type'], 'LineString'],
          ['==', ['geometry-type'], 'Polygon']
        ],
        paint: {
          'line-color': this.featureColor,
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Add circle layer for points
      this.map.addLayer({
        id: 'kml-point-layer',
        type: 'circle',
        source: 'kml-features',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 6,
          'circle-color': this.featureColor,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }
  }

  private clearLayers(): void {
    if (!this.map) return;

    const layers = ['kml-point-layer', 'kml-line-layer', 'kml-fill-layer'];

    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    if (this.map.getSource('kml-features')) {
      this.map.removeSource('kml-features');
    }
  }
}
