import type { Metadata } from 'next';
import { Dosis } from 'next/font/google';
import './globals.css';
import SpaceBackground from '@/components/SpaceBackground';
import Preloader from '@/components/Preloader';
import PageTransition from '@/components/PageTransition';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ZenToggle from '@/components/ZenToggle';
import {
  SITE_AUTHOR,
  SITE_AVATAR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SOCIAL_LINKS,
  TWITTER_HANDLE,
} from '@/lib/site';

const dosis = Dosis({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dosis',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  keywords: [
    'Julio Cesar Martin',
    'software engineer',
    'software architecture',
    'clean architecture',
    'domain-driven design',
    'developer tools',
    'AI-assisted development',
    'self-hosting',
    'blog',
  ],
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': `${SITE_URL}/feed/rss.xml`,
      'application/atom+xml': `${SITE_URL}/feed/atom.xml`,
    },
  },
  icons: {
    icon: SITE_AVATAR,
    shortcut: SITE_AVATAR,
    apple: SITE_AVATAR,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [{ url: SITE_AVATAR, width: 460, height: 460, alt: SITE_AUTHOR }],
  },
  twitter: {
    card: 'summary',
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_AVATAR],
  },
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE_AUTHOR,
  url: SITE_URL,
  image: SITE_AVATAR,
  jobTitle: 'Software Engineer',
  description: SITE_DESCRIPTION,
  sameAs: SOCIAL_LINKS,
};

const siteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en',
  author: { '@type': 'Person', name: SITE_AUTHOR, url: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dosis.variable}>
      <body className="starry">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([personLd, siteLd]) }}
        />
        <Preloader />
        <SpaceBackground />
        <div className="viewport-glass" aria-hidden="true" />
        <ZenToggle />
        <Nav />

        <main>
          <div id="content">
            <PageTransition>{children}</PageTransition>
          </div>
          {/* RSS/Atom badges hidden for now — feeds are still generated and
              linked from <head> via metadata.alternates.
          <div id="rss">
            <a href="/feed/rss.xml">
              <img src="/images/valid-rss-rogers.png" alt="RSS feed" title="Follow my RSS feed" />
            </a>
            <a href="/feed/atom.xml">
              <img src="/images/valid-atom.png" alt="Atom feed" title="Follow my Atom feed" />
            </a>
          </div>
          */}
        </main>

        <Footer />
      </body>
    </html>
  );
}
