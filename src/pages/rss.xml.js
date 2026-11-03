import rss from '@astrojs/rss';
import { SITE, fullUrl, url } from '../config';
import { listPublished } from '../lib/posts';

export async function GET() {
  let posts;
  try {
    posts = await listPublished(50);
  } catch (error) {
    console.error('Could not generate RSS feed:', error);
    return new Response('RSS feed temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
    });
  }

  return rss({
    title: `${SITE.name} — Writing`,
    description: 'Articles by Ashwin Chekavan on business, entrepreneurship, technology, strategy and building businesses.',
    site: fullUrl('/'),
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: post.date,
      categories: [post.category],
      link: url(`/writing/${post.slug}/`),
    })),
  });
}
