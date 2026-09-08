'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';

// brief fade-out before the route swaps; the new page fades back in via .page-fade
const LEAVE_MS = 120;

/**
 * A <Link> that fades the current page out fast, then navigates. Modified
 * clicks (new tab, etc.) fall through to the browser untouched.
 */
export default function TransitionLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      typeof href !== 'string'
    ) {
      return;
    }
    e.preventDefault();
    document.querySelector('.page-fade')?.classList.add('is-leaving');
    window.setTimeout(() => router.push(href), LEAVE_MS);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
