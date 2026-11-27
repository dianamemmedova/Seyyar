import { RenderMode, ServerRoute } from '@angular/ssr';

// Pages show live data from the API, so they are rendered on the server for every request
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
