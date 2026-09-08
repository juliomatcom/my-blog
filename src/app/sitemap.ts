import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

/** Static sitemap emitted to `out/sitemap.xml` by the export. */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: posts[0]?.date ?? new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}/`,
      lastModified: post.date,
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
  ];
}
