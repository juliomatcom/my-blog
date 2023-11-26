import express from 'express'
import helmet from 'helmet'
import { getPostTitle } from './application/helpers/post.js'
import renderHome from './application/home.js'
import renderBlog from './application/blog.js'
import { getBlogFileSync, getPosts } from './infrastructure/blogRepository.js'
import { getLayoutSync } from './infrastructure/pageRepository.js'

const PORT = 3080
const app = express()

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'avatars.githubusercontent.com'],
        'font-src': ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com']
      }
    }
  })
)
app.use(express.static('public'))

const layout = getLayoutSync()
const postFiles = getPosts()

app.get('/', (req, res) => {
  const posts = postFiles.map(post => ({ title: getPostTitleFromDisk(post), link: `/blog/${post}` }))
  const html = renderHome({ layout, posts })
  res.send(html)
})

app.get('/blog/:id', (req, res) => {
  try {
    const { id } = req.params
    const post = getBlogFileSync(id)
    const html = renderBlog({ layout, post })
    res.send(html)
  } catch (error) {
    console.warn('Error found returning 404')
    res.status(404).send('Not found. Go back to <a href="/">home</a>!')
  }
})

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})

function getPostTitleFromDisk (filename) {
  const blogStr = getBlogFileSync(filename)
  return getPostTitle(blogStr)
}
