import type { Metadata } from 'next';
import TransitionLink from '@/components/TransitionLink';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="center">
      <h1>Page not found</h1>
      <p>That page moved or never existed.</p>
      <p>
        <TransitionLink href="/">Back to the blog</TransitionLink>
      </p>
    </div>
  );
}
