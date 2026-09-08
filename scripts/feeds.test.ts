import { buildFeeds } from './build-feeds';
import { getAllPosts } from '../src/lib/posts';

describe('feed generation', () => {
  const { rss, atom } = buildFeeds();
  const postCount = getAllPosts().length;

  it('produces an RSS 2.0 document', () => {
    expect(rss).toContain('<rss');
    expect(rss).toContain('<?xml');
  });

  it('produces an Atom 1.0 document', () => {
    expect(atom).toContain('<feed');
    expect(atom).toContain('http://www.w3.org/2005/Atom');
  });

  it('has one item per post', () => {
    expect(rss.match(/<item>/g)?.length ?? 0).toBe(postCount);
  });

  it('points every link at depre.net/blog', () => {
    for (const post of getAllPosts()) {
      expect(rss).toContain(`https://depre.net/blog/${post.slug}`);
    }
  });
});
