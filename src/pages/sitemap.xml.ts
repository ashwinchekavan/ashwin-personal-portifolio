import type { APIRoute } from 'astro';
import { fullUrl } from '../config';
import { countPublished, listPublished } from '../lib/posts';
import { renderSitemapIndex, renderUrlSet, SITEMAP_PAGE_SIZE, sitemapResponse } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  try {
    const count = await countPublished();

    if (count + 2 <= 50_000) {
      const posts = await listPublished(count);
      return sitemapResponse(
        renderUrlSet([
          { loc: fullUrl('/') },
          { loc: fullUrl('/writing/') },
          ...posts.map((post) => ({
            loc: fullUrl(`/writing/${post.slug}/`),
            lastmod: post.updated,
          })),
        ]),
      );
    }

    const postSitemaps = Array.from({ length: Math.ceil(count / SITEMAP_PAGE_SIZE) }, (_, index) =>
      fullUrl(`/sitemap-posts-${index + 1}.xml`),
    );
    return sitemapResponse(
      renderSitemapIndex([fullUrl('/sitemap-pages.xml'), ...postSitemaps]),
    );
  } catch (error) {
    console.error('Could not generate sitemap:', error);
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
  }
};
