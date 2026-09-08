import TransitionLink from '@/components/TransitionLink';
import { getAllPosts } from '@/lib/posts';

const AVATAR = 'https://avatars.githubusercontent.com/u/8549955?v=4';

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <>
      <div className="center">
        <a title="Go to my GitHub page" href="https://github.com/juliomatcom" target="_blank">
          <img src="/images/icons8-github-30a.png" alt="GitHub" className="github-icon" />
          <img src={AVATAR} alt="Profile" className="avatar" />
        </a>
        <p>
          <code>Software Engineer • Creator & OSS Maintainer 🚀</code>
        </p>
      </div>
      <span className="typewriter">My blog</span>
      <ul className="posts">
        {posts.map((post) => (
          <li key={post.slug}>
            <TransitionLink title={`Read:${post.title}`} href={`/blog/${post.slug}`}>
              {post.title}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </>
  );
}
