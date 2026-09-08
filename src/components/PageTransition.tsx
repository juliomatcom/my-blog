'use client';

import { usePathname } from 'next/navigation';

/**
 * Re-keys its subtree on every route change so the CSS fade-in (`.page-fade`)
 * replays -- a light touch that softens client-side navigation between posts.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
