// In your component (e.g., LiveComponent)
import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MapComponent,
  LayerManagerService,
  VesselLayerService,
  FeaturesLayerService,
  KmlLayerService,
  NwNmLayerService,
  MapConfig,
  OSM_STYLE,
  VesselWithLocation
} from '@ghanawaters/shared-map';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [CommonModule, MapComponent],
  template: `
    <div class="live-container">
      <div class="page-header">
        <h2 class="text-2xl">Live</h2>
      </div>
      <div class="map-container">
        <lib-map
          #mapComponent
          [config]="mapConfig"
          [vesselMode]="true"
          [showFeaturesToggle]="true"
          [showNwNmToggle]="true"
          (vesselSelected)="onVesselSelected($event)">
        </lib-map>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 0;
      height: 100%;
    }
    
    .live-container {
      padding: 0 20px 20px 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .map-container {
      flex: 1;
      min-height: 0;
      position: relative;
    }
    
    .map-container .map-container {
      height: 100%;
      min-height: 500px;
    }
    
    @media (max-width: 768px) {
      .header-content {
        justify-content: center;
      }
      
      h2 {
        text-align: center;
      }
    }
  `],
  providers: [
      VesselLayerService,
      FeaturesLayerService,
      KmlLayerService,
      NwNmLayerService
  ]
})
export class LiveComponent implements OnInit, AfterViewInit {
  @ViewChild('mapComponent') mapComponent!: MapComponent;
  
  private layerManager = inject(LayerManagerService);
  
  // Define a comprehensive map configuration for Lake Volta, Ghana
  mapConfig: Partial<MapConfig> = {
    mapStyle: OSM_STYLE, // Using the OSM style
    center: [-0.25, 7.6], // Center of Lake Volta (longitude, latitude)
    zoom: 7.5, // Adjusted zoom to show the full lake area
    height: '600px',
    showFullscreenControl: true,
    showControls: false, // Hide the map layers panel
    availableLayers: ['vessels'],
    initialActiveLayers: ['vessels'], // Automatically activate this layer on load
    layerNames: {
      'vessels': 'Vessels'
    },
    apiUrl: environment.apiUrl
  };
  
  ngOnInit() {
    console.log('Live Component: Initializing live vessel tracking page');

    // Register available layers
    this.layerManager.registerLayer('vessels', VesselLayerService);
    this.layerManager.registerLayer('features', FeaturesLayerService);
    this.layerManager.registerLayer('nw-nm', NwNmLayerService);

    console.log('Live Component: All layers registered successfully');
  }
  
  ngAfterViewInit() {
    // Map initialization is now handled by the MapWithSearch component
  }
  
  onVesselSelected(vessel: VesselWithLocation) {
    console.log('Live Component: Vessel selected:', vessel.name);
    // Zooming is now handled by the MapWithSearch component
  }
}