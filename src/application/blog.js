import showdown from 'showdown'
import { getPostTitle } from './helpers/post.js'

const converter = new showdown.Converter()

function render ({ layout, post }) {
  const html = converter.makeHtml(post)
  const layoutHtml = layout
    .replace('<!--title-->', `${getPostTitle(post)} | Julio Cesar Martin`)
    .replace('<!--content-->', `<div id="blog">${html}</div>`)

  return layoutHtml
}

export default render
