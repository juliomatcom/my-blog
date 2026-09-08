import type { MetadataRoute } from 'next';
import { SITE_AVATAR, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: 'Julio C. Martin',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'browser',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: SITE_AVATAR, sizes: '460x460', type: 'image/png' }],
  };
}
