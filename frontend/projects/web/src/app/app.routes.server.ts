import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Personal pages: the server does not know who is logged in (the session lives in the
    // browser), so these pages are drawn in the browser. They are not for Google anyway.
    path: ':lang/account/**',
    renderMode: RenderMode.Client,
  },
  {
    // Everything else shows live data from the API and is rendered on the server per request
    path: '**',
    renderMode: RenderMode.Server,
  },
];
