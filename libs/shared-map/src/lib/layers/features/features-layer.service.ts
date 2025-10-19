import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Map as MaplibreMap } from 'maplibre-gl';
import { BaseLayerService } from '../base-layer.service';
import { KmlLayerService } from '../kml/kml-layer.service';
import { KmlFeatureData } from '../kml/kml-layer.service';
import { KmlDatasetResponse } from '@ghanawaters/shared-models';
import { MapConfig } from '../../models/map-config.model';
import { kml } from '@tmcw/togeojson';

@Injectable({
  providedIn: 'root'
})
export class FeaturesLayerService extends BaseLayerService {
  readonly layerId = 'features';

  private http = inject(HttpClient);
  private kmlLayerService = inject(KmlLayerService);
  private map: MaplibreMap | null = null;
  private config: MapConfig | null = null;

  constructor() {
    super();
  }

  initialize(map: MaplibreMap): void {
    this.map = map;

    // Initialize the KML layer service
    this.kmlLayerService.initialize(map);
  }

  setConfig(config: MapConfig): void {
    this.config = config;

    // Trigger initial load after config is set
    if (this.map) {
      this.update();
    }
  }

  async update(): Promise<void> {
    if (!this.config?.apiUrl) {
      console.error('FeaturesLayerService: API URL not configured');
      return;
    }

    try {
      // Fetch all KML datasets from API
      const datasets = await this.http.get<KmlDatasetResponse[]>(
        `${this.config.apiUrl}/kml-datasets`
      ).toPromise();

      if (!datasets || datasets.length === 0) {
        console.log('FeaturesLayerService: No KML datasets available');
        this.kmlLayerService.setFeatureData(null);
        return;
      }

      // Filter to enabled datasets only
      const enabledDatasets = datasets.filter(d => d.enabled);

      if (enabledDatasets.length === 0) {
        console.log('FeaturesLayerService: No enabled KML datasets found');
        this.kmlLayerService.setFeatureData(null);
        return;
      }

      // Parse and merge all KML datasets into a single FeatureCollection
      const mergedFeatures = await this.parseAndMergeKmlDatasets(enabledDatasets);

      // Update the KML layer with merged features
      this.kmlLayerService.setFeatureData(mergedFeatures);

      console.log(`FeaturesLayerService: Loaded ${enabledDatasets.length} enabled datasets with ${mergedFeatures.features.length} features`);
    } catch (error) {
      console.error('FeaturesLayerService: Error loading KML datasets:', error);
      this.kmlLayerService.setFeatureData(null);
    }
  }

  toggleVisibility(visible: boolean): void {
    // Delegate visibility control to the KML layer service
    this.kmlLayerService.toggleVisibility(visible);
  }

  destroy(): void {
    // Clear features from the map when deactivating the layer
    if (this.kmlLayerService) {
      this.kmlLayerService.setFeatureData(null);
    }
    this.map = null;
  }

  /**
   * Parse KML datasets and merge all features into a single FeatureCollection
   */
  private async parseAndMergeKmlDatasets(datasets: KmlDatasetResponse[]): Promise<KmlFeatureData> {
    const allFeatures: any[] = [];

    for (const dataset of datasets) {
      if (!dataset.kml) {
        console.warn(`FeaturesLayerService: Dataset ${dataset.id} has no KML content`);
        continue;
      }

      try {
        // Parse KML string to DOM
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(dataset.kml, 'text/xml');

        // Check for parsing errors
        const parserError = kmlDoc.querySelector('parsererror');
        if (parserError) {
          console.error(`FeaturesLayerService: Error parsing KML for dataset ${dataset.id}:`, parserError.textContent);
          continue;
        }

        // Convert KML to GeoJSON
        const geojson = kml(kmlDoc);

        // Add features to the collection
        if (geojson && geojson.features) {
          // Add dataset metadata to each feature
          geojson.features.forEach((feature: any) => {
            feature.properties = {
              ...feature.properties,
              datasetId: dataset.id,
              datasetName: dataset.name || `Dataset ${dataset.id}`
            };
          });

          allFeatures.push(...geojson.features);
        }
      } catch (error) {
        console.error(`FeaturesLayerService: Error processing KML for dataset ${dataset.id}:`, error);
      }
    }

    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }
}
