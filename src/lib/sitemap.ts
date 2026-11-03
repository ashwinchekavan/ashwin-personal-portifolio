export interface SitemapEntry {
  loc: string;
  lastmod?: Date;
}

export const SITEMAP_PAGE_SIZE = 49_998;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };

    return entities[char];
  });

export function renderUrlSet(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastmod =
        entry.lastmod instanceof Date && Number.isFinite(entry.lastmod.getTime())
          ? `<lastmod>${escapeXml(entry.lastmod.toISOString())}</lastmod>`
          : '';

      return `  <url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function renderSitemapIndex(locations: string[]) {
  const sitemaps = locations
    .map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc></sitemap>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

export function sitemapResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
