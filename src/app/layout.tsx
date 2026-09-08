import type { Metadata } from 'next';
import { Dosis } from 'next/font/google';
import './globals.css';
import SpaceBackground from '@/components/SpaceBackground';
import Preloader from '@/components/Preloader';
import PageTransition from '@/components/PageTransition';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const dosis = Dosis({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dosis',
});

const AVATAR = 'https://avatars.githubusercontent.com/u/8549955?v=4';

export const metadata: Metadata = {
  metadataBase: new URL('https://depre.net'),
  title: {
    default: 'Julio Cesar Martin - Software Engineer',
    template: '%s',
  },
  description: 'Julio Cesar Martin - Software Engineer',
  icons: {
    icon: AVATAR,
    shortcut: AVATAR,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dosis.variable}>
      <body className="starry">
        <Preloader />
        <SpaceBackground />
        <div className="viewport-glass" aria-hidden="true" />
        <Nav />

        <main>
          <div id="content">
            <PageTransition>{children}</PageTransition>
          </div>
          <div id="rss">
            <a href="/feed/rss.xml">
              <img src="/images/valid-rss-rogers.png" alt="RSS" title="Follow my RSS feed" />
            </a>
            <a href="/feed/atom.xml">
              <img src="/images/valid-atom.png" alt="Atom" title="Follow my Atom feed" />
            </a>
          </div>
        </main>

        <Footer />
      </body>
    </html>
  );
}
