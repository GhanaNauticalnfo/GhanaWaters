import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateLandingSiteDto, UpdateLandingSiteDto, LandingSiteResponseDto } from '../models/landing-site.dto';

@Injectable({
  providedIn: 'root'
})
export class LandingSiteService {
  private apiUrl = '/api/landing-sites';

  constructor(private http: HttpClient) {}

  getAll(): Observable<LandingSiteResponseDto[]> {
    return this.http.get<LandingSiteResponseDto[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching landing sites:', error);
        console.error('Error details:', error.error);
        return throwError(() => error);
      })
    );
  }

  getOne(id: number): Observable<LandingSiteResponseDto> {
    return this.http.get<LandingSiteResponseDto>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateLandingSiteDto): Observable<LandingSiteResponseDto> {
    return this.http.post<LandingSiteResponseDto>(this.apiUrl, data);
  }

  update(id: number, data: UpdateLandingSiteDto): Observable<LandingSiteResponseDto> {
    return this.http.put<LandingSiteResponseDto>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}