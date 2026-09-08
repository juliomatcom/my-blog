import fs from 'node:fs';
import path from 'node:path';

export const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface PostMeta {
  /** filename without the `.md` extension, e.g. `everything-is-data-2024-05-05` */
  slug: string;
  title: string;
  date: Date;
  description: string | null;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

/** First line of the markdown, minus the leading `#`. */
export function getPostTitle(markdown: string): string {
  return markdown.split('\n')[0].replace('#', '').trim();
}

/** First-paragraph heuristic — ported verbatim from the old Express helper. */
export function getPostDescription(markdown: string): string | null {
  try {
    const firstParagraphEndRegex = /[.]+[\s]/g;
    const end = markdown.search(firstParagraphEndRegex);
    if (end < 0) return null;
    const start = Math.max(0, markdown.slice(0, end).lastIndexOf('\n'));
    return markdown.slice(start, end).trim() + '...';
  } catch {
    return null;
  }
}

/** First image referenced in the markdown (`![alt](url)`), or `null`. */
export function getPostImage(markdown: string): string | null {
  const match = markdown.match(/!\[[^\]]*\]\(([^)\s]+)/);
  return match ? match[1] : null;
}

/** Parse the `YYYY-MM-DD` embedded in a slug or filename. */
export function getPostDate(slugOrFilename: string): Date {
  const match = slugOrFilename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    throw new Error(`No YYYY-MM-DD date found in "${slugOrFilename}"`);
  }
  return new Date(match[1]);
}

export function getPostSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

function readPostFile(slug: string): string {
  return fs.readFileSync(path.join(BLOG_DIR, `${slug}.md`), 'utf8');
}

export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const markdown = readPostFile(slug);
      return {
        slug,
        title: getPostTitle(markdown),
        date: getPostDate(slug),
        description: getPostDescription(markdown),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const markdown = readPostFile(slug);
  // Imported lazily: `remark` is ESM-only and this keeps posts.ts loadable from
  // a plain CJS Jest environment for the sync helpers.
  const { renderMarkdown } = await import('./markdown');
  return {
    slug,
    title: getPostTitle(markdown),
    date: getPostDate(slug),
    description: getPostDescription(markdown),
    contentHtml: await renderMarkdown(markdown),
  };
}
