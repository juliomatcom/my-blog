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
import { SITE_AUTHOR, SITE_AVATAR, SITE_NAME, SITE_URL, TWITTER_HANDLE } from '@/lib/site';

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

interface PostSeo {
  title: string;
  description: string;
  image: string;
  url: string;
  published: string;
}

/** Shared SEO facts for a post — used by both `generateMetadata` and the JSON-LD. */
function postSeo(slug: string): PostSeo | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const markdown = fs.readFileSync(file, 'utf8');
  const title = getPostTitle(markdown);
  const rawImage = getPostImage(markdown) ?? SITE_AVATAR;
  return {
    title,
    description: getPostDescription(markdown) ?? title,
    // Social scrapers need an absolute URL; post images are site-root relative.
    image: rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`,
    url: `${SITE_URL}/blog/${slug}/`,
    published: getPostDate(slug).toISOString(),
  };
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const seo = postSeo(params.slug);
  if (!seo) return {};

  return {
    title: seo.title,
    description: seo.description,
    authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
    alternates: { canonical: seo.url },
    openGraph: {
      type: 'article',
      url: seo.url,
      siteName: SITE_NAME,
      title: seo.title,
      description: seo.description,
      publishedTime: seo.published,
      authors: [SITE_AUTHOR],
      images: [{ url: seo.image, alt: seo.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: seo.title,
      description: seo.description,
      images: [seo.image],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  if (!getPostSlugs().includes(params.slug)) notFound();
  const post = await getPostBySlug(params.slug);
  const seo = postSeo(params.slug)!;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: seo.title,
    description: seo.description,
    image: seo.image,
    datePublished: seo.published,
    dateModified: seo.published,
    author: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_URL },
    publisher: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': seo.url },
    url: seo.url,
    inLanguage: 'en',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: seo.title, item: seo.url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleLd, breadcrumbLd]) }}
      />
      <article id="blog" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </>
  );
}
