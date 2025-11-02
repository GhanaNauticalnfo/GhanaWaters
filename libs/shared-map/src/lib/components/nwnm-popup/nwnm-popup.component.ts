import { Component, Input, OnInit } from '@angular/core';
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
export class NwnmPopupComponent implements OnInit {
  @Input() message!: NwNmFeatureProperties;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // MapLibre serializes complex GeoJSON properties to JSON strings
    // Parse them back to objects if needed
    if (this.message.references && typeof this.message.references === 'string') {
      try {
        this.message.references = JSON.parse(this.message.references as string);
      } catch (e) {
        console.error('Failed to parse references:', e);
        this.message.references = [];
      }
    }

    if (this.message.charts && typeof this.message.charts === 'string') {
      try {
        this.message.charts = JSON.parse(this.message.charts as string);
      } catch (e) {
        console.error('Failed to parse charts:', e);
        this.message.charts = [];
      }
    }

    if (this.message.parts && typeof this.message.parts === 'string') {
      try {
        this.message.parts = JSON.parse(this.message.parts as string);
      } catch (e) {
        console.error('Failed to parse parts:', e);
        this.message.parts = [];
      }
    }

    if (this.message.descs && typeof this.message.descs === 'string') {
      try {
        this.message.descs = JSON.parse(this.message.descs as string);
      } catch (e) {
        console.error('Failed to parse descs:', e);
        this.message.descs = [];
      }
    }

    if (this.message.areas && typeof this.message.areas === 'string') {
      try {
        this.message.areas = JSON.parse(this.message.areas as string);
      } catch (e) {
        console.error('Failed to parse areas:', e);
        this.message.areas = [];
      }
    }
  }

  /**
   * Sanitize HTML content from Niord to prevent XSS attacks
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.sanitize(1, html) || '';
  }
}
