import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiParamValue, ApiParams } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  get<T>(endpoint: string, params?: ApiParams): Observable<T> {
    return this.http.get<T>(this.toUrl(endpoint), {
      params: this.toHttpParams(params),
      withCredentials: true
    });
  }

  post<T, B extends object | FormData = object>(endpoint: string, body?: B, params?: ApiParams): Observable<T> {
    return this.http.post<T>(this.toUrl(endpoint), body ?? {}, {
      params: this.toHttpParams(params),
      withCredentials: true
    });
  }

  put<T, B extends object | FormData = object>(endpoint: string, body: B, params?: ApiParams): Observable<T> {
    return this.http.put<T>(this.toUrl(endpoint), body, {
      params: this.toHttpParams(params),
      withCredentials: true
    });
  }

  patch<T, B extends object | FormData = object>(endpoint: string, body?: B, params?: ApiParams): Observable<T> {
    return this.http.patch<T>(this.toUrl(endpoint), body ?? {}, {
      params: this.toHttpParams(params),
      withCredentials: true
    });
  }

  delete<T>(endpoint: string, params?: ApiParams): Observable<T> {
    return this.http.delete<T>(this.toUrl(endpoint), {
      params: this.toHttpParams(params),
      withCredentials: true
    });
  }

  upload<T>(endpoint: string, formData: FormData, params?: ApiParams): Observable<T> {
    return this.post<T, FormData>(endpoint, formData, params);
  }

  downloadUrl(endpoint: string): string {
    return this.toUrl(endpoint);
  }

  private toUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    if (endpoint.startsWith('/api/')) {
      return endpoint;
    }

    return `${this.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private toHttpParams(params?: ApiParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    return Object.entries(params).reduce((httpParams, [key, value]) => this.appendParam(httpParams, key, value), new HttpParams());
  }

  private appendParam(httpParams: HttpParams, key: string, value: ApiParamValue): HttpParams {
    if (value === null || value === undefined || value === '') {
      return httpParams;
    }

    if (Array.isArray(value)) {
      return value.reduce((nextParams, item) => nextParams.append(key, String(item)), httpParams);
    }

    return httpParams.set(key, String(value));
  }
}
