import fs from 'node:fs';
import path from 'node:path';
import { buildFeeds } from './build-feeds';

const OUT_DIR = path.join(process.cwd(), 'out', 'feed');

function main() {
  const { rss, atom } = buildFeeds();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'rss.xml'), rss);
  fs.writeFileSync(path.join(OUT_DIR, 'atom.xml'), atom);
  console.log(`feeds: wrote ${path.relative(process.cwd(), OUT_DIR)}/{rss,atom}.xml`);
}

main();
