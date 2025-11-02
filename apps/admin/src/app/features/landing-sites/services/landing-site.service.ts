import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LandingSiteInput, LandingSiteResponse } from '@ghanawaters/shared-models';

@Injectable({
  providedIn: 'root'
})
export class LandingSiteService {
  private apiUrl = '/api/landing-sites';

  constructor(private http: HttpClient) {}

  getAll(): Observable<LandingSiteResponse[]> {
    return this.http.get<LandingSiteResponse[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching landing sites:', error);
        console.error('Error details:', error.error);
        return throwError(() => error);
      })
    );
  }

  getOne(id: number): Observable<LandingSiteResponse> {
    return this.http.get<LandingSiteResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: LandingSiteInput): Observable<LandingSiteResponse> {
    return this.http.post<LandingSiteResponse>(this.apiUrl, data);
  }

  update(id: number, data: LandingSiteInput): Observable<LandingSiteResponse> {
    return this.http.put<LandingSiteResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}