import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept relative URLs that start with /api
  if (req.url.startsWith('/api')) {
    // Get base API URL and ensure it doesn't end with /api to avoid duplication
    let baseUrl = environment.apiUrl || 'http://localhost:3000/api';
    
    // Remove trailing /api if it exists to prevent double /api paths
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    
    // Replace /api with the full API URL from environment
    const apiReq = req.clone({
      url: req.url.replace('/api', baseUrl + '/api')
    });
    
    // Log in development for debugging
    if (!environment.production) {
      console.debug(`API Interceptor: ${req.url} → ${apiReq.url}`);
    }
    
    return next(apiReq);
  }
  
  // Don't intercept absolute URLs or other relative URLs
  return next(req);
};