import { InjectionToken } from '@angular/core';

// Where the API lives. In the browser it is "/api" on the same site
// (ng serve forwards it to the backend with proxy.conf.json).
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
