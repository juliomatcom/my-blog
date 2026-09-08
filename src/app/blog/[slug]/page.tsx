import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  BLOG_DIR,
  getPostBySlug,
  getPostDate,
  getPostDescription,
  getPostImage,
  getPostSlugs,
  getPostTitle,
} from '@/lib/posts';
import { SITE_AVATAR, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const file = path.join(BLOG_DIR, `${params.slug}.md`);
  if (!fs.existsSync(file)) return {};
  const markdown = fs.readFileSync(file, 'utf8');
  const title = getPostTitle(markdown);
  const description = getPostDescription(markdown) ?? title;
  const rawImage = getPostImage(markdown) ?? SITE_AVATAR;
  // Social scrapers need an absolute URL; post images are site-root relative.
  const image = rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`;
  const url = `${SITE_URL}/blog/${params.slug}/`;

  return {
    title: `${title} | Julio Cesar Martin`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: getPostDate(params.slug).toISOString(),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  if (!getPostSlugs().includes(params.slug)) notFound();
  const post = await getPostBySlug(params.slug);

  return <div id="blog" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />;
}
