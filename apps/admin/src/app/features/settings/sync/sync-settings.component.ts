import { Component, OnInit, inject, signal, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SyncService } from './sync.service';
import { SyncManageResponse, EntityStats, RecentEntry, SyncEntryDetail } from '@ghanawaters/shared-models';

@Component({
  selector: 'app-sync-settings',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule
  ],
  providers: [SyncService, MessageService, ConfirmationService],
  template: `
    <div class="sync-settings">
      @if (loading()) {
        <div class="flex justify-content-center align-items-center" style="height: 400px;">
          <p-progressSpinner></p-progressSpinner>
        </div>
      } @else {
        @if (syncData()) {
          <div class="grid">
            <!-- Summary Card -->
            <div class="col-12">
              <p-card>
              <ng-template pTemplate="header">
                <div class="flex align-items-center justify-content-between w-full">
                  <span>Sync Summary</span>
                  <p-button 
                    label="Reset Sync" 
                    icon="pi pi-refresh" 
                    severity="danger" 
                    [loading]="resetting()"
                    (onClick)="confirmReset()">
                  </p-button>
                </div>
              </ng-template>
              <div class="flex justify-content-around align-items-start flex-wrap gap-3">
                <div class="text-center">
                  <div class="text-600 text-sm">Major Version</div>
                  <div class="text-900 text-2xl font-bold">v{{ syncData()!.majorVersion }}</div>
                </div>
                <div class="text-center">
                  <div class="text-600 text-sm">Last Sync Version</div>
                  <div class="text-900 text-xl font-medium">{{ formatDate(syncData()!.summary.lastSyncVersion) }}</div>
                </div>
                <div class="text-center">
                  <div class="text-600 text-sm">Total Sync Entries</div>
                  <div class="text-900 text-xl font-medium">{{ syncData()!.summary.totalEntries }}</div>
                </div>
              </div>
            </p-card>
          </div>

          <!-- Sync Entries -->
          <div class="col-12">
            <p-card header="Sync Entries">
              <p-table 
                [value]="syncData()!.recentEntries" 
                [scrollable]="true" 
                scrollHeight="250px"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 25, 50, 100]"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries">
                <ng-template pTemplate="header">
                  <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Size</th>
                    <th class="text-center">Details</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-entry>
                  <tr>
                    <td>{{ entry.id }}</td>
                    <td>
                      @if (entry.timestamp) {
                        {{ formatTimestamp(entry.timestamp) }}
                      } @else {
                        <span class="text-600">-</span>
                      }
                    </td>
                    <td>
                      @if (entry.hasData) {
                        {{ formatBytes(entry.dataSize) }}
                      } @else {
                        <span class="text-600">-</span>
                      }
                    </td>
                    <td class="text-center">
                      <p-button 
                        icon="pi pi-info-circle" 
                        severity="info" 
                        size="small"
                        [text]="true"
                        (onClick)="showDetails(entry.id)"
                        pTooltip="View details">
                      </p-button>
                    </td>
                  </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="4" class="text-center text-600">No sync entries found</td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>
          </div>
        </div>
        } @else {
          <div class="flex justify-content-center align-items-center" style="height: 400px;">
            <div class="text-center">
              <i class="pi pi-sync text-5xl text-300 mb-3"></i>
              <p class="text-600">No sync data available</p>
            </div>
          </div>
        }
      }
    </div>
    
    <!-- Sync Entry Detail Dialog -->
    <p-dialog 
      [(visible)]="detailDialogVisible" 
      [modal]="true" 
      [style]="{width: '800px'}" 
      [closable]="true" 
      header="Sync Entry Details"
      [appendTo]="'body'">
      
      @if (selectedEntry()) {
        <div class="sync-entry-details">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">ID:</label>
                <div class="mt-1">{{ selectedEntry()!.id }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">Entity Type:</label>
                <div class="mt-1">{{ formatEntityType(selectedEntry()!.entityType) }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">Entity ID:</label>
                <div class="mt-1">{{ selectedEntry()!.entityId }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">Operation:</label>
                <div class="mt-1">
                  <p-tag 
                    [severity]="getActionSeverity(selectedEntry()!.action)" 
                    [value]="selectedEntry()!.action.toUpperCase()">
                  </p-tag>
                </div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">Created At:</label>
                <div class="mt-1">{{ formatDate(selectedEntry()!.createdAt) }}</div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="field">
                <label class="font-semibold">Major Version:</label>
                <div class="mt-1">v{{ selectedEntry()!.majorVersion }}</div>
              </div>
            </div>
            <div class="col-12">
              <div class="field">
                <label class="font-semibold">Data:</label>
                <div class="mt-2">
                  @if (selectedEntry()!.data) {
                    <pre class="data-display">{{ formatJsonData(selectedEntry()!.data) }}</pre>
                  } @else {
                    <span class="text-600">No data</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      
      @if (loadingDetails()) {
        <div class="flex justify-content-center align-items-center" style="height: 200px;">
          <p-progressSpinner></p-progressSpinner>
        </div>
      }
    </p-dialog>
    
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styles: [`
    .sync-settings {
      padding: 1rem;
    }
    
    .grid {
      margin: -0.5rem;
    }
    
    .grid > div {
      padding: 0.5rem;
    }
    
    p-card {
      height: 100%;
    }
    
    .data-display {
      background-color: var(--surface-100);
      border: 1px solid var(--surface-200);
      border-radius: 4px;
      padding: 1rem;
      font-family: 'Courier New', Consolas, monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
      word-break: break-all;
    }
    
    .sync-entry-details .field {
      margin-bottom: 1rem;
    }
    
    .sync-entry-details .field:last-child {
      margin-bottom: 0;
    }
  `],
  host: {
    class: 'sync-settings-host'
  }
})
export class SyncSettingsComponent implements OnInit, OnChanges {
  private readonly syncService = inject(SyncService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  
  @Input() isVisible: boolean = false;
  
  loading = signal(false);
  resetting = signal(false);
  syncData = signal<SyncManageResponse | null>(null);
  dataLoaded = false;
  
  // Detail dialog properties
  detailDialogVisible = false;
  loadingDetails = signal(false);
  selectedEntry = signal<SyncEntryDetail | null>(null);

  ngOnInit() {
    // Load data immediately when component initializes
    if (!this.dataLoaded) {
      this.loadSyncData();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if visibility changed to true and data hasn't been loaded yet
    if (changes['isVisible'] && this.isVisible && !this.dataLoaded) {
      this.loadSyncData();
    }
  }

  loadSyncData() {
    this.loading.set(true);
    this.dataLoaded = true; // Mark as loaded to prevent re-fetching
    
    this.syncService.getSyncManageData().subscribe({
      next: (data) => {
        this.syncData.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading sync data:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sync data'
        });
        this.loading.set(false);
        this.dataLoaded = false; // Allow retry on error
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatEntityType(type: string): string {
    return type.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getActionSeverity(action: string): 'success' | 'info' | 'danger' {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'danger';
      default:
        return 'info';
    }
  }

  showDetails(entryId: number) {
    this.detailDialogVisible = true;
    this.loadingDetails.set(true);
    this.selectedEntry.set(null);
    
    this.syncService.getSyncEntryById(entryId).subscribe({
      next: (entry) => {
        this.selectedEntry.set(entry);
        this.loadingDetails.set(false);
      },
      error: (error) => {
        console.error('Error loading sync entry details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sync entry details'
        });
        this.loadingDetails.set(false);
        this.detailDialogVisible = false;
      }
    });
  }

  formatJsonData(data: any): string {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  }

  confirmReset() {
    const currentVersion = this.syncData()?.majorVersion || 1;
    const nextVersion = currentVersion + 1;
    
    this.confirmationService.confirm({
      message: `This will create a new sync baseline (major version ${nextVersion}). All mobile apps will reset their local data on next sync. Continue?`,
      header: 'Reset Sync Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.resetSync();
      }
    });
  }

  private resetSync() {
    this.resetting.set(true);
    
    this.syncService.resetSync().subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Sync reset successfully. New major version: ${response.majorVersion}`
        });
        
        // Reload sync data to show new version
        this.loadSyncData();
        this.resetting.set(false);
      },
      error: (error) => {
        console.error('Error resetting sync:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to reset sync'
        });
        this.resetting.set(false);
      }
    });
  }
}