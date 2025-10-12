import { Component, OnInit, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KmlDatasetResponse } from '@ghanawaters/shared-models';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-kml-dataset-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    ButtonModule
  ],
  template: `
    <form [formGroup]="kmlForm" class="form-container">
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

      <div class="form-group">
        <label for="kml" class="form-label">KML Content <span class="required-asterisk">*</span></label>
        <textarea
          pTextarea
          id="kml"
          formControlName="kml"
          placeholder="Paste your KML content here"
          rows="15"
          class="w-full kml-textarea"
          [ngClass]="{'ng-invalid ng-dirty': kmlForm.controls['kml'].invalid && kmlForm.controls['kml'].touched}"
          [readonly]="mode() === 'view'"
        ></textarea>
        @if (kmlForm.controls['kml'].invalid && kmlForm.controls['kml'].touched) {
          <small class="p-error block mt-1 text-xs">KML content is required.</small>
        }
      </div>

      <div class="form-actions flex justify-end gap-2 mt-4">
        @if (mode() !== 'view') {
          <button
            pButton
            type="button"
            label="Save"
            icon="pi pi-check"
            class="p-button-success"
            (click)="onSave()"
            [disabled]="kmlForm.invalid"
          ></button>
        }
        <button
          pButton
          type="button"
          label="Cancel"
          icon="pi pi-times"
          class="p-button-secondary"
          (click)="onCancel()"
        ></button>
      </div>
    </form>
  `,
  styles: [`
    .form-container {
      padding: 0.5rem 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
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
      min-height: 150px;
    }

    .p-field-checkbox {
      display: flex;
      align-items: center;
    }

    .w-full { width: 100%; }
    .ml-2 { margin-left: 0.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-4 { margin-top: 1rem; }
    .block { display: block; }
    .flex { display: flex; }
    .justify-end { justify-content: flex-end; }
    .gap-2 { gap: 0.5rem; }

    .ng-invalid.ng-dirty {
      border-color: var(--red-500, #f44336);
    }
  `]
})
export class KmlDatasetFormComponent implements OnInit {
  // Inputs
  dataset = input<KmlDatasetResponse | null>(null);
  mode = input<'view' | 'edit' | 'create'>('create');

  // Outputs
  save = output<KmlDatasetResponse>();
  cancel = output<void>();

  // Services
  private fb = inject(FormBuilder);

  // Form
  kmlForm!: FormGroup;

  // Effect to populate form when dataset changes
  private datasetEffect = effect(() => {
    const currentDataset = this.dataset();
    if (currentDataset) {
      this.kmlForm.patchValue({
        name: currentDataset.name || '',
        enabled: currentDataset.enabled,
        kml: currentDataset.kml || ''
      });
    } else {
      this.kmlForm.reset({
        name: '',
        enabled: true,
        kml: ''
      });
    }
  });

  ngOnInit() {
    this.kmlForm = this.fb.group({
      name: ['', Validators.required],
      enabled: [true],
      kml: ['', Validators.required]
    });
  }

  onSave() {
    if (this.kmlForm.valid) {
      const formValue = this.kmlForm.value;
      const dataset = this.dataset();

      const result: KmlDatasetResponse = {
        ...formValue,
        id: dataset?.id,
        created: dataset?.created,
        last_updated: dataset?.last_updated
      };

      this.save.emit(result);
    } else {
      this.kmlForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
