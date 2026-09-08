'use client';

import { usePathname } from 'next/navigation';
import TransitionLink from '@/components/TransitionLink';

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <nav>
      <div>
        <TransitionLink href="/" className={isActive('/') ? 'active' : undefined}>
          Home
        </TransitionLink>
      </div>
      <div>
        <a
          title="Message me on X"
          id="contactMe"
          href="https://x.com/depre_cuba"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact
        </a>
      </div>
      <div>
        <a
          title="Go to linkedin"
          href="https://www.linkedin.com/in/juliomartin-dev/"
          target="_blank"
        >
          Resume
        </a>
      </div>
    </nav>
  );
}
