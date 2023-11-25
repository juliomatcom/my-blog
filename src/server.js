import express from 'express'
import fs from 'node:fs'
import { getPostTitle } from './application/helpers/post.js'
import renderHome from './application/home.js'
import renderBlog from './application/blog.js'
import { getBlogFileSync, getPosts } from './infrastructure/blogRepository.js'
import { getLayoutSync } from './infrastructure/pageRepository.js'

const PORT = 3080
const app = express()

app.use(express.static('public'))

const layout = getLayoutSync()
const postFiles = getPosts()

app.get('/', (req, res) => {
  const posts = postFiles.map(post => ({ title: getPostTitleFromDisk(post), link: `/blog/${post}` }))
  const html = renderHome({ layout, posts })
  res.send(html)
})

app.get('/blog/:id', (req, res) => {
  const { id } = req.params
  const post = getBlogFileSync(id)
  const html = renderBlog({ layout, post })
  res.send(html)
})

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})

function getPostTitleFromDisk (filename) {
  return getPostTitle(getBlogFileSync(filename))
}
