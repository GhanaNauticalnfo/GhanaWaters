import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VesselResponse, VesselTelemetryResponse } from '@ghanawaters/shared-models';

// Use shared models from the library
export type Vessel = VesselResponse;
export type VesselTelemetry = VesselTelemetryResponse;

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  getVessels(): Observable<Vessel[]> {
    return this.http.get<Vessel[]>('/api/vessels');
  }

  getActiveVessels(): Observable<Vessel[]> {
    return this.http.get<Vessel[]>('/api/vessels?includeLatestPosition=true');
  }

  getVesselTelemetry(vesselId: number, limit: number = 1): Observable<VesselTelemetry[]> {
    return this.http.get<VesselTelemetry[]>(`/api/vessels/${vesselId}/telemetry?limit=${limit}`);
  }
}
