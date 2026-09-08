import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BLOG_DIR, getPostBySlug, getPostSlugs, getPostTitle } from '@/lib/posts';

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const file = path.join(BLOG_DIR, `${params.slug}.md`);
  if (!fs.existsSync(file)) return {};
  const title = getPostTitle(fs.readFileSync(file, 'utf8'));
  return {
    title: `${title} | Julio Cesar Martin`,
    // The old Express renderer used the title as the description too.
    description: title,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  if (!getPostSlugs().includes(params.slug)) notFound();
  const post = await getPostBySlug(params.slug);

  return <div id="blog" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />;
}
