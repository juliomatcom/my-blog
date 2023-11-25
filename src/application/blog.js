import showdown from 'showdown'
import { getPostTitle } from './helpers/post.js'

const converter = new showdown.Converter()

function render ({ layout, post }) {
  const html = converter.makeHtml(post)
  const title = getPostTitle(post);
  const layoutHtml = layout
    .replace('<!--title-->', `${title} | Julio Cesar Martin`)
    .replace('<!--content-->', `<div id="blog">${html}</div>`)
    .replace('<!--meta_content-->', `<meta name="description" content="${title}">`)


  return layoutHtml
}

export default render
