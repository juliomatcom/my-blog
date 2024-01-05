function getPostTitle (str) {
  return str.split('\n')[0].replace('#', '').trim()
}

// try to get the first paragraph of the post
function getPostDescription (str) {
  try {
    const firtParagraphEndRegex = /[.]+[\s]/g
    const end = str.search(firtParagraphEndRegex)
    const start = str.slice(0, end).trim().lastIndexOf('\n')
    return str.slice(start, end) + '...'
  } catch (error) {
    console.warn(`Error getting paragraph from blog: ${str}`, error)
    return null
  }
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
  getPostTitle,
  getPostDescription,
  getPostDate
}
