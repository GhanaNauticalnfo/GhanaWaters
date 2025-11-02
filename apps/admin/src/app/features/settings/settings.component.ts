import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { GeneralSettingsComponent } from './general/general-settings.component';
import { VesselTypeListComponent } from './vessel-types/vessel-type-list.component';
import { SyncSettingsComponent } from './sync/sync-settings.component';
import { DatabaseSettingsComponent } from './database/database-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    ToastModule,
    GeneralSettingsComponent,
    VesselTypeListComponent,
    SyncSettingsComponent,
    DatabaseSettingsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  template: `
    <div class="px-5 pb-5 settings-host">
      <div class="page-header">
        <h2 class="text-2xl">Settings</h2>
      </div>

      <p-tabs
        [value]="activeTabIndex()"
        (valueChange)="onTabValueChange($event)"
        styleClass="settings-tabs">

        <p-tablist>
          <p-tab [value]="0">
            <i class="pi pi-cog"></i>
            <span class="ml-2">General</span>
          </p-tab>
          <p-tab [value]="1">
            <i class="pi pi-ship"></i>
            <span class="ml-2">Vessel Types</span>
          </p-tab>
          <p-tab [value]="2">
            <i class="pi pi-sync"></i>
            <span class="ml-2">Sync</span>
          </p-tab>
          <p-tab [value]="3">
            <i class="pi pi-database"></i>
            <span class="ml-2">Database</span>
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel [value]="0">
            <app-general-settings></app-general-settings>
          </p-tabpanel>

          <p-tabpanel [value]="1">
            <app-vessel-type-list></app-vessel-type-list>
          </p-tabpanel>

          <p-tabpanel [value]="2">
            <app-sync-settings [isVisible]="activeTabIndex() === 2"></app-sync-settings>
          </p-tabpanel>

          <p-tabpanel [value]="3">
            <app-database-settings></app-database-settings>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <p-toast></p-toast>
  `
})
export class SettingsComponent {
  private readonly messageService = inject(MessageService);

  // Keep as number to match tab values
  activeTabIndex = signal(0);

  onTabValueChange(value: number | string): void {
    // Coerce just in case the event comes as a string
    this.activeTabIndex.set(Number(value));
  }
}
