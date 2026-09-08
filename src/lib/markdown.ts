import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

/**
 * Convert post markdown to an HTML string.
 *
 * `sanitize: false` keeps parity with the old showdown converter, which passed
 * raw HTML through. Post content is first-party markdown only.
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(markdown);
  return String(file);
}
