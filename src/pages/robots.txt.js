
import { fullUrl } from '../config';

export const GET = () => {
  const content = `User-agent: *
Allow: /

Sitemap: ${fullUrl('/sitemap.xml')}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
