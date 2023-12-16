import express from 'express'
import helmet from 'helmet'
import { Feed } from 'feed'
import { getPostDate, getPostDescription, getPostTitle } from './application/helpers/post.js'
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

function getPostTitleFromDisk (filename) {
  const blogStr = getBlogFileSync(filename)
  return getPostTitle(blogStr)
}

app.get('/', (req, res) => {
  const posts = postFiles.map(filename => ({ title: getPostTitleFromDisk(filename), link: `/blog/${filename}` }))
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

// rss
const rssHandler = (feedOutput) => (req, res) => {
  const ME = 'Julio Cesar Martin'
  const domain = 'https://proderror.eu/'
  const avatar = 'https://avatars.githubusercontent.com/u/8549955?v=4'
  // create new feed
  const feed = new Feed({
    title: 'ProdError.eu Blog',
    description: `${ME} personal blog`,
    id: domain,
    link: domain,
    language: 'en', // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
    image: avatar,
    favicon: avatar,
    copyright: `${new Date().getFullYear()} ${ME}`,
    feedLinks: {
      json: `${domain}/feed/json`,
      atom: `${domain}/feed/atom`
    },
    author: {
      name: ME
    }
  })
  // get data for posts
  const posts = postFiles.map(filename => {
    const blog = getBlogFileSync(filename)
    const title = getPostTitle(blog)
    const date = getPostDate(filename)
    const description = getPostDescription(blog)
    const link = `https://proderror.eu/blog/${filename}`
    return { title, date, description, link }
  })

  posts.forEach(post => {
    const item = {
      title: post.title,
      description: post.description ?? '',
      id: post.link,
      link: post.link,
      date: post.date
    }
    feed.addItem(item)
  })

  res.type('application/xml')

  if (feedOutput === 'atom') {
    res.send(feed.atom1())
  }

  res.send(feed.rss2())
}

app.get('/feed/rss', rssHandler('rss'))
app.get('/feed/atom', rssHandler('atom'))

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`)
})
