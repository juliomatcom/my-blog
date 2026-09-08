import {
  getAllPosts,
  getPostDate,
  getPostDescription,
  getPostImage,
  getPostSlugs,
  getPostTitle,
} from './posts';

describe('post metadata helpers', () => {
  it('strips the leading # from the first line for the title', () => {
    expect(getPostTitle('# Hello World\n\nbody')).toBe('Hello World');
  });

  it('parses the YYYY-MM-DD date embedded in a slug', () => {
    expect(getPostDate('everything-is-data-2024-05-05').toISOString()).toBe(
      '2024-05-05T00:00:00.000Z',
    );
  });

  it('throws when a slug has no date (would break the build)', () => {
    expect(() => getPostDate('no-date-here')).toThrow();
  });

  it('returns the first paragraph as a description', () => {
    const md = '# Title\n\nFirst sentence here. Second sentence.';
    expect(getPostDescription(md)).toBe('First sentence here...');
  });

  it('extracts the first markdown image url', () => {
    expect(getPostImage('# Title\n\n![machine](/images/machine.jpeg)\n\nbody')).toBe(
      '/images/machine.jpeg',
    );
    expect(getPostImage('# Title\n\nno images here')).toBeNull();
  });

  it('prefers an explicit <!-- description: ... --> over the heuristic', () => {
    const md =
      '# Title\n\n<!-- description: Hand-written SEO snippet. -->\n\nFirst sentence. More.';
    expect(getPostDescription(md)).toBe('Hand-written SEO snippet.');
  });
});

describe('blog content directory', () => {
  const slugs = getPostSlugs();

  it('finds at least one post', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('every post file has a non-empty title and a valid date', () => {
    for (const post of getAllPosts()) {
      expect(post.title.length).toBeGreaterThan(0);
      expect(Number.isNaN(post.date.getTime())).toBe(false);
    }
  });

  it('lists posts strictly newest-first', () => {
    const dates = getAllPosts().map((p) => p.date.getTime());
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });

  it('slugs carry no .md extension', () => {
    for (const slug of slugs) expect(slug.endsWith('.md')).toBe(false);
  });
});
