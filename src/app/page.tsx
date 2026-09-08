import TransitionLink from '@/components/TransitionLink';
import { getAllPosts } from '@/lib/posts';
import { SITE_AUTHOR, SITE_AVATAR, SITE_URL } from '@/lib/site';

export default function HomePage() {
  const posts = getAllPosts();

  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_AUTHOR} — Blog`,
    url: SITE_URL,
    inLanguage: 'en',
    author: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_URL },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}/`,
      datePublished: post.date.toISOString(),
      ...(post.description ? { description: post.description } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />
      <header className="center">
        <a title="Go to my GitHub page" href="https://github.com/juliomatcom" target="_blank">
          <img src="/images/icons8-github-30a.png" alt="GitHub" className="github-icon" />
          <img src={SITE_AVATAR} alt={`${SITE_AUTHOR} profile photo`} className="avatar" />
        </a>
        <h1>{SITE_AUTHOR}</h1>
        <p>
          <code>Software Engineer • Creator &amp; OSS Maintainer 🚀</code>
        </p>
        <p className="intro">
          I&apos;m a software engineer and open-source maintainer. I build developer tools — like{' '}
          <a href="https://baya-cli.depre.net/">Baya</a>, a local multi-provider AI CLI orchestrator
          — and write about software architecture, clean code, AI-assisted development, and
          self-hosting.
        </p>
      </header>
      <h2 className="typewriter">My blog</h2>
      <ul className="posts">
        {posts.map((post) => (
          <li key={post.slug}>
            <TransitionLink title={`Read: ${post.title}`} href={`/blog/${post.slug}`}>
              {post.title}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </>
  );
}
