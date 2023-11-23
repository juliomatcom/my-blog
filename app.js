import express from 'express'
import fs from 'node:fs'
import showdown from 'showdown'

const converter = new showdown.Converter()
const app = express()
const port = 3080

app.use(express.static('public'))

const layout = fs.readFileSync('./pages/index.html', 'utf8')
const posts = fs.readdirSync('./pages/blog').map(file => file)

const blogCache = {}
function readBlogFileSync (filename) {
  const blogStr = blogCache[filename] || fs.readFileSync(`./pages/blog/${filename}`, 'utf8')
  blogCache[filename] = blogStr
  return blogStr
}

function getPostTitle (str) {
  return str.split('\n')[0].replace('#', '')
}
function getPostTitleFromDisk (filename) {
  return getPostTitle(readBlogFileSync(filename))
}

app.get('/', (req, res) => {
  const postList = posts.map(
    post => `<li><a href="/blog/${post}">${getPostTitleFromDisk(post)}</a></li>`
  ).join('')

  const html = layout
    .replace('<!--content-->', `
      <div class="center"><img src="https://avatars.githubusercontent.com/u/8549955?v=4" alt="Avatar"/></div>
      <span class="typewriter">My blog</span>
      <ul>${postList}</ul>
    `)
    .replace('<!--title-->', 'Julio Cesar Martin')
  res.send(html)
})

app.get('/blog/:id', (req, res) => {
  const { id } = req.params
  const post = fs.readFileSync(`./pages/blog/${id}`, 'utf8')
  const html = converter.makeHtml(post)
  const layoutHtml = layout
    .replace('<!--title-->', `${getPostTitle(post)} | Julio Cesar Martin`)
    .replace('<!--content-->', html)

  res.send(layoutHtml)
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
