import type { APIRoute } from 'astro';
import { fullUrl } from '../config';
import { renderUrlSet, sitemapResponse } from '../lib/sitemap';

export const GET: APIRoute = () =>
  sitemapResponse(
    renderUrlSet([{ loc: fullUrl('/') }, { loc: fullUrl('/writing/') }]),
  );
