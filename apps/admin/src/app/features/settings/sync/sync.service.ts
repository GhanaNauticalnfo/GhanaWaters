import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyncManageResponse, SyncResetResponse, SyncEntryDetail, SyncOverviewResponse } from '@ghanawaters/shared-models';

@Injectable()
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/data';

  getSyncOverview(): Observable<SyncOverviewResponse> {
    return this.http.get<SyncOverviewResponse>(`${this.apiUrl}/sync/overview`);
  }

  getSyncData(majorVersion?: number, fromMinorVersion?: number, limit?: number): Observable<any> {
    const params: any = {};
    if (majorVersion !== undefined) params.majorVersion = majorVersion.toString();
    if (fromMinorVersion !== undefined) params.fromMinorVersion = fromMinorVersion.toString();
    if (limit !== undefined) params.limit = limit.toString();
    
    return this.http.get<any>(`${this.apiUrl}/sync`, { params });
  }

  resetSync(): Observable<SyncResetResponse> {
    return this.http.post<SyncResetResponse>(`${this.apiUrl}/sync/reset`, {});
  }

}