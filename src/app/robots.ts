import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Static robots.txt emitted to `out/robots.txt` by the export. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
