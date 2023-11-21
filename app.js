import express from 'express'
import fs from 'node:fs'
import showdown from 'showdown'

const converter = new showdown.Converter()
const app = express()
const port = 3080

app.use(express.static('public'))

const layout = fs.readFileSync('./pages/index.html', 'utf8');
const posts = fs.readdirSync('./pages/blog').map(file => file);

const cachedPosts = {};

app.get('/', (req, res) => {
  const home = fs.readFileSync('./pages/home.md', 'utf8');
  const homeHTML = converter.makeHtml(home);
  const body = posts.map(post => `<li><a href="/blog/${post}">${post}</a></li>`).join('');
  res.send(layout.replace('<!--content-->', `${homeHTML} <ul>${body}</ul>`));
})

app.get('/blog/:id', (req, res) => {
  const { id } = req.params;
  const post = cachedPosts[id] || fs.readFileSync(`./pages/blog/${id}`, 'utf8');
  cachedPosts[id] = post;

  const html = converter.makeHtml(post);

  res.send(layout.replace('<!--content-->', html));;
})



app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})