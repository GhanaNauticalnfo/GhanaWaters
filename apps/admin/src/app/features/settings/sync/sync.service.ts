import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyncManageResponse, SyncResetResponse } from '@ghanawaters/shared-models';

@Injectable()
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/data';

  getSyncManageData(since?: string, limit?: number): Observable<SyncManageResponse> {
    const params: any = {};
    if (since) params.since = since;
    if (limit) params.limit = limit.toString();
    
    return this.http.get<SyncManageResponse>(`${this.apiUrl}/sync/manage`, { params });
  }

  resetSync(): Observable<SyncResetResponse> {
    return this.http.post<SyncResetResponse>(`${this.apiUrl}/sync/reset`, {});
  }
}