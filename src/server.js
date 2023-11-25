import express from 'express'
import fs from 'node:fs'
import { getPostDate, getPostTitle } from './application/helpers/post.js'
import renderHome from './application/home.js'
import renderBlog from './application/blog.js'

const app = express()
const port = 3080

app.use(express.static('public'))

const layout = fs.readFileSync('./pages/index.html', 'utf8')
const posts = fs.readdirSync('./pages/blog')
  .map(file => file)
  .sort((blog1, blog2) => {
    // sort by date descending
    const dateBlog1 = getPostDate(blog1)
    const dateBlog2 = getPostDate(blog2)
    return dateBlog2 - dateBlog1
  })

app.get('/', (req, res) => {
  const postList = posts.map(
    post => `<li><a href="/blog/${post}">${getPostTitleFromDisk(post)}</a></li>`
  ).join('')

  return renderHome(req, res, { layout, postList })
})

app.get('/blog/:id', (req, res) => {
  const { id } = req.params
  const post = readBlogFileSync(id)
  renderBlog(req, res, { layout, post })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

const blogCache = {}
function readBlogFileSync (filename) {
  const blogStr = blogCache[filename] || fs.readFileSync(`./pages/blog/${filename}`, 'utf8')
  blogCache[filename] = blogStr
  return blogStr
}

function getPostTitleFromDisk (filename) {
  return getPostTitle(readBlogFileSync(filename))
}
