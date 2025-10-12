import { Component, OnInit, OnDestroy, AfterViewInit, input, output, inject, signal, effect, viewChild, ChangeDetectorRef, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KmlDatasetResponse } from '@ghanawaters/shared-models';
import { debounceTime } from 'rxjs/operators';
import { kml } from '@tmcw/togeojson';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Map imports
import { MapComponent, MapConfig, OSM_STYLE, KmlLayerService } from '@ghanawaters/shared-map';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-kml-dataset-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    ButtonModule,
    SkeletonModule,
    MapComponent,
    ConfirmDialogModule
  ],
  providers: [KmlLayerService, ConfirmationService],
  template: `
    <div class="kml-form-container">
      <form [formGroup]="kmlForm" class="flex gap-3" style="height: 100%;">
        <!-- Left side: Map -->
        <div class="map-section" style="position: relative;">
          @if (mapReady()) {
            <lib-map
              #mapComponent
              [config]="mapConfig()">
            </lib-map>
          } @else {
            <div class="map-skeleton">
              <p-skeleton width="100%" height="100%"></p-skeleton>
              <div class="loading-text">Loading map...</div>
            </div>
          }

          <!-- Parsing error overlay -->
          @if (parseError()) {
            <div class="parse-error-overlay">
              <div class="parse-error-box">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ parseError() }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Right side: Form fields -->
        <div class="form-panel">
          <div class="form-content">
            <div class="form-group">
              <label for="name" class="form-label">Name <span class="required-asterisk">*</span></label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-tag"></i>
                <input
                  type="text"
                  pInputText
                  id="name"
                  formControlName="name"
                  placeholder="Enter a name for the KML dataset"
                  class="w-full"
                  [ngClass]="{'ng-invalid ng-dirty': kmlForm.controls['name'].invalid && kmlForm.controls['name'].touched}"
                  [readonly]="mode() === 'view'"
                />
              </span>
              @if (kmlForm.controls['name'].invalid && kmlForm.controls['name'].touched) {
                <small class="p-error block mt-1 text-xs">Name is required.</small>
              }
            </div>

            <div class="form-group">
              <label for="enabled" class="form-label">Status</label>
              <div class="p-field-checkbox">
                <p-checkbox
                  formControlName="enabled"
                  [binary]="true"
                  inputId="enabled"
                  [disabled]="mode() === 'view'"
                ></p-checkbox>
                <label for="enabled" class="ml-2">Enabled</label>
              </div>
            </div>

            <div class="form-group flex-1">
              <label for="kml" class="form-label">KML Content</label>
              <textarea
                pTextarea
                id="kml"
                formControlName="kml"
                placeholder="Paste your KML content here"
                class="w-full kml-textarea"
                [readonly]="mode() === 'view'"
              ></textarea>
            </div>
          </div>

          <div class="form-actions">
            @if (mode() !== 'view') {
              <div class="flex items-center justify-between w-full">
                <div class="text-sm text-gray-500">
                  @if (mode() === 'create' && !canSave()) {
                    <span class="text-orange-500">
                      @if (!kmlForm.get('name')?.value || kmlForm.get('name')?.value.trim().length === 0) {
                        Please enter a dataset name and valid KML content
                      } @else if (!isKmlValid()) {
                        Please enter valid KML content
                      } @else {
                        Please complete all required fields
                      }
                    </span>
                  }
                </div>
                <div class="flex gap-2">
                  <button
                    pButton
                    type="button"
                    label="Cancel"
                    class="p-button-text"
                    (click)="onCancel()">
                  </button>
                  <button
                    pButton
                    type="button"
                    label="Save"
                    icon="pi pi-check"
                    (click)="onSave()"
                    [disabled]="!canSave()">
                  </button>
                </div>
              </div>
            } @else {
              <button
                pButton
                type="button"
                label="Close"
                class="p-button-text"
                (click)="onCancel()">
              </button>
            }
          </div>
        </div>
      </form>

      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  host: {
    class: 'kml-form-host'
  },
  styles: [`
    .kml-form-container {
      height: 100%;
      overflow: hidden;
    }

    .kml-form-container form {
      height: 100%;
    }

    .map-section {
      flex: 0 0 60%;
      min-width: 300px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .map-section lib-map {
      flex: 1;
      min-height: 500px;
      position: relative;
      display: block;
    }

    .map-skeleton {
      width: 100%;
      height: 100%;
      min-height: 500px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-text {
      position: absolute;
      color: var(--text-color-secondary);
    }

    .parse-error-overlay {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      pointer-events: none;
    }

    .parse-error-box {
      background: var(--red-500);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      max-width: 400px;
    }

    .parse-error-box i {
      font-size: 18px;
    }

    .form-panel {
      flex: 0 0 40%;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface-card);
      border-left: 1px solid var(--surface-border);
    }

    .form-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.flex-1 {
      flex: 1;
      min-height: 0;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .required-asterisk {
      color: var(--red-500, #f44336);
    }

    .kml-textarea {
      font-family: var(--font-family-monospace, monospace);
      resize: vertical;
      min-height: 300px;
      height: 100%;
    }

    .p-field-checkbox {
      display: flex;
      align-items: center;
    }

    .w-full { width: 100%; }
    .ml-2 { margin-left: 0.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .block { display: block; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 0.5rem; }
    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    .text-gray-500 { color: #6b7280; }
    .text-orange-500 { color: #f97316; }

    .ng-invalid.ng-dirty {
      border-color: var(--red-500, #f44336);
    }
  `]
})
export class KmlDatasetFormComponent implements OnInit, OnDestroy, AfterViewInit {
  // Dependency injection
  private fb = inject(FormBuilder);
  private kmlLayerService = inject(KmlLayerService);
  private cdr = inject(ChangeDetectorRef);
  private confirmationService = inject(ConfirmationService);

  // Inputs
  dataset = input<KmlDatasetResponse | null>(null);
  mode = input<'view' | 'edit' | 'create'>('create');

  // Outputs
  save = output<KmlDatasetResponse>();
  cancel = output<void>();

  // View children
  mapComponent = viewChild<MapComponent>('mapComponent');

  // State
  kmlForm!: FormGroup;
  mapConfig = signal<Partial<MapConfig>>({});
  mapReady = signal(false);
  parseError = signal<string | null>(null);

  // Change tracking
  currentFormValues = signal<{ name: string; enabled: boolean; kml: string }>({
    name: '',
    enabled: true,
    kml: ''
  });
  originalFormValues = signal<{ name: string; enabled: boolean; kml: string } | null>(null);

  // Computed signal for KML validity
  isKmlValid = computed(() => {
    const kml = this.kmlForm?.get('kml')?.value;
    const hasContent = kml && kml.trim().length > 0;

    // KML content is required in all modes
    if (!hasContent) {
      return false;
    }

    // Content exists, check for parsing errors
    return this.parseError() === null;
  });

  // Computed signal for overall form validity
  canSave = computed(() => {
    const mode = this.mode();
    const current = this.currentFormValues();
    const hasValidName = current.name && current.name.trim().length > 0;

    // Must have valid name AND valid KML (empty or parseable)
    if (!hasValidName || !this.isKmlValid()) {
      return false;
    }

    // For edit mode, also require changes
    if (mode === 'edit') {
      return this.hasChanges();
    }

    // For create mode, basic requirements are enough
    return true;
  });

  constructor() {
    // Effects to watch for changes
    effect(() => {
      const currentMode = this.mode();
      this.updateFormState();
    });

    effect(() => {
      const currentDataset = this.dataset();
      if (currentDataset !== null || this.mode() === 'create') {
        this.resetFormWithDataset();
      }
    });
  }

  // Unified change detection method
  private hasChanges(): boolean {
    const current = this.currentFormValues();
    const originalForm = this.originalFormValues();

    // Check form changes
    if (originalForm) {
      const formChanged = (
        current.name !== originalForm.name ||
        current.enabled !== originalForm.enabled ||
        current.kml !== originalForm.kml
      );

      if (formChanged) return true;
    }

    return false;
  }

  ngOnInit() {
    this.kmlForm = this.fb.group({
      name: ['', Validators.required],
      enabled: [true],
      kml: [''] // No validator - KML is optional, validation handled by isKmlValid()
    });

    // Initialize map configuration
    this.mapConfig.set({
      mapStyle: OSM_STYLE,
      center: [-0.4, 6.7], // Ghana region
      zoom: 7,
      height: '100%',
      showControls: false,
      showFullscreenControl: true,
      showCoordinateDisplay: true,
      availableLayers: [],
      initialActiveLayers: []
    });

    // Watch for all form changes to update currentFormValues signal
    this.kmlForm.valueChanges
      .subscribe((values) => {
        this.currentFormValues.set(values);
      });

    // Watch for KML content changes to parse and display
    this.kmlForm.get('kml')?.valueChanges
      .pipe(debounceTime(500))
      .subscribe((kmlContent) => {
        this.parseAndDisplayKml(kmlContent);
      });
  }

  ngAfterViewInit(): void {
    // Focus on the first input field
    const firstInput = document.querySelector('#name') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
    }
  }

  ngOnDestroy(): void {
    // Reset map state
    this.mapReady.set(false);
  }

  private updateFormState(): void {
    // Enable/disable form based on mode
    if (this.mode() === 'view') {
      this.kmlForm.disable();
    } else {
      this.kmlForm.enable();
    }
  }

  private resetFormWithDataset(): void {
    const currentDataset = this.dataset();

    if (currentDataset) {
      // Reset form with dataset data
      const formData = {
        name: currentDataset.name || '',
        enabled: currentDataset.enabled,
        kml: currentDataset.kml || ''
      };
      this.kmlForm.reset(formData);

      // Force change detection to ensure PrimeNG checkbox updates
      this.cdr.detectChanges();

      // Store both current and original values for change tracking
      this.currentFormValues.set({ ...formData });
      this.originalFormValues.set({ ...formData });
    } else {
      // Reset form to default values for create mode
      const formData = {
        name: '',
        enabled: true,
        kml: ''
      };
      this.kmlForm.reset(formData);

      // For create mode, set current values and original to null
      this.currentFormValues.set({ ...formData });
      this.originalFormValues.set(null);
    }

    // Update map display after form reset
    // Only update if map is ready, otherwise it will be updated when map initializes
    if (this.mapReady()) {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        const currentKml = this.kmlForm.get('kml')?.value;
        if (currentKml) {
          this.parseAndDisplayKml(currentKml);
        }
      });
    }
  }

  // Public method to prepare the map - called by parent component when dialog is shown
  public prepareMap(): void {
    console.log('[KML Form] prepareMap() called, mode:', this.mode(), 'mapReady:', this.mapReady());
    this.mapReady.set(true);

    // Force change detection to ensure map container renders with proper dimensions
    this.cdr.detectChanges();

    // Initialize map with minimal delay
    setTimeout(() => {
      console.log('[KML Form] Calling initializeMapIntegration');
      this.initializeMapIntegration();
    }, 0);
  }

  private initializeMapIntegration(): void {
    const mapComponentRef = this.mapComponent();
    console.log('[KML Form] initializeMapIntegration - mapComponent:', !!mapComponentRef, 'map:', !!mapComponentRef?.map);
    if (!mapComponentRef?.map) {
      console.error('[KML Form] Map component not ready');
      return;
    }

    const map = mapComponentRef.map;
    console.log('[KML Form] Map initialized successfully');

    // Wait for map style to be loaded
    const initializeKml = () => {
      // Initialize the KML layer with the map
      this.kmlLayerService.initialize(map);

      // Parse and display current KML content if any
      const currentKml = this.kmlForm.get('kml')?.value;
      if (currentKml) {
        this.parseAndDisplayKml(currentKml);
      }
    };

    if (map.isStyleLoaded()) {
      initializeKml();
      // Ensure map layout is correct after initialization
      requestAnimationFrame(() => {
        mapComponentRef.resize();
      });
    } else {
      map.once('styledata', () => {
        initializeKml();
        // Ensure map layout is correct after initialization
        requestAnimationFrame(() => {
          mapComponentRef.resize();
        });
      });
    }
  }

  private parseAndDisplayKml(kmlContent: string): void {
    // Clear any previous error
    this.parseError.set(null);

    // If content is empty, clear the map
    if (!kmlContent || kmlContent.trim() === '') {
      this.kmlLayerService.setFeatureData(null);
      return;
    }

    try {
      // Decode HTML entities if present (e.g., &lt; to <, &gt; to >)
      const decodedKml = this.decodeHtmlEntities(kmlContent);

      // Parse KML string to DOM
      const parser = new DOMParser();
      const kmlDom = parser.parseFromString(decodedKml, 'text/xml');

      // Check for CRITICAL parsing errors (not namespace warnings)
      const parserError = kmlDom.querySelector('parsererror');
      if (parserError) {
        const errorText = parserError.textContent || '';

        // Ignore namespace warnings - they don't prevent parsing
        // Common warnings: "Namespace prefix xsi for schemaLocation on Document is not defined"
        const isNamespaceWarning = errorText.includes('Namespace prefix') ||
                                   errorText.includes('xmlns') ||
                                   errorText.includes('schemaLocation');

        if (!isNamespaceWarning) {
          // This is a real structural error
          throw new Error(errorText);
        }
        // If it's just a namespace warning, continue parsing
        console.log('Ignoring namespace warning:', errorText);
      }

      // Verify it's actually KML (has a <kml> root element)
      // Try with and without namespace prefix
      const kmlElement = kmlDom.getElementsByTagName('kml')[0] ||
                         kmlDom.getElementsByTagNameNS('*', 'kml')[0];
      if (!kmlElement) {
        this.parseError.set('Not valid KML: missing <kml> root element');
        this.kmlLayerService.setFeatureData(null);
        return;
      }

      // Convert KML to GeoJSON
      const geojson = kml(kmlDom);

      // Check if we got valid features
      if (!geojson.features || geojson.features.length === 0) {
        this.parseError.set('No features found in KML');
        this.kmlLayerService.setFeatureData(null);
        return;
      }

      // Display features on map
      this.kmlLayerService.setFeatureData(geojson);

      // Fit map to features
      requestAnimationFrame(() => {
        this.kmlLayerService.fitToFeatures();
      });
    } catch (error) {
      console.error('Error parsing KML:', error);
      // Extract more meaningful error message
      const errorMessage = error instanceof Error ? error.message : 'Invalid KML format';
      this.parseError.set(errorMessage);
      this.kmlLayerService.setFeatureData(null);
    }
  }

  private decodeHtmlEntities(text: string): string {
    // Create a temporary DOM element to decode HTML entities
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  onSave() {
    if (this.canSave()) {
      const formValue = this.kmlForm.value;
      const dataset = this.dataset();

      const result: KmlDatasetResponse = {
        ...formValue,
        id: dataset?.id,
        created: dataset?.created,
        last_updated: dataset?.last_updated
      };

      this.save.emit(result);
      // Reset map state in case dialog closes
      this.mapReady.set(false);

      // Update both current and original values to reflect the saved state
      const savedFormValues = {
        name: formValue.name,
        enabled: formValue.enabled,
        kml: formValue.kml
      };
      this.currentFormValues.set(savedFormValues);
      this.originalFormValues.set({ ...savedFormValues });
    } else {
      this.kmlForm.markAllAsTouched();
    }
  }

  onCancel() {
    if (this.mode() !== 'view' && this.hasChanges()) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.mapReady.set(false);
          this.cancel.emit();
        }
      });
    } else {
      this.mapReady.set(false);
      this.cancel.emit();
    }
  }
}
