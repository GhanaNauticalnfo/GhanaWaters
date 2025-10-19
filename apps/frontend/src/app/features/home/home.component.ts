import { Component, ViewChild, inject, AfterViewInit } from '@angular/core';
import { MapComponent, MapConfig, OSM_STYLE, LayerManagerService, VesselLayerService, FeaturesLayerService, KmlLayerService, VesselWithLocation } from '@ghanawaters/shared-map';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MapComponent],
  providers: [VesselLayerService, FeaturesLayerService, KmlLayerService],
  template: `
    <div class="p-0 h-screen flex flex-col">
      <div class="bg-blue-900 text-white p-4 text-center">
        <h1 class="text-2xl m-0">Ghana Waters by Ghana Maritime Authority</h1>
      </div>
      <div class="flex-1 w-full">
        <lib-map
          #mapComponent
          [config]="mapConfig"
          [vesselMode]="true"
          [showFeaturesToggle]="true"
          (vesselSelected)="onVesselSelected($event)">
        </lib-map>
      </div>
    </div>
  `
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('mapComponent') mapComponent!: MapComponent;
  private layerManager = inject(LayerManagerService);

  mapConfig: Partial<MapConfig> = {
    mapStyle: OSM_STYLE,
    center: [-0.0, 7.5], // Lake Volta coordinates
    zoom: 8,
    height: '100%',
    showCoordinateDisplay: true, // Enable coordinate display
    showFullscreenControl: true,
    showControls: false, // Disable layer controls for simpler view
    availableLayers: ['vessels'], // Make vessel tracking layer available
    initialActiveLayers: ['vessels'], // Automatically activate vessel tracking on load
    apiUrl: environment.apiUrl
  };

  ngAfterViewInit() {
    this.layerManager.registerLayer('vessels', VesselLayerService);
    this.layerManager.registerLayer('features', FeaturesLayerService);
  }

  onVesselSelected(vessel: VesselWithLocation) {
    console.log('Vessel selected:', vessel);
  }
}