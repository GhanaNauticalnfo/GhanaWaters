import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DatabaseStatistics, UpdateDatabaseSettings } from '@ghanawaters/shared-models';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/settings/database`;

  getDatabaseStatistics(): Observable<DatabaseStatistics> {
    return this.http.get<DatabaseStatistics>(this.apiUrl);
  }

  updateDatabaseSettings(settings: UpdateDatabaseSettings): Observable<void> {
    return this.http.put<void>(this.apiUrl, settings);
  }
}