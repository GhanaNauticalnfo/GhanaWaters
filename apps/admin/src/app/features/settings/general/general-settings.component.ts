import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="general-settings">
      <div class="min-h-[400px]">
        <div class="flex-1">
          <p class="text-500">No general settings available at this time.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .general-settings {
      padding: 1rem;
    }
  `]
})
export class GeneralSettingsComponent {}