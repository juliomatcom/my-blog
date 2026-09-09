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
      <header>
        <div className="header-cols">
          <a
            className="header-avatar"
            title="Go to my GitHub page"
            href="https://github.com/juliomatcom"
            target="_blank"
          >
            <img src="/images/icons8-github-30a.png" alt="GitHub" className="github-icon" />
            <img src={SITE_AVATAR} alt={`${SITE_AUTHOR} profile photo`} className="avatar" />
          </a>
          <div className="header-about">
            <h1>🧑🏾‍🚀 {SITE_AUTHOR}</h1>
            <p className="intro">
              Hello, I am a software engineer, creator, and open-source maintainer. I build and ship
              my own products, such as <a href="https://tapebull.com/">TapeBull</a>, a charting and
              trading platform, and <a href="https://baya-cli.depre.net/">Baya CLI</a>, a local
              multi-provider AI CLI orchestrator. On this blog I write about software, AI, clean
              code, self-hosting, and more. Oh, and I love space exploration 🚀.
            </p>
          </div>
        </div>
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
