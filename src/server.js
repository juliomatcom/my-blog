import express from 'express'
import fs from 'node:fs'
import { getPostTitle } from './application/helpers/post.js'
import renderHome from './application/home.js'
import renderBlog from './application/blog.js'
import { getBlogFileSync, getPosts } from './infrastructure/blogRepository.js'
import { getLayoutSync } from './infrastructure/pageRepository.js'

const app = express()
const port = 3080

app.use(express.static('public'))

const layout =   getLayoutSync()
const posts = getPosts()

app.get('/', (req, res) => {
  const postList = posts.map(
    post => `<li><a href="/blog/${post}">${getPostTitleFromDisk(post)}</a></li>`
  ).join('')

  const html = renderHome({ layout, postList })
  res.send(html)
})

app.get('/blog/:id', (req, res) => {
  const { id } = req.params
  const post = getBlogFileSync(id)
  const html = renderBlog({ layout, post })
  res.send(html)
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})


function getPostTitleFromDisk (filename) {
  return getPostTitle(getBlogFileSync(filename))
}
