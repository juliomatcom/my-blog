import fs from 'node:fs'
import path from 'node:path'

const dirname = path.dirname(new URL(import.meta.url).pathname)

const blogCache = {}

function getBlogFileSync (filename) {
  try {
    // TODO: improve to only read files we know exists
    const filePath = path.join(dirname, `../../pages/blog/${filename}`)
    const blogStr = blogCache[filename] || fs.readFileSync(filePath, 'utf8')
    blogCache[filename] = blogStr
    return blogStr
  } catch (error) {
    console.warn(`Error reading ${filename} file`, error)
    throw error
  }
}

function getPosts () {
  const blogPath = path.join(dirname, '../../pages/blog')
  return fs.readdirSync(blogPath)
    .map(file => file)
    .sort((blog1, blog2) => {
    // sort by date descending
      const dateBlog1 = getPostDate(blog1)
      const dateBlog2 = getPostDate(blog2)
      return dateBlog2 - dateBlog1
    })
}

function getPostDate (filename) {
  try {
    // format: YYYY-MM-DD
    const matchDate = /(\d{4}-\d{2}-\d{2})/
    return new Date(filename.match(matchDate)[0].replace('.md', ''))
  } catch (error) {
    console.warn(`Error getting date from ${filename}`, error)
    return null
  }
}

export {
  getBlogFileSync,
  getPosts
}
