// libs/map/src/lib/layers/nwnm/nw-nm-layer.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import {
    Map,
    GeoJSONSource,
    LayerSpecification,
    GetResourceResponse,
} from 'maplibre-gl';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FeatureCollection, Geometry } from 'geojson';

import { BaseLayerService } from '../base-layer.service';
import { NwNmMessage, NwNmFeatureProperties } from './nw-nm.models';

const NW_ICON_ID = 'nwnm-nw-icon';
const NM_ICON_ID = 'nwnm-nm-icon';
const NW_ICON_PATH = '/img/nwnm/nw.png';
const NM_ICON_PATH = '/img/nwnm/nm.png';

const SOURCE_ID = 'nwnm-geojson-source';

const LAYER_IDS = {
    NW_POINTS: 'nwnm-nw-points-layer',
    NM_POINTS: 'nwnm-nm-points-layer',
    NW_LINES: 'nwnm-nw-lines-layer',
    NM_LINES: 'nwnm-nm-lines-layer',
    NW_FILL: 'nwnm-nw-fill-layer',
    NM_FILL: 'nwnm-nm-fill-layer',
    NW_OUTLINE: 'nwnm-nw-outline-layer',
    NM_OUTLINE: 'nwnm-nm-outline-layer',
} as const;

@Injectable({
    providedIn: 'root',
})
/**
 * NW/NM Layer Service - Manages Navigational Warnings and Notices to Mariners
 *
 * Initialization Flow:
 * 1. constructor() - Service instantiation
 * 2. initialize(map) - Load icons, add GeoJSON source, add layers
 * 3. addMapLayers() - Add NW layers (points/lines/fill), then NM layers (points/lines/fill)
 * 4. update() - Fetch data from API and update source
 */
export class NwNmLayerService extends BaseLayerService {
    override readonly layerId = 'nw-nm';
    private readonly apiUrl = '/api/nwnm/messages';
    private readonly http = inject(HttpClient);

    private map: Map | null = null;
    private isVisible = true;
    private areImagesLoaded = false;
    private managedLayerIds: string[] = Object.values(LAYER_IDS);

    constructor() {
        super();
    }

    async initialize(map: Map): Promise<void> {
        if (this.map) {
            console.warn('[NwNmLayerService] Already initialized.');
            return;
        }
        this.map = map;
        console.log('[NwNmLayerService] Initializing...');

        try {
            await Promise.all([
                this.loadAndAddImageWithPromise(NW_ICON_ID, NW_ICON_PATH),
                this.loadAndAddImageWithPromise(NM_ICON_ID, NM_ICON_PATH)
            ]);
            this.areImagesLoaded = true;
            console.log('[NwNmLayerService] Icons loaded and added successfully.');
        } catch (error) {
            console.error('[NwNmLayerService] Failed to load required map icons:', error);
            this.areImagesLoaded = false;
        }

        if (!this.map) {
            console.warn('[NwNmLayerService] Initialization aborted: Map instance became null.');
            return;
        }

        if (!this.map.getSource(SOURCE_ID)) {
            try {
                this.map.addSource(SOURCE_ID, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] },
                });
                console.log(`[NwNmLayerService] Source '${SOURCE_ID}' added.`);
            } catch (error) {
                console.error(`[NwNmLayerService] Error adding source '${SOURCE_ID}':`, error);
                this.map = null;
                return;
            }
        } else {
             console.warn(`[NwNmLayerService] Source '${SOURCE_ID}' already exists.`);
        }

        this.addMapLayers();

        this.update().catch(err => {
            console.error('[NwNmLayerService] Initial data fetch failed:', err);
        });

        console.log('[NwNmLayerService] Initialization complete.');
    }

    async update(): Promise<void> {
        if (!this.map || !this.map.getSource(SOURCE_ID)) {
            return;
        }
        console.log('[NwNmLayerService] Fetching NW-NM data...');
        try {
            const messages = await firstValueFrom(this.fetchNwNmMessages());
            const geojsonData = this.transformAndFilterMessagesToGeoJson(messages);
            console.log(`[NwNmLayerService] Fetched and transformed ${geojsonData.features.length} valid features.`);

            const source = this.map.getSource(SOURCE_ID) as GeoJSONSource;
            if (source) {
                source.setData(geojsonData);
                console.log(`[NwNmLayerService] Source '${SOURCE_ID}' updated.`);
            } else {
                console.error(`[NwNmLayerService] Source '${SOURCE_ID}' not found during update.`);
            }
        } catch (error) {
            console.error('[NwNmLayerService] Failed to fetch or update NW-NM data:', error);
            throw error;
        }
    }

    toggleVisibility(visible: boolean): void {
        if (!this.map) {
            console.warn('[NwNmLayerService] Cannot toggle visibility: Map not initialized.');
            return;
        }
        this.isVisible = visible;
        const newVisibility = this.isVisible ? 'visible' : 'none';
        console.log(`[NwNmLayerService] Setting visibility to: ${newVisibility}`);
        this.managedLayerIds.forEach(layerId => {
            if (this.map?.getLayer(layerId)) {
                try {
                    this.map.setLayoutProperty(layerId, 'visibility', newVisibility);
                } catch (error) {
                    console.error(`[NwNmLayerService] Error setting visibility for layer '${layerId}':`, error);
                }
            }
        });
    }

    destroy(): void {
        console.log('[NwNmLayerService] Destroying...');
        if (this.map) {
            this.managedLayerIds.forEach(layerId => {
                try { if (this.map?.getLayer(layerId)) this.map.removeLayer(layerId); }
                catch (e) { console.error(`[NwNmLayerService] Error removing layer ${layerId}:`, e); }
            });
            try { if (this.map?.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID); }
            catch (e) { console.error(`[NwNmLayerService] Error removing source ${SOURCE_ID}:`, e); }
            try { if (this.map?.hasImage(NW_ICON_ID)) this.map.removeImage(NW_ICON_ID); }
            catch (e) { console.error(`[NwNmLayerService] Error removing NW image:`, e); }
            try { if (this.map?.hasImage(NM_ICON_ID)) this.map.removeImage(NM_ICON_ID); }
            catch (e) { console.error(`[NwNmLayerService] Error removing NM image:`, e); }
        }
        this.map = null;
        this.isVisible = true;
        this.areImagesLoaded = false;
        console.log('[NwNmLayerService] Destroy complete.');
    }

    private async loadAndAddImageWithPromise(id: string, path: string): Promise<void> {
        if (!this.map) {
            throw new Error('Map not initialized when trying to load image.');
        }
        const mapInstance = this.map;

        if (mapInstance.hasImage(id)) {
            console.log(`[NwNmLayerService] Image '${id}' already loaded.`);
            return;
        }

        try {
            const response: GetResourceResponse<HTMLImageElement | ImageBitmap> = await mapInstance.loadImage(path);
            const image = response.data;

            if (!this.map || this.map.hasImage(id)) {
                if (!this.map) console.warn(`[NwNmLayerService] Map destroyed while processing loaded image ${id}`);
                else console.warn(`[NwNmLayerService] Image '${id}' added concurrently.`);
                 if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
                    image.close();
                }
                return;
            }

            mapInstance.addImage(id, image, { pixelRatio: 1 });
            console.log(`[NwNmLayerService] Added image '${id}' using Promise loadImage.`);

        } catch (error) {
            console.error(`[NwNmLayerService] Error in loadAndAddImageWithPromise for ${id} from ${path}:`, error);
            throw error;
        }
    }

    private addMapLayers(): void {
        if (!this.map) return;

        const addLayerSafely = (layerConfig: LayerSpecification) => {
             if (!this.map) return;
             if (this.map.getLayer(layerConfig.id)) {
                 console.warn(`[NwNmLayerService] Layer '${layerConfig.id}' already exists. Skipping.`);
                 return;
             }
             if ('source' in layerConfig && typeof layerConfig.source === 'string' && !this.map.getSource(layerConfig.source)) {
                 console.error(`[NwNmLayerService] Cannot add layer '${layerConfig.id}' because source '${layerConfig.source}' does not exist.`);
                 return;
             }
             try {
                 this.map.addLayer(layerConfig);
                 console.log(`[NwNmLayerService] Added layer '${layerConfig.id}'.`);
             } catch (error) {
                 console.error(`[NwNmLayerService] Error adding layer '${layerConfig.id}':`, error);
             }
        };

        const initialVisibility = this.isVisible ? 'visible' : 'none';

        // ========================================
        // Navigational Warnings (NW) Layers
        // ========================================
        const fillPaint = { 'fill-color': '#FF00FF', 'fill-opacity': 0.2 };
        addLayerSafely({
            id: LAYER_IDS.NW_LINES, type: 'line', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']], ['==', ['get', 'mainType'], 'NW']],
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': initialVisibility },
            paint: { 'line-color': '#8B008B', 'line-width': 2, 'line-opacity': 0.8 }
        });
        addLayerSafely({
            id: LAYER_IDS.NW_FILL, type: 'fill', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'mainType'], 'NW']],
            layout: { 'visibility': initialVisibility },
            paint: fillPaint,
        });
        addLayerSafely({
            id: LAYER_IDS.NW_OUTLINE, type: 'line', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'mainType'], 'NW']],
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': initialVisibility },
            paint: { 'line-color': '#8B008B', 'line-width': 1, 'line-opacity': 0.8 }
        });
        addLayerSafely({
            id: LAYER_IDS.NW_POINTS, type: 'symbol', source: SOURCE_ID,
            filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'mainType'], 'NW']],
            layout: { 'icon-image': this.areImagesLoaded ? NW_ICON_ID : '', 'icon-size': 0.3, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'visibility': initialVisibility, },
            paint: {}
        });

        // ========================================
        // Notices to Mariners (NM) Layers
        // ========================================
        addLayerSafely({
            id: LAYER_IDS.NM_LINES, type: 'line', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']], ['==', ['get', 'mainType'], 'NM']],
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': initialVisibility },
            paint: { 'line-color': '#8B008B', 'line-width': 2, 'line-opacity': 0.8 }
        });
        addLayerSafely({
            id: LAYER_IDS.NM_FILL, type: 'fill', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'mainType'], 'NM']],
            layout: { 'visibility': initialVisibility },
            paint: fillPaint
        });
        addLayerSafely({
            id: LAYER_IDS.NM_OUTLINE, type: 'line', source: SOURCE_ID,
            filter: ['all', ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], ['==', ['get', 'mainType'], 'NM']],
            layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': initialVisibility },
            paint: { 'line-color': '#8B008B', 'line-width': 1, 'line-opacity': 0.8 }
        });
        addLayerSafely({
             id: LAYER_IDS.NM_POINTS, type: 'symbol', source: SOURCE_ID,
             filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'mainType'], 'NM']],
             layout: { 'icon-image': this.areImagesLoaded ? NM_ICON_ID : '', 'icon-size': 0.3, 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'visibility': initialVisibility, },
             paint: {}
         });
    }

    private fetchNwNmMessages(lang = 'en'): Observable<NwNmMessage[]> {
         const params = new HttpParams().set('lang', lang);
         return this.http.get<NwNmMessage[]>(this.apiUrl, { params }).pipe(
             catchError((error: HttpErrorResponse | Error | unknown) => {
                 const message = error instanceof Error ? error.message : 'Unknown API error';
                 console.error(`[NwNmLayerService] API Error fetching NW-NM messages: ${message}`, error);
                 return of([]);
             })
         );
    }

    private transformAndFilterMessagesToGeoJson(
        messages: NwNmMessage[]
    ): FeatureCollection<Geometry, NwNmFeatureProperties> {
        const validFeatures: Array<GeoJSON.Feature<Geometry, NwNmFeatureProperties>> = [];

        messages.forEach((message) => {
            message.parts?.forEach((part) => {
                // Create full message properties for popup display
                const messageProperties: NwNmFeatureProperties = {
                    // Core identifiers
                    id: message.id,
                    messageId: message.id,
                    shortId: message.shortId,

                    // Type and status
                    mainType: message.mainType,
                    type: message.type,
                    status: message.status,

                    // Content
                    title: message.title,
                    description: message.description,

                    // Dates
                    publishDateFrom: message.publishDateFrom,
                    publishDateTo: message.publishDateTo,

                    // Additional data
                    areas: message.areas,
                    descs: message.descs,
                    parts: message.parts,
                    references: message.references,
                    charts: message.charts,

                    // Original information flag
                    originalInformation: message.originalInformation,
                };

                // Handle FeatureCollection (most common case from Niord API)
                // Ported from Niord AngularJS messages-service.js getMessageFeatures()
                if (part.geometry?.type === 'FeatureCollection' && Array.isArray(part.geometry.features)) {
                    part.geometry.features.forEach((feature: any) => {
                        if (feature.geometry) {
                            validFeatures.push({
                                type: 'Feature',
                                geometry: feature.geometry,
                                properties: messageProperties,
                            });
                        }
                    });
                    return; // Continue to next part
                }

                // Fallback: Handle single Feature
                let geometry: Geometry | null = null;
                if (part.geometry?.type === 'Feature') {
                    if (part.geometry.geometry) {
                        geometry = part.geometry.geometry;
                    }
                } else if (part.geometry && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(part.geometry.type)) {
                    // Fallback: Handle direct geometry types
                    geometry = part.geometry as Geometry;
                }

                if (geometry && messageProperties.messageId !== undefined && messageProperties.mainType !== undefined) {
                    validFeatures.push({
                        type: 'Feature',
                        geometry: geometry,
                        properties: messageProperties,
                    });
                }
            });
        });

        return {
            type: 'FeatureCollection',
            features: validFeatures,
        };
    }
}
