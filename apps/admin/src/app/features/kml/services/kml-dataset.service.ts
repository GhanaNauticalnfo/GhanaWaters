// features/kml/services/kml-dataset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KmlDataset, KmlDatasetResponse, KmlDatasetInput } from '@ghanawaters/shared-models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KmlDatasetService {
  private apiUrl = `${environment.apiUrl}/kml-datasets`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<KmlDatasetResponse[]> {
    return this.http.get<KmlDatasetResponse[]>(this.apiUrl);
  }

  getOne(id: number): Observable<KmlDatasetResponse> {
    return this.http.get<KmlDatasetResponse>(`${this.apiUrl}/${id}`);
  }

  getEnabled(): Observable<{ id: number; last_updated: Date }[]> {
    return this.http.get<{ id: number; last_updated: Date }[]>(`${this.apiUrl}/enabled`);
  }

  create(data: KmlDatasetInput): Observable<KmlDatasetResponse> {
    return this.http.post<KmlDatasetResponse>(this.apiUrl, data);
  }

  update(id: number, data: KmlDatasetInput): Observable<KmlDatasetResponse> {
    return this.http.put<KmlDatasetResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}