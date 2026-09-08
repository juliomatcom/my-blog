import { Feed } from 'feed';
import { getAllPosts } from '../src/lib/posts';
import { SITE_AUTHOR, SITE_AVATAR, SITE_URL } from '../src/lib/site';

export interface BuiltFeeds {
  rss: string;
  atom: string;
}

/** Build the RSS 2.0 and Atom 1.0 feeds from the blog posts. */
export function buildFeeds(): BuiltFeeds {
  const feed = new Feed({
    title: 'depre.net Blog',
    description: `${SITE_AUTHOR} personal blog`,
    id: SITE_URL,
    link: SITE_URL,
    language: 'en',
    image: SITE_AVATAR,
    favicon: SITE_AVATAR,
    copyright: `${new Date().getFullYear()} ${SITE_AUTHOR}`,
    feedLinks: {
      atom: `${SITE_URL}/feed/atom.xml`,
    },
    author: { name: SITE_AUTHOR },
  });

  for (const post of getAllPosts()) {
    const link = `${SITE_URL}/blog/${post.slug}`;
    feed.addItem({
      title: post.title,
      description: post.description ?? '',
      id: link,
      link,
      date: post.date,
    });
  }

  return { rss: feed.rss2(), atom: feed.atom1() };
}
