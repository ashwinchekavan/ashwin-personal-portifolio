import type { APIRoute } from 'astro';
import { fullUrl } from '../config';
import { countPublished, listPublishedPage } from '../lib/posts';
import { renderUrlSet, SITEMAP_PAGE_SIZE, sitemapResponse } from '../lib/sitemap';

export const GET: APIRoute = async ({ params }) => {
  const pageText = params.page ?? '';
  if (!/^[1-9]\d*$/.test(pageText)) return new Response('Not found', { status: 404 });

  const page = Number(pageText);
  if (!Number.isSafeInteger(page)) return new Response('Not found', { status: 404 });

  try {
    const count = await countPublished();
    const pageCount = Math.ceil(count / SITEMAP_PAGE_SIZE);
    if (page > pageCount) return new Response('Not found', { status: 404 });

    const posts = await listPublishedPage(SITEMAP_PAGE_SIZE, (page - 1) * SITEMAP_PAGE_SIZE);
    return sitemapResponse(
      renderUrlSet(
        posts.map((post) => ({
          loc: fullUrl(`/writing/${post.slug}/`),
          lastmod: post.updated,
        })),
      ),
    );
  } catch (error) {
    console.error('Could not generate article sitemap:', error);
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
  }
};
