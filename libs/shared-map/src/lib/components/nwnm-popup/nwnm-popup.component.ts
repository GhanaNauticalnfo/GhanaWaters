import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NwNmFeatureProperties } from '../../layers/nwnm/nw-nm.models';

@Component({
  selector: 'app-nwnm-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nwnm-popup.component.html',
  styleUrls: ['./nwnm-popup.component.css']
})
export class NwnmPopupComponent {
  @Input() message!: NwNmFeatureProperties;

  constructor(private sanitizer: DomSanitizer) {}

  get statusClass(): string {
    return `status-${this.message.status || 'PUBLISHED'}`;
  }

  get messageIdDisplay(): string {
    // Show short ID or regular ID
    return this.message.shortId || this.message.id?.toString() || 'N/A';
  }

  get typeSuffix(): string {
    // Add T for temporary, P for preliminary
    if (this.message.type?.includes('TEMPORARY')) return ' (T)';
    if (this.message.type?.includes('PRELIMINARY')) return ' (P)';
    return '';
  }

  get safeDescription(): SafeHtml {
    // Sanitize HTML content from Niord
    const desc = this.message.description || this.message.descs?.[0]?.details || '';
    return this.sanitizer.sanitize(1, desc) || '';
  }

  get publishDate(): string {
    if (!this.message.publishDateFrom) return '';
    const from = new Date(this.message.publishDateFrom);
    const to = this.message.publishDateTo ? new Date(this.message.publishDateTo) : null;

    if (to && from.getTime() !== to.getTime()) {
      return `${this.formatDate(from)} - ${this.formatDate(to)}`;
    }
    return this.formatDate(from);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  get areaNames(): string {
    if (!this.message.areas || this.message.areas.length === 0) return '';
    return this.message.areas
      .map((area: any) => area.descs?.[0]?.name || area.name)
      .filter(Boolean)
      .join(' / ');
  }
}
