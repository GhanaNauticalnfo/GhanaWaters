import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VesselTypeResponse, VesselTypeInput } from '@ghanawaters/shared-models';

export type VesselType = VesselTypeResponse;

@Injectable({
  providedIn: 'root'
})
export class VesselTypeService {
  private http = inject(HttpClient);
  private baseUrl = '/api/vessels/types';

  getAll(): Observable<VesselType[]> {
    return this.http.get<VesselType[]>(this.baseUrl);
  }

  getOne(id: number): Observable<VesselType> {
    return this.http.get<VesselType>(`${this.baseUrl}/${id}`);
  }


  create(data: { name: string; color?: string }): Observable<VesselType> {
    return this.http.post<VesselType>(this.baseUrl, data);
  }

  update(id: number, data: { name: string; color?: string }): Observable<VesselType> {
    return this.http.put<VesselType>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}