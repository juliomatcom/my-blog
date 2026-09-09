'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  // Populated on the client, mirroring the old main.js behaviour and avoiding a
  // build-time-vs-view-time year mismatch on the static HTML.
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer>
      <p>
        {year !== null ? (
          <a href="https://x.com/depre_cuba" target="_blank" rel="noopener noreferrer">
            {`© Julio César Martín Cabrera - ${year}`}
          </a>
        ) : (
          ''
        )}
      </p>
    </footer>
  );
}
