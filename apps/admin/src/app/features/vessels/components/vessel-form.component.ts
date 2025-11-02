import { Component, input, output, OnInit, OnDestroy, signal, effect, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimestampPipe } from '@ghanawaters/shared';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { VesselTypeService, VesselType } from '../../settings/vessel-types/vessel-type.service';
import { VesselDataset, DeviceResponse, DeviceState } from '@ghanawaters/shared-models';
import { VesselTabDeviceComponent } from './vessel-tab-device.component';
import { VesselTabTrackingComponent } from './vessel-tab-tracking.component';
import { MapComponent, MapConfig, OSM_STYLE } from '@ghanawaters/shared-map';

export interface VesselFormData {
  name: string;
  vessel_type_id: number;
}

@Component({
  selector: 'app-vessel-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    TabsModule,
    ConfirmDialogModule,
    VesselTabDeviceComponent,
    VesselTabTrackingComponent,
    MapComponent,
    TimestampPipe
  ],
  providers: [ConfirmationService],
  template: `
    <div class="vessel-form-container">
      <!-- Create Mode: Show form without tabs -->
      @if (mode() === 'create') {
        <form [formGroup]="vesselForm">
          <div class="form-content">
            <div class="grid">
              <div class="col-12">
                <h3 class="text-lg">Basic Information</h3>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="name" class="block mb-2">Name *</label>
                  <input
                    type="text"
                    pInputText
                    id="name"
                    formControlName="name"
                    class="w-full"
                    placeholder="Enter vessel name"
                  />
                  @if (vesselForm.get('name')?.invalid && vesselForm.get('name')?.touched) {
                    <small class="p-error text-xs">Vessel name is required</small>
                  }
                </div>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="field">
                  <label for="vessel_type_id" class="block mb-2">Type *</label>
                  <p-select
                    id="vessel_type_id"
                    formControlName="vessel_type_id"
                    [options]="vesselTypes()"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select vessel type"
                    styleClass="w-full"
                    [panelStyle]="{'max-height':'200px'}"
                  ></p-select>
                  @if (vesselForm.get('vessel_type_id')?.invalid && vesselForm.get('vessel_type_id')?.touched) {
                    <small class="p-error text-xs">Vessel type is required</small>
                  }
                </div>
              </div>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="form-actions">
            <div class="flex items-center justify-between w-full">
              <div class="text-sm text-gray-500">
                @if (!vesselForm.valid) {
                  <span class="text-orange-500">Please fill in all required fields</span>
                }
              </div>
              <div class="flex gap-2">
                <p-button
                  label="Cancel"
                  severity="secondary"
                  type="button"
                  (onClick)="onCancel()"
                ></p-button>
                <p-button
                  label="Save"
                  type="button"
                  icon="pi pi-check"
                  (onClick)="saveVessel()"
                  [disabled]="!canSave()"
                ></p-button>
              </div>
            </div>
          </div>
        </form>
      }
      
      <!-- Edit Mode: Show tabs with form in Info tab -->
      @if (mode() === 'edit' && vessel()) {
        <form [formGroup]="vesselForm" class="edit-mode-form">
          <p-tabs [value]="activeTabIndex().toString()" (onChange)="onTabChange($event)" styleClass="vessel-tabs">
            <p-tablist>
              <p-tab value="0">
                <i class="pi pi-info-circle"></i>
                <span class="ml-2">Info</span>
              </p-tab>
              <p-tab value="1">
                <i class="pi pi-mobile"></i>
                <span class="ml-2">Device</span>
              </p-tab>
              <p-tab value="2">
                <i class="pi pi-map-marker"></i>
                <span class="ml-2">Track</span>
              </p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div class="tab-content">
                  <div class="flex gap-3" style="height: 100%;">
                    <!-- Left side: Map (60%) -->
                    <div class="map-section">
                      @if (hasActiveDevice() && hasValidPosition()) {
                        <lib-map 
                          [config]="mapConfig()"
                          [vesselFilter]="vessel()!.id">
                        </lib-map>
                      } @else if (hasActiveDevice() && !hasValidPosition()) {
                        <div class="no-position-message">
                          <div class="no-position-content">
                            <i class="pi pi-map-marker text-4xl mb-3 text-gray-400"></i>
                            <h5 class="text-lg mb-2">No Position Data</h5>
                            <p class="text-muted text-sm">Device is active but no position has been reported yet.</p>
                          </div>
                        </div>
                      } @else {
                        <div class="no-device-message">
                          <div class="no-device-content">
                            <i class="pi pi-mobile text-4xl mb-3 text-gray-400"></i>
                            <h5 class="text-lg mb-2">No Active Device</h5>
                            <p class="text-muted text-sm">To see live position data, go to the Device tab and connect a device.</p>
                          </div>
                        </div>
                      }
                    </div>
                    
                    <!-- Right side: Vessel Info (40%) -->
                    <div class="form-panel">
                      <div class="form-content">
                        <div class="field">
                          <label class="block mb-2">ID</label>
                          <div class="field-value">{{ vessel()!.id }}</div>
                        </div>
                        
                        <div class="field">
                          <label class="block mb-2">Created</label>
                          <div class="field-value">{{ vessel()!.created | timestamp }}</div>
                        </div>
                        
                        <div class="field">
                          <label for="edit-name" class="block mb-2">Name *</label>
                          <input
                            type="text"
                            pInputText
                            id="edit-name"
                            formControlName="name"
                            class="w-full"
                            placeholder="Enter vessel name"
                          />
                          @if (vesselForm.get('name')?.invalid && vesselForm.get('name')?.touched) {
                            <small class="p-error text-xs">Vessel name is required</small>
                          }
                        </div>
                        
                        <div class="field">
                          <label for="edit-vessel_type_id" class="block mb-2">Type *</label>
                          <p-select
                            id="edit-vessel_type_id"
                            formControlName="vessel_type_id"
                            [options]="vesselTypes()"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select vessel type"
                            styleClass="w-full"
                            [panelStyle]="{'max-height':'200px'}"
                          ></p-select>
                          @if (vesselForm.get('vessel_type_id')?.invalid && vesselForm.get('vessel_type_id')?.touched) {
                            <small class="p-error text-xs">Vessel type is required</small>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </p-tabpanel>
              
              <p-tabpanel value="1">
                <app-vessel-tab-device 
                  [vessel]="vessel()" 
                  [editMode]="true"
                  (deviceUpdated)="onDeviceUpdated()">
                </app-vessel-tab-device>
              </p-tabpanel>
              
              <p-tabpanel value="2">
                <app-vessel-tab-tracking 
                  [vessel]="vessel()"
                  [isVisible]="activeTabIndex() === 2">
                </app-vessel-tab-tracking>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
          
          <!-- Form Actions -->
          <div class="form-actions">
            <div class="flex items-center justify-between w-full">
              <div class="text-sm text-gray-500">
                @if (!canSave()) {
                  <span class="text-gray-500">No changes to save</span>
                }
              </div>
              <div class="flex gap-2">
                <p-button
                  label="Cancel"
                  severity="secondary"
                  type="button"
                  (onClick)="onCancel()"
                ></p-button>
                <p-button
                  label="Save"
                  type="button"
                  icon="pi pi-check"
                  (onClick)="saveVessel()"
                  [disabled]="!canSave()"
                ></p-button>
              </div>
            </div>
          </div>
        </form>
      }
      
      <!-- View Mode: Show tabs -->
      @if (mode() === 'view' && vessel()) {
        <div class="view-mode-container">
          <p-tabs [value]="activeTabIndex().toString()" (onChange)="onTabChange($event)" styleClass="vessel-tabs">
            <p-tablist>
              <p-tab value="0">
                <i class="pi pi-info-circle"></i>
                <span class="ml-2">Info</span>
              </p-tab>
              <p-tab value="1">
                <i class="pi pi-mobile"></i>
                <span class="ml-2">Device</span>
              </p-tab>
              <p-tab value="2">
                <i class="pi pi-map-marker"></i>
                <span class="ml-2">Track</span>
              </p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div class="tab-content">
                  <div class="flex gap-3" style="height: 100%;">
                    <!-- Left side: Map (60%) -->
                    <div class="map-section">
                      @if (hasActiveDevice() && hasValidPosition()) {
                        <lib-map 
                          [config]="mapConfig()"
                          [vesselFilter]="vessel()!.id">
                        </lib-map>
                      } @else if (hasActiveDevice() && !hasValidPosition()) {
                        <div class="no-position-message">
                          <div class="no-position-content">
                            <i class="pi pi-map-marker text-4xl mb-3 text-gray-400"></i>
                            <h5 class="text-lg mb-2">No Position Data</h5>
                            <p class="text-muted text-sm">Device is active but no position has been reported yet.</p>
                          </div>
                        </div>
                      } @else {
                        <div class="no-device-message">
                          <div class="no-device-content">
                            <i class="pi pi-mobile text-4xl mb-3 text-gray-400"></i>
                            <h5 class="text-lg mb-2">No Active Device</h5>
                            <p class="text-muted text-sm">To see live position data, go to the Device tab and connect a device.</p>
                          </div>
                        </div>
                      }
                    </div>
                    
                    <!-- Right side: Vessel Info (40%) -->
                    <div class="form-panel">
                      <div class="form-content">
                        <form [formGroup]="vesselForm">
                          <div class="field">
                            <label class="block mb-2">ID</label>
                            <div class="field-value">{{ vessel()!.id }}</div>
                          </div>
                          
                          <div class="field">
                            <label class="block mb-2">Created</label>
                            <div class="field-value">{{ vessel()!.created | timestamp }}</div>
                          </div>
                          
                          <div class="field">
                            <label for="view-name" class="block mb-2">Name *</label>
                            <input
                              type="text"
                              pInputText
                              id="view-name"
                              formControlName="name"
                              class="w-full"
                              placeholder="Enter vessel name"
                            />
                          </div>
                          
                          <div class="field">
                            <label for="view-vessel_type_id" class="block mb-2">Type *</label>
                            <p-select
                              id="view-vessel_type_id"
                              formControlName="vessel_type_id"
                              [options]="vesselTypes()"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="Select vessel type"
                              styleClass="w-full"
                              [panelStyle]="{'max-height':'200px'}"
                            ></p-select>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </p-tabpanel>
              
              <p-tabpanel value="1">
                <app-vessel-tab-device 
                  [vessel]="vessel()" 
                  [viewMode]="true"
                  (deviceUpdated)="onDeviceUpdated()">
                </app-vessel-tab-device>
              </p-tabpanel>
              
              <p-tabpanel value="2">
                <app-vessel-tab-tracking 
                  [vessel]="vessel()"
                  [isVisible]="activeTabIndex() === 2">
                </app-vessel-tab-tracking>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
          
          <!-- View mode actions -->
          <div class="form-actions">
            <p-button
              label="Close"
              severity="secondary"
              type="button"
              (onClick)="cancel.emit()"
            ></p-button>
          </div>
        </div>
      }
      
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  host: {
    class: 'vessel-form-host'
  },
  styles: [`
    .vessel-form-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .form-content {
      flex: 1;
      padding: 1.5rem;
      overflow: visible;
    }
    
    .view-mode-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .edit-mode-form {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .form-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: flex-end;
    }
    
    .field {
      margin-bottom: 1.5rem;
    }
    
    .field label {
      font-weight: 500;
      color: var(--text-color);
    }
    
    .field-value {
      padding: 0.5rem 0.75rem;
      background-color: var(--surface-100);
      border: 1px solid var(--surface-300);
      border-radius: var(--border-radius);
      color: var(--text-color);
      font-size: 1rem;
      line-height: 1.5;
    }
    
    h3 {
      color: var(--text-color);
      font-weight: 600;
      margin: 0 0 1rem 0;
    }
    
    .vessel-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .tab-content {
      padding: 1.5rem;
    }
    
    .vessel-meta-info {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }
    
    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    
    .meta-label {
      font-weight: 500;
      color: var(--text-color-secondary);
      min-width: 120px;
    }
    
    .meta-value {
      color: var(--text-color);
    }
    
    .font-mono {
      font-family: 'Courier New', monospace;
      background-color: var(--surface-100);
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-weight: 400;
      color: var(--text-color);
      border: 1px solid var(--surface-300);
    }
    
    :host ::ng-deep .vessel-tabs .p-tabview-panels {
      flex: 1;
      overflow-y: auto;
    }
    
    :host ::ng-deep .vessel-tabs .p-tabview-panel {
      height: 100%;
      padding: 0;
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
    }
    
    .no-device-message,
    .no-position-message {
      width: 100%;
      height: 100%;
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-50);
      border: 2px dashed var(--surface-300);
      border-radius: 8px;
    }
    
    .form-panel .form-content {
      min-height: 500px;
    }
    
    .no-device-content,
    .no-position-content {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
    }
    
    .no-device-content h5,
    .no-position-content h5 {
      color: var(--text-color);
      margin: 0.5rem 0;
    }
    
    .no-device-content .text-muted,
    .no-position-content .text-muted {
      color: var(--text-color-secondary);
      line-height: 1.5;
    }
  `]
})
export class VesselFormComponent implements OnInit, OnDestroy {
  // Dependency injection
  private fb = inject(FormBuilder);
  private vesselTypeService = inject(VesselTypeService);
  private confirmationService = inject(ConfirmationService);
  private http = inject(HttpClient);
  
  // Inputs and outputs
  vessel = input<VesselDataset | null>(null);
  mode = input<'view' | 'edit' | 'create'>('view');
  save = output<VesselFormData>();
  cancel = output<void>();
  deviceUpdated = output<void>();
  
  // State
  vesselForm: FormGroup;
  vesselTypes = signal<VesselType[]>([]);
  activeTabIndex = signal<number>(0);
  
  // Device and map state
  activeDevice = signal<DeviceResponse | null>(null);
  loadingDevices = signal(false);
  mapConfig = signal<Partial<MapConfig>>({});
  
  // Change tracking
  currentFormValues = signal<VesselFormData>({ 
    name: '', 
    vessel_type_id: 11 // Default to Unspecified
  });
  originalFormValues = signal<VesselFormData | null>(null);
  
  // Subscriptions
  private formValueSubscription?: Subscription;
  
  // Computed values
  canSave = computed(() => {
    const mode = this.mode();
    const current = this.currentFormValues();
    
    // Basic validation
    const hasValidName = current.name && current.name.trim().length > 0;
    const hasValidType = current.vessel_type_id > 0;
    
    if (!hasValidName || !hasValidType) {
      return false;
    }
    
    // For edit mode, also require changes
    if (mode === 'edit') {
      return this.hasChanges();
    }
    
    // For create mode, basic requirements are enough
    return true;
  });
  
  hasActiveDevice = computed(() => {
    return this.activeDevice() !== null;
  });
  
  hasValidPosition = computed(() => {
    const vessel = this.vessel();
    return !!(vessel?.last_position?.latitude && vessel?.last_position?.longitude);
  });
  
  constructor() {
    // Initialize form
    this.vesselForm = this.fb.nonNullable.group({
      name: ['', Validators.required],
      vessel_type_id: [11, Validators.required] // Default to Unspecified
    });
    
    // Effects to watch for changes
    effect(() => {
      const currentMode = this.mode();
      this.updateFormState();
    });
    
    effect(() => {
      const currentVessel = this.vessel();
      if (currentVessel !== null || this.mode() === 'create') {
        this.resetFormWithVesselData();
        if (currentVessel !== null) {
          this.loadDevices();
          this.updateMapConfig();
        }
      }
    });
  }
  
  ngOnInit() {
    // Load vessel types
    this.loadVesselTypes();
    
    // Track form value changes
    this.formValueSubscription = this.vesselForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe((values) => {
        this.currentFormValues.set(values);
      });
  }
  
  ngOnDestroy() {
    this.formValueSubscription?.unsubscribe();
  }
  
  private loadVesselTypes() {
    this.vesselTypeService.getAll().subscribe({
      next: (types) => {
        this.vesselTypes.set(types);
      },
      error: (error) => {
        console.error('Error loading vessel types:', error);
      }
    });
  }
  
  private updateFormState(): void {
    if (this.mode() === 'view') {
      this.vesselForm.disable();
    } else {
      this.vesselForm.enable();
    }
  }
  
  private resetFormWithVesselData(): void {
    const vessel = this.vessel();
    const mode = this.mode();
    
    if (mode === 'create') {
      // Reset to empty form for create mode
      const emptyData: VesselFormData = {
        name: '',
        vessel_type_id: 11 // Default to Unspecified
      };
      this.vesselForm.patchValue(emptyData);
      this.currentFormValues.set(emptyData);
      this.originalFormValues.set(null);
    } else if (vessel) {
      // Load vessel data for edit/view modes
      const formData: VesselFormData = {
        name: vessel.name,
        vessel_type_id: vessel.vessel_type_id
      };
      this.vesselForm.patchValue(formData);
      this.currentFormValues.set(formData);
      
      // Store original values for change detection
      if (mode === 'edit') {
        this.originalFormValues.set({ ...formData });
      }
    }
    
    // Update form state based on mode
    this.updateFormState();
  }
  
  private hasChanges(): boolean {
    const current = this.currentFormValues();
    const original = this.originalFormValues();
    
    if (!original) {
      return false;
    }
    
    return (
      current.name !== original.name ||
      current.vessel_type_id !== original.vessel_type_id
    );
  }
  
  saveVessel(): void {
    if (this.vesselForm.valid && this.canSave()) {
      const formData = this.currentFormValues();
      this.save.emit(formData);
    }
  }
  
  onCancel(): void {
    if (this.hasChanges() && this.mode() === 'edit') {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.cancel.emit();
        }
      });
    } else {
      this.cancel.emit();
    }
  }
  
  onTabChange(event: any): void {
    this.activeTabIndex.set(parseInt(event.value, 10));
    
    // Restore focus to dialog content so ESC key continues to work
    setTimeout(() => {
      const dialogContent = document.querySelector('.p-dialog-content');
      if (dialogContent instanceof HTMLElement) {
        dialogContent.focus();
      }
    }, 0);
  }
  
  private loadDevices(): void {
    const vessel = this.vessel();
    if (!vessel) return;
    
    this.loadingDevices.set(true);
    this.http.get<DeviceResponse[]>(`/api/devices?vessel_id=${vessel.id}`).subscribe({
      next: (devices: DeviceResponse[]) => {
        const active = devices.find(d => d.state === DeviceState.ACTIVE);
        this.activeDevice.set(active || null);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading devices:', error);
        this.activeDevice.set(null);
      },
      complete: () => {
        this.loadingDevices.set(false);
      }
    });
  }
  
  private updateMapConfig(): void {
    const vessel = this.vessel();
    if (!vessel || !this.hasValidPosition()) {
      return;
    }
    
    const lng = vessel.last_position!.longitude;
    const lat = vessel.last_position!.latitude;
    
    this.mapConfig.set({
      mapStyle: OSM_STYLE,
      center: [lng, lat],
      zoom: 12.5,
      minZoom: 1,
      maxZoom: 18,
      height: '100%',
      showControls: false,
      showFullscreenControl: true,
      showCoordinateDisplay: true,
      availableLayers: [],
      initialActiveLayers: []
    });
  }

  onDeviceUpdated(): void {
    this.loadDevices(); // Reload devices when updated
    this.deviceUpdated.emit();
  }
}