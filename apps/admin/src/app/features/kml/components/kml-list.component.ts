import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, TemplateRef, signal, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ResourceListComponent, ResourceListConfig, ResourceAction, TimestampPipe } from '@ghanawaters/shared';
import { KmlDatasetService } from '../services/kml-dataset.service';
import { KmlDatasetResponse } from '@ghanawaters/shared-models';
import { KmlDatasetFormComponent } from './kml-dataset-form.component';

@Component({
  selector: 'app-kml-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TagModule,
    ResourceListComponent,
    KmlDatasetFormComponent,
    TimestampPipe
  ],
  providers: [MessageService],
  template: `
    <lib-resource-list
      [config]="listConfig"
      [data]="datasets()"
      [loading]="loading()"
      [dialogMode]="dialogMode()"
      [selectedItem]="selectedDataset()"
      [showDialog]="showDialog"
      (showDialogChange)="showDialog = $event"
      (action)="handleAction($event)">

      @if (showDialog) {
        <app-kml-dataset-form
          formContent
          #datasetForm
          [dataset]="selectedDataset()"
          [mode]="dialogMode()"
          (save)="saveDataset($event)"
          (cancel)="showDialog = false">
        </app-kml-dataset-form>
      }
    </lib-resource-list>

    <!-- Column Templates -->
    <ng-template #statusTemplate let-item>
      <p-tag
        [value]="item.enabled ? 'Active' : 'Inactive'"
        [severity]="item.enabled ? 'success' : 'danger'">
      </p-tag>
    </ng-template>

    <ng-template #lastUpdatedTemplate let-item>
      {{ item.last_updated | timestamp }}
    </ng-template>
  `,
  host: {
    'class': 'kml-list-host'
  }
})
export class KmlListComponent implements OnInit, AfterViewInit {
  // Services
  private kmlDatasetService = inject(KmlDatasetService);
  private messageService = inject(MessageService);

  // View children
  datasetFormComponent = viewChild<KmlDatasetFormComponent>('datasetForm');
  statusTemplate = viewChild.required<TemplateRef<any>>('statusTemplate');
  lastUpdatedTemplate = viewChild.required<TemplateRef<any>>('lastUpdatedTemplate');

  // Signals
  datasets = signal<KmlDatasetResponse[]>([]);
  selectedDataset = signal<KmlDatasetResponse | null>(null);
  loading = signal(false);
  showDialog = false;
  dialogMode = signal<'view' | 'edit' | 'create'>('create');

  listConfig!: ResourceListConfig<KmlDatasetResponse>;

  ngOnInit() {
    // Initialize config without template references
    this.listConfig = {
      title: '',
      searchPlaceholder: 'Search KML datasets...',
      newButtonLabel: 'New KML Dataset',
      entityName: 'datasets',
      entityNameSingular: 'dataset',
      columns: [
        { field: 'id', header: 'ID', sortable: true, width: '10%' },
        { field: 'name', header: 'Name', sortable: true, width: '30%' },
        { field: 'enabled', header: 'Status', sortable: true, width: '15%' },
        { field: 'last_updated', header: 'Last Updated', sortable: true, width: '20%' }
      ],
      searchFields: ['name', 'id'],
      actions: {
        view: true,
        edit: true,
        delete: true
      },
      deleteConfirmMessage: (item) => `Are you sure you want to delete the KML dataset "${item.name}"?`,
      emptyMessage: 'No KML datasets found',
      pageSize: 10
    };

    this.loadDatasets();
  }

  ngAfterViewInit() {
    // Now add the template references
    this.listConfig.columns[2].template = this.statusTemplate();
    this.listConfig.columns[3].template = this.lastUpdatedTemplate();
  }

  loadDatasets() {
    this.loading.set(true);
    this.kmlDatasetService.getAll().subscribe({
      next: (datasets) => {
        this.datasets.set(datasets);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || error.message || 'Failed to load KML datasets'
        });
      }
    });
  }

  handleAction(action: ResourceAction<KmlDatasetResponse>) {
    switch (action.type) {
      case 'create':
        this.showCreateDialog();
        break;
      case 'view':
        if (action.item) this.viewDataset(action.item);
        break;
      case 'edit':
        if (action.item) this.editDataset(action.item);
        break;
      case 'delete':
        if (action.item) this.deleteDataset(action.item);
        break;
    }
  }

  showCreateDialog() {
    this.selectedDataset.set(null);
    this.dialogMode.set('create');
    this.showDialog = true;
  }

  viewDataset(dataset: KmlDatasetResponse) {
    this.selectedDataset.set(dataset);
    this.dialogMode.set('view');
    this.showDialog = true;
  }

  editDataset(dataset: KmlDatasetResponse) {
    // Make a copy of the dataset
    this.selectedDataset.set({ ...dataset });
    this.dialogMode.set('edit');
    this.showDialog = true;
  }

  saveDataset(dataset: KmlDatasetResponse) {
    if (this.dialogMode() === 'create') {
      this.kmlDatasetService.create(dataset).subscribe({
        next: (newDataset) => {
          this.datasets.update(datasets => [...datasets, newDataset]);
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'KML dataset created successfully'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || error.message || 'Failed to create KML dataset'
          });
        }
      });
    } else if (this.dialogMode() === 'edit' && dataset.id) {
      this.kmlDatasetService.update(dataset.id, dataset).subscribe({
        next: (updatedDataset) => {
          this.datasets.update(datasets =>
            datasets.map(d => d.id === updatedDataset.id ? updatedDataset : d)
          );
          this.showDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'KML dataset updated successfully'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || error.message || 'Failed to update KML dataset'
          });
        }
      });
    }
  }

  deleteDataset(dataset: KmlDatasetResponse) {
    if (dataset.id) {
      this.kmlDatasetService.delete(dataset.id).subscribe({
        next: () => {
          this.datasets.update(datasets => datasets.filter(d => d.id !== dataset.id));
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'KML dataset deleted successfully'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || error.message || 'Failed to delete KML dataset'
          });
        }
      });
    }
  }
}
